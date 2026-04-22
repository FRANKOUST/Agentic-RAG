const demoQuestions = [
  "Summarize the key findings from the indexed reports.",
  "Compare the latest risk factors across uploaded filings.",
  "Identify mentions of hydrogen storage breakthroughs in source 2.",
  "Create a concise executive brief grounded in cited documents.",
];

const assets = {
  userAvatar: "/static/assets/user-avatar.png",
  assistantLogo: "/static/assets/brand-logo.png",
};

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
  sessionDateMarker: document.getElementById("session-date-marker"),
  newSessionBtn: document.getElementById("new-session-btn"),
  sendBtn: document.getElementById("send-btn"),
  messageInput: document.getElementById("message-input"),
  modeSelect: document.getElementById("mode-select"),
  searchModeSelect: document.getElementById("search-mode-select"),
  runStatus: document.getElementById("run-status"),
  kbStatus: document.getElementById("kb-status"),
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
  bindEvents();
  autoResizeTextarea();
  await loadKnowledgeBase();
  await loadSessions();

  if (!state.activeSessionId) {
    await createSession(demoQuestions[0]);
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
  elements.messageInput.addEventListener("input", autoResizeTextarea);
  elements.messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  elements.uploadBtn.addEventListener("click", () => elements.uploadInput.click());
  elements.uploadInput.addEventListener("change", uploadPdf);
  elements.reindexBtn.addEventListener("click", reindexKnowledgeBase);
}

function autoResizeTextarea() {
  elements.messageInput.style.height = "44px";
  elements.messageInput.style.height = `${Math.min(elements.messageInput.scrollHeight, 140)}px`;
}

async function loadKnowledgeBase() {
  const response = await api("/knowledge/documents");
  const data = await response.json();
  const docs = data.documents || [];
  const summary = docs
    .slice(0, 3)
    .map(
      (doc) => `
        <div class="kb-doc-row">
          <span class="kb-doc-name">${escapeHtml(doc.name)}</span>
          <span class="kb-doc-meta">${doc.chunk_count} chunks</span>
        </div>
      `,
    )
    .join("");

  elements.kbStatus.innerHTML = `
    <div class="kb-metric"><strong>${data.count}</strong> indexed document(s)</div>
    <div class="kb-doc-list">${summary || '<div class="kb-empty">No documents loaded yet.</div>'}</div>
  `;
}

async function uploadPdf() {
  const file = elements.uploadInput.files?.[0];
  if (!file) {
    return;
  }

  setStatus("Uploading");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/knowledge/upload", {
    method: "POST",
    body: formData,
  });

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

async function createSession(seedTitle = "Project Alpha") {
  const response = await api("/sessions", {
    method: "POST",
    body: JSON.stringify({
      title: seedTitle.length > 40 ? `${seedTitle.slice(0, 37)}...` : seedTitle,
    }),
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
    await createSession(content);
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
  autoResizeTextarea();
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
      if (!eventLine || !dataLine) {
        continue;
      }

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
  if (activeSession?.created_at) {
    const d = new Date(activeSession.created_at);
    elements.sessionDateMarker.textContent = `Session Started — ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }
  elements.modeSelect.value = state.mode;
  elements.searchModeSelect.value = state.searchMode;

  if (scrollToBottom) {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
  }
}

function renderSessions() {
  elements.sessionList.innerHTML = "";

  for (const session of state.sessions) {
    const item = document.createElement("button");
    item.className = `session-item ${session.session_id === state.activeSessionId ? "active" : ""}`;
    item.innerHTML = `
      <span class="session-item-icon" aria-hidden="true">${buildMessageSquareIcon()}</span>
      <span class="session-copy">
        <strong>${escapeHtml(session.title || "Untitled")}</strong>
        <span class="empty-state">${new Date(session.updated_at).toLocaleDateString()}</span>
      </span>
    `;
    item.addEventListener("click", () => loadMessages(session.session_id));
    elements.sessionList.appendChild(item);
  }
}

function renderMessages() {
  if (state.messages.length === 0) {
    elements.messages.innerHTML = `
      <article class="welcome-card">
        ${renderAssistantBadge()}
        <div class="welcome-body">
          <div class="welcome-content markdown-body">
            <h2>Analysis of Market Trends</h2>
            <p>I have compiled the recent quarterly reports from the energy sector.</p>
            <p>Ask for comparisons, source-grounded takeaways, or cross-document synthesis and I will keep the answer tied to your indexed material.</p>
          </div>
        </div>
      </article>
    `;
    return;
  }

  elements.messages.innerHTML = state.messages.map((message) => renderMessage(message)).join("");

  if (state.isSending) {
    elements.messages.insertAdjacentHTML(
      "beforeend",
      `
        <div class="typing-row">
          ${renderAssistantBadge()}
          <div class="typing-pill"></div>
        </div>
      `,
    );
  }
}

function renderMessage(message) {
  if (message.role === "user") {
    return `
      <article class="message-card user">
        <div class="message-body user-body">
          <div class="message-shell">
            <div class="message-bubble">
              <div class="message-content markdown-body">${renderMarkdown(message.content || "")}</div>
            </div>
            <img class="avatar" src="${assets.userAvatar}" alt="User avatar" />
          </div>
        </div>
      </article>
    `;
  }

  return `
    <article class="message-card assistant">
      ${renderAssistantBadge()}
      <div class="message-body">
        <div class="message-bubble assistant-bubble">
          <div class="message-heading">${deriveHeading(message.content)}</div>
          <div class="message-content markdown-body">${renderMarkdown(message.content || "")}</div>
        </div>
        ${renderSourceSection(message.sources || [])}
        ${renderTrajectorySection(message.tool_trajectory || [], message)}
      </div>
    </article>
  `;
}

function renderAssistantBadge() {
  return `
    <div class="assistant-badge">
      <img class="assistant-badge-logo" src="${assets.assistantLogo}" alt="Assistant" />
    </div>
  `;
}

function renderSourceSection(sources) {
  if (!sources.length) {
    return "";
  }

  const pills = sources
    .slice(0, 3)
    .map(
      (source) => `
        <span class="source-pill">
          <span class="source-pill-icon">${buildLinkIcon()}</span>
          <span>${escapeHtml(source.document_name || "Source")}</span>
        </span>
      `,
    )
    .join("");

  const cards = sources
    .map(
      (source) => `
        <article class="citation-card">
          <div class="citation-topline">
            <span class="citation-file">${escapeHtml(source.document_name || "Source")}</span>
            <span class="citation-meta">Page ${escapeHtml(source.page ?? "-")}</span>
          </div>
          <div class="citation-summary">${escapeHtml(source.summary || "Supporting source")}</div>
          <div class="citation-snippet">${escapeHtml(source.snippet || "")}</div>
          <div class="citation-footer">
            <span>${escapeHtml(source.mode || "balanced")}</span>
            <span>Score ${Number(source.score || 0).toFixed(3)}</span>
          </div>
        </article>
      `,
    )
    .join("");

  return `
    <div class="source-row">${pills}</div>
    <details class="citation-details">
      <summary>Sources (${sources.length})</summary>
      <div class="citation-grid">${cards}</div>
    </details>
  `;
}

function renderTrajectorySection(steps, message) {
  const pills = [
    `<span class="trace-pill">mode:${escapeHtml(message.mode || state.mode)}</span>`,
    `<span class="trace-pill">tools:${message.used_tools ? "yes" : "no"}</span>`,
    message.fallback_used ? `<span class="trace-pill">fallback:yes</span>` : "",
  ].join("");

  if (!steps.length) {
    return `<div class="trace-row">${pills}</div>`;
  }

  const cards = steps
    .map(
      (step) => `
        <div class="trace-card">
          <div class="trace-card-top">
            <span class="trace-card-name">${escapeHtml(step.tool_name || "Tool")}</span>
            <span class="trace-card-mode">${escapeHtml(step.mode || step.status || "completed")}</span>
          </div>
          <div class="trace-card-query">${escapeHtml(step.query || "")}</div>
          <div class="trace-card-summary">${escapeHtml(step.summary || "")}</div>
        </div>
      `,
    )
    .join("");

  return `
    <div class="trace-row">${pills}</div>
    <details class="citation-details">
      <summary>Tool Trajectory (${steps.length})</summary>
      <div class="trace-grid">${cards}</div>
    </details>
  `;
}

function deriveHeading(content = "") {
  const firstLine = content.split("\n").find((entry) => entry.trim().length > 0) || "Analysis of Market Trends";
  return escapeHtml(firstLine.replace(/^#+\s*/, "").slice(0, 72));
}

function renderMarkdown(input) {
  const source = String(input || "").replace(/\r\n/g, "\n");
  const codeBlocks = [];
  const withTokens = source.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang = "", code = "") => {
    const token = `@@CODE${codeBlocks.length}@@`;
    codeBlocks.push({ lang, code });
    return token;
  });

  const blocks = withTokens.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const html = blocks
    .map((block) => {
      if (/^@@CODE\d+@@$/.test(block)) {
        const index = Number(block.match(/\d+/)[0]);
        const item = codeBlocks[index];
        return `<pre class="code-block"><code data-lang="${escapeHtml(item.lang || "text")}">${escapeHtml(item.code.trim())}</code></pre>`;
      }

      if (/^#{1,3}\s/.test(block)) {
        const level = Math.min(3, (block.match(/^#+/)[0] || "").length);
        const text = block.replace(/^#{1,3}\s*/, "");
        return `<h${level}>${renderInlineMarkdown(text)}</h${level}>`;
      }

      if (/^(?:[-*]\s.+\n?)+$/.test(block)) {
        const items = block.split("\n").map((line) => line.replace(/^[-*]\s+/, "").trim()).filter(Boolean);
        return `<ul>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`;
      }

      if (/^(?:\d+\.\s.+\n?)+$/.test(block)) {
        const items = block.split("\n").map((line) => line.replace(/^\d+\.\s+/, "").trim()).filter(Boolean);
        return `<ol>${items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ol>`;
      }

      if (/^>\s?/.test(block)) {
        const quote = block.split("\n").map((line) => line.replace(/^>\s?/, "").trim()).join(" ");
        return `<blockquote>${renderInlineMarkdown(quote)}</blockquote>`;
      }

      return `<p>${block.split("\n").map((line) => renderInlineMarkdown(line)).join("<br />")}</p>`;
    })
    .join("");

  return html || `<p>${renderInlineMarkdown(source)}</p>`;
}

function renderInlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, "$1<em>$2</em>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return html;
}

function buildMessageSquareIcon() {
  return `
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M4.75 5.25H15.25C15.6642 5.25 16 5.58579 16 6V12.5C16 12.9142 15.6642 13.25 15.25 13.25H8.75L5.25 15.75V13.25H4.75C4.33579 13.25 4 12.9142 4 12.5V6C4 5.58579 4.33579 5.25 4.75 5.25Z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/>
    </svg>
  `;
}

function buildLinkIcon() {
  return `
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M8 10.8L6.6 12.2C5.8268 12.9732 5.8268 14.2268 6.6 15C7.3732 15.7732 8.6268 15.7732 9.4 15L10.8 13.6M12 9.2L13.4 7.8C14.1732 7.0268 14.1732 5.7732 13.4 5C12.6268 4.2268 11.3732 4.2268 10.6 5L9.2 6.4M7.6 12.4L12.4 7.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

boot().catch((error) => {
  console.error(error);
  setStatus("Bootstrap Error");
});
