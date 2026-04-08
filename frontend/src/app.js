const demoQuestions = [
  "What were Nike's total revenues in fiscal 2023?",
  "Compare Nike Direct with wholesale performance.",
  "Summarize Nike's digital strategy, then compare it with risk factors.",
  "Find Item 1A Risk Factors and explain the main themes.",
];

const state = {
  sessions: [],
  activeSessionId: null,
  messages: [],
  mode: "agentic",
  searchMode: "balanced",
  isSending: false,
};

const elements = {
  sessionList: document.getElementById("session-list"),
  messages: document.getElementById("messages"),
  sessionTitle: document.getElementById("session-title"),
  newSessionBtn: document.getElementById("new-session-btn"),
  sendBtn: document.getElementById("send-btn"),
  messageInput: document.getElementById("message-input"),
  modeSelect: document.getElementById("mode-select"),
  searchModeSelect: document.getElementById("search-mode-select"),
  runStatus: document.getElementById("run-status"),
  kbStatus: document.getElementById("kb-status"),
  demoQuestions: document.getElementById("demo-questions"),
  uploadInput: document.getElementById("upload-input"),
  uploadBtn: document.getElementById("upload-btn"),
  reindexBtn: document.getElementById("reindex-btn"),
};

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }
  return response;
}

async function boot() {
  renderDemoQuestions();
  bindEvents();
  await loadKnowledgeBase();
  await loadSessions();
  if (!state.activeSessionId) {
    await createSession();
  }
  render();
}

function bindEvents() {
  elements.newSessionBtn.addEventListener("click", () => createSession());
  elements.sendBtn.addEventListener("click", () => sendMessage());
  elements.modeSelect.addEventListener("change", (event) => {
    state.mode = event.target.value;
  });
  elements.searchModeSelect.addEventListener("change", (event) => {
    state.searchMode = event.target.value;
  });
  elements.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  elements.uploadBtn.addEventListener("click", uploadPdf);
  elements.reindexBtn.addEventListener("click", reindexKnowledgeBase);
}

function renderDemoQuestions() {
  elements.demoQuestions.innerHTML = "";
  for (const question of demoQuestions) {
    const button = document.createElement("button");
    button.className = "demo-question";
    button.textContent = question;
    button.addEventListener("click", () => {
      elements.messageInput.value = question;
      sendMessage();
    });
    elements.demoQuestions.appendChild(button);
  }
}

async function loadKnowledgeBase() {
  const response = await api("/knowledge/documents");
  const data = await response.json();
  elements.kbStatus.innerHTML = `
    <div><strong>${data.count}</strong> document(s) indexed</div>
    <div>${data.documents.map((doc) => `${doc.name} · ${doc.chunk_count} chunks`).join("<br/>") || "No documents loaded yet."}</div>
  `;
}

async function uploadPdf() {
  const file = elements.uploadInput.files?.[0];
  if (!file) {
    setStatus("Select a PDF first");
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/knowledge/upload", { method: "POST", body: formData });
  if (!response.ok) {
    setStatus("Upload failed");
    return;
  }
  elements.uploadInput.value = "";
  await loadKnowledgeBase();
  setStatus("Upload complete");
}

async function reindexKnowledgeBase() {
  setStatus("Reindexing");
  await api("/knowledge/reindex", { method: "POST" });
  await loadKnowledgeBase();
  setStatus("Reindex complete");
}

async function loadSessions() {
  const response = await api("/sessions");
  state.sessions = await response.json();
  if (state.sessions.length > 0) {
    state.activeSessionId = state.activeSessionId || state.sessions[0].session_id;
    await loadMessages(state.activeSessionId);
  }
}

async function createSession() {
  const response = await api("/sessions", {
    method: "POST",
    body: JSON.stringify({ title: "New Session" }),
  });
  const session = await response.json();
  state.sessions.unshift(session);
  state.activeSessionId = session.session_id;
  state.messages = [];
  render();
}

async function loadMessages(sessionId) {
  const response = await api(`/sessions/${sessionId}/messages`);
  state.messages = await response.json();
  state.activeSessionId = sessionId;
  render();
}

function setStatus(label) {
  elements.runStatus.textContent = label;
}

async function sendMessage() {
  const content = elements.messageInput.value.trim();
  if (!content || state.isSending) {
    return;
  }
  if (!state.activeSessionId) {
    await createSession();
  }

  const userMessage = {
    message_id: `local-user-${Date.now()}`,
    session_id: state.activeSessionId,
    role: "user",
    content,
    created_at: new Date().toISOString(),
  };
  state.messages.push(userMessage);
  elements.messageInput.value = "";
  state.isSending = true;
  setStatus("Retrieving");

  const assistantMessage = {
    message_id: `local-assistant-${Date.now()}`,
    session_id: state.activeSessionId,
    role: "assistant",
    content: "",
    mode: state.mode,
    created_at: new Date().toISOString(),
    sources: [],
    tool_trajectory: [],
    used_tools: false,
    fallback_used: false,
  };
  state.messages.push(assistantMessage);
  render();

  try {
    const response = await api("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: state.activeSessionId,
        message: content,
        mode: state.mode,
        search_mode: state.searchMode,
        stream: true,
      }),
    });
    await consumeEventStream(response, assistantMessage);
    await loadSessions();
    await loadMessages(state.activeSessionId);
    await loadKnowledgeBase();
    setStatus("Completed");
  } catch (error) {
    assistantMessage.content = `Error: ${error.message}`;
    setStatus("Error");
    render();
  } finally {
    state.isSending = false;
  }
}

async function consumeEventStream(response, assistantMessage) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const raw of events) {
      const lines = raw.split("\n");
      const eventLine = lines.find((line) => line.startsWith("event:"));
      const dataLine = lines.find((line) => line.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.replace("event:", "").trim();
      const payload = JSON.parse(dataLine.replace("data:", "").trim());

      if (event === "status") {
        setStatus(payload.state === "retrieval-complete" ? "Generating" : payload.state);
      }
      if (event === "delta") {
        assistantMessage.content += payload.content;
        render(false);
      }
      if (event === "final") {
        assistantMessage.content = payload.answer;
        assistantMessage.sources = payload.sources || [];
        assistantMessage.tool_trajectory = payload.tool_trajectory || [];
        assistantMessage.used_tools = payload.used_tools;
        assistantMessage.fallback_used = payload.fallback_used;
        assistantMessage.mode = payload.mode;
        render(false);
      }
    }
  }
}

function render(scrollToBottom = true) {
  renderSessions();
  renderMessages();
  const activeSession = state.sessions.find((session) => session.session_id === state.activeSessionId);
  elements.sessionTitle.textContent = activeSession?.title || "New Session";
  elements.modeSelect.value = state.mode;
  elements.searchModeSelect.value = state.searchMode;
  if (scrollToBottom) {
    window.requestAnimationFrame(() => {
      elements.messages.scrollTop = elements.messages.scrollHeight;
    });
  }
}

function renderSessions() {
  elements.sessionList.innerHTML = "";
  for (const session of state.sessions) {
    const item = document.createElement("button");
    item.className = `session-item ${session.session_id === state.activeSessionId ? "active" : ""}`;
    item.innerHTML = `<strong>${session.title}</strong><div class="empty-state">${new Date(session.updated_at).toLocaleString()}</div>`;
    item.addEventListener("click", () => loadMessages(session.session_id));
    elements.sessionList.appendChild(item);
  }
}

function renderMessages() {
  if (state.messages.length === 0) {
    elements.messages.innerHTML = `
      <article class="welcome-card">
        <p class="eyebrow">Ready To Demo</p>
        <h2>Ask a grounded question about Nike's 10-K.</h2>
        <p class="muted">Use two-step for a deterministic baseline, agentic for tool-routing, corrective for graded fallback, or hybrid to showcase retrieval-mode control.</p>
      </article>
    `;
    return;
  }

  elements.messages.innerHTML = "";
  for (const message of state.messages) {
    const article = document.createElement("article");
    article.className = `message-card ${message.role}`;
    article.innerHTML = `
      <div class="message-role">${message.role}</div>
      <div class="message-content">${escapeHtml(message.content || "")}</div>
      ${message.role === "assistant" ? renderAssistantFooter(message) : ""}
    `;
    elements.messages.appendChild(article);
  }
}

function renderAssistantFooter(message) {
  const pills = [
    `<span class="pill">mode:${message.mode || state.mode}</span>`,
    `<span class="pill">tools:${message.used_tools ? "yes" : "no"}</span>`,
    message.fallback_used ? `<span class="pill">fallback:yes</span>` : "",
  ].join("");

  const sources = (message.sources || [])
    .map(
      (source) => `
        <div class="source-item">
          <div class="source-meta">${source.document_name} · page ${source.page} · score ${Number(source.score || 0).toFixed(3)}</div>
          <strong>${escapeHtml(source.summary || "Source")}</strong>
          <div>${escapeHtml(source.snippet || "")}</div>
        </div>
      `
    )
    .join("");

  const trajectory = (message.tool_trajectory || [])
    .map(
      (step) => `
        <div class="trajectory-item">
          <div class="trajectory-meta">${step.tool_name}${step.mode ? ` · ${step.mode}` : ""}</div>
          <strong>${escapeHtml(step.query || "")}</strong>
          <div>${escapeHtml(step.summary || "")}</div>
        </div>
      `
    )
    .join("");

  return `
    <div class="message-footer">
      <div class="pill-row">${pills}</div>
      ${(message.sources || []).length ? `<details><summary>Sources (${message.sources.length})</summary>${sources}</details>` : ""}
      ${(message.tool_trajectory || []).length ? `<details><summary>Tool Trajectory (${message.tool_trajectory.length})</summary>${trajectory}</details>` : ""}
    </div>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

boot().catch((error) => {
  console.error(error);
  setStatus("Bootstrap Error");
});
