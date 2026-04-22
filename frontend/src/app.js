// Atlas — Agentic RAG workbench (vanilla JS)
// Every control here is wired to the FastAPI backend. No fake buttons.

/* ========== Icons (inline SVG) ========== */
const ICON = {
  plus: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v10M3 8h10"/></svg>`,
  search: (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L13 13"/></svg>`,
  chat: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5A1.5 1.5 0 014.5 3h7A1.5 1.5 0 0113 4.5v5A1.5 1.5 0 0111.5 11H7l-3 2.5V11H4.5A1.5 1.5 0 013 9.5v-5z"/></svg>`,
  book: (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3.5A1.5 1.5 0 014.5 2H13v10H4.5A1.5 1.5 0 013 10.5v-7z"/><path d="M3 10.5A1.5 1.5 0 014.5 12H13v2H4.5A1.5 1.5 0 013 12.5"/></svg>`,
  settings: (s=16) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2"/><path d="M8 2v1.5M8 12.5V14M14 8h-1.5M3.5 8H2M12.2 3.8l-1 1M4.8 11.2l-1 1M12.2 12.2l-1-1M4.8 4.8l-1-1"/></svg>`,
  send: (s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M4 7l4-4 4 4"/></svg>`,
  attach: (s=12) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5.5L6.5 10a2.12 2.12 0 003 3l5-5a3.54 3.54 0 00-5-5l-5.5 5.5a5 5 0 007 7L12 10"/></svg>`,
  chev: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l4 4-4 4"/></svg>`,
  chevRight: (s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>`,
  panel: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M10 3v10"/></svg>`,
  menu: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h10M3 8h10M3 11h10"/></svg>`,
  upload: (s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10V3M5 6l3-3 3 3"/><path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11"/></svg>`,
  refresh: (s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7a5 5 0 019-3M12 7a5 5 0 01-9 3"/><path d="M11 1v3h-3M3 13v-3h3"/></svg>`,
  sparkles: (s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2l1.2 3.3L12.5 6.5 9.2 7.7 8 11l-1.2-3.3L3.5 6.5l3.3-1.2L8 2z"/><path d="M13 11l.5 1.3L14.8 13l-1.3.5L13 15l-.5-1.5L11.2 13l1.3-.5z"/></svg>`,
  copy: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M2 10V3a1 1 0 011-1h7"/></svg>`,
  thumbUp: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12V6l3-4c.8 0 1.2.7 1 1.5L8.5 6h2.8c.9 0 1.4.8 1.2 1.7l-.8 3.3c-.2.7-.8 1-1.4 1H5z"/><path d="M5 6H3v6h2"/></svg>`,
  thumbDown: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6l-3 4c-.8 0-1.2-.7-1-1.5L5.5 8H2.7C1.8 8 1.3 7.2 1.5 6.3l.8-3.3c.2-.7.8-1 1.4-1H9z"/><path d="M9 8h2V2H9"/></svg>`,
  x: (s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l8 8M11 3l-8 8"/></svg>`,
  globe: (s=12) => `<svg width="${s}" height="${s}" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="5"/><path d="M2 7h10M7 2a7 7 0 010 10M7 2a7 7 0 000 10"/></svg>`,
  activity: (s=12) => `<svg width="${s}" height="${s}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8h3l2-5 4 10 2-5h3"/></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h8M6 7v4M8 7v4M5.5 4V2.5h3V4M4 4l.5 8.5a.5.5 0 00.5.5h4a.5.5 0 00.5-.5L10 4"/></svg>`,
};

/* ========== Preferences ========== */
const PREF_KEY = "atlas.prefs.v1";
const defaultPrefs = {
  accent: "rust",
  theme: "light",
  answerFont: "serif",
  agentViz: "rail",
  density: "balanced",
  citeStyle: "number",
  sidebarCollapsed: false,
  mode: "agentic",
  searchMode: "balanced",
  ratings: {}, // messageId → 'up' | 'down'
};
function loadPrefs() {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") };
  } catch { return { ...defaultPrefs }; }
}
function savePrefs() {
  localStorage.setItem(PREF_KEY, JSON.stringify(state.prefs));
}

const ACCENTS = {
  rust:   { a: "oklch(58% 0.14 40)",  soft: "oklch(94% 0.03 40)",  ink: "oklch(35% 0.12 40)" },
  ink:    { a: "oklch(35% 0.02 60)",  soft: "oklch(92% 0.01 60)",  ink: "oklch(25% 0.02 60)" },
  moss:   { a: "oklch(52% 0.12 150)", soft: "oklch(94% 0.03 150)", ink: "oklch(32% 0.10 150)" },
  cobalt: { a: "oklch(52% 0.14 260)", soft: "oklch(94% 0.03 260)", ink: "oklch(32% 0.12 260)" },
  plum:   { a: "oklch(50% 0.14 320)", soft: "oklch(94% 0.03 320)", ink: "oklch(32% 0.12 320)" },
};

/* ========== Global state ========== */
const state = {
  prefs: loadPrefs(),
  view: "chat", // "chat" | "kb"
  sessions: [],
  activeSessionId: null,
  messages: [], // current session messages
  kbCount: 0,
  kbDocs: [],
  kbLoadedAt: null,
  isSending: false,
  streamingStatus: null, // "retrieving" | "generating" | null
  openSourceMsgIdx: null,
  openSourceN: null,
  agentOpenByMsg: {}, // msgId → bool
  tweaksOpen: false,
  kbSearch: "",
  kbFilter: "all",
  replyStart: null,
};

const root = document.getElementById("root");

/* ========== API helpers ========== */
async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `Request failed: ${res.status}`);
  }
  return res;
}

/* ========== Toast ========== */
let toastTimer = null;
function toast(msg) {
  let t = document.getElementById("atlas-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "atlas-toast";
    t.className = "toast hidden";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.remove("hidden");
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.classList.add("hidden"), 200);
  }, 2200);
}

/* ========== Utilities ========== */
const esc = (v) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function docTypeFromName(name) {
  const ext = (name || "").toLowerCase().split(".").pop();
  if (ext === "pdf") return "PDF";
  if (ext === "md" || ext === "markdown") return "MD";
  if (ext === "csv") return "CSV";
  if (ext === "txt") return "TXT";
  if (ext === "html" || ext === "htm") return "WEB";
  return ext ? ext.toUpperCase().slice(0, 3) : "DOC";
}

function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  return (parts[0]?.[0] || "A") + (parts[1]?.[0] || "");
}

/* ========== Markdown (light) ========== */
// Keeps [N] citation markers intact so renderAnswer can swap them later.
function renderInline(text) {
  // escape first, then selectively re-inject tags
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  return s;
}

function mdToBlocks(text) {
  const src = String(text || "").replace(/\r\n/g, "\n");
  const lines = src.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    // fenced code
    if (line.startsWith("```")) {
      let j = i + 1;
      const code = [];
      while (j < lines.length && !lines[j].startsWith("```")) { code.push(lines[j]); j++; }
      blocks.push({ t: "pre", text: code.join("\n") });
      i = j + 1;
      continue;
    }
    // heading
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) { blocks.push({ t: "h" + h[1].length, text: h[2] }); i++; continue; }
    // unordered list
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, "")); i++; }
      blocks.push({ t: "ul", items });
      continue;
    }
    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
      blocks.push({ t: "ol", items });
      continue;
    }
    // blockquote
    if (/^>\s?/.test(line)) {
      const qs = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { qs.push(lines[i].replace(/^>\s?/, "")); i++; }
      blocks.push({ t: "q", text: qs.join(" ") });
      continue;
    }
    // paragraph
    const p = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i]) && !/^#{1,3}\s+/.test(lines[i]) && !lines[i].startsWith("```") && !/^>\s?/.test(lines[i])) {
      p.push(lines[i]);
      i++;
    }
    blocks.push({ t: "p", text: p.join("\n") });
  }
  return blocks;
}

/**
 * Render text with [N] citation markers as clickable chips with hover tooltips.
 * sources: array from backend (order = citation number, 1-indexed).
 */
function injectCitations(inlineHtml, sources, msgIdx) {
  return inlineHtml.replace(/\[(\d+)\]/g, (full, nRaw) => {
    const n = parseInt(nRaw, 10);
    const src = sources[n - 1];
    if (!src) return full;
    const tip = `
      <span class="cite-tip">
        <span class="src-head">
          <span>${esc((src.mode || "source").toUpperCase())}</span>
          <span>·</span>
          <span>${esc(src.document_name || "Source")}</span>
        </span>
        <span class="src-title">${esc(src.summary || src.document_name || "Source")}</span>
        <span class="src-snippet">${esc((src.snippet || "").slice(0, 180))}</span>
      </span>`;
    return `<span class="cite-wrap"><button class="cite" data-cite-n="${n}" data-msg-idx="${msgIdx}" type="button">${n}</button>${tip}</span>`;
  });
}

function renderMarkdown(text, sources, msgIdx, streaming) {
  const blocks = mdToBlocks(text);
  const html = blocks.map((b, i) => {
    const last = i === blocks.length - 1;
    const caret = streaming && last && b.t === "p" ? '<span class="caret"></span>' : "";
    if (b.t === "h1") return `<h3>${injectCitations(renderInline(b.text), sources, msgIdx)}</h3>`;
    if (b.t === "h2") return `<h3>${injectCitations(renderInline(b.text), sources, msgIdx)}</h3>`;
    if (b.t === "h3") return `<h3>${injectCitations(renderInline(b.text), sources, msgIdx)}</h3>`;
    if (b.t === "ul") return `<ul>${b.items.map((it) => `<li>${injectCitations(renderInline(it), sources, msgIdx)}</li>`).join("")}</ul>`;
    if (b.t === "ol") return `<ol>${b.items.map((it) => `<li>${injectCitations(renderInline(it), sources, msgIdx)}</li>`).join("")}</ol>`;
    if (b.t === "q") return `<blockquote>${injectCitations(renderInline(b.text), sources, msgIdx)}</blockquote>`;
    if (b.t === "pre") return `<pre>${esc(b.text)}</pre>`;
    return `<p>${injectCitations(renderInline(b.text), sources, msgIdx)}${caret}</p>`;
  }).join("");
  return html || `<p>${caret(streaming)}</p>`;
}
function caret(on) { return on ? '<span class="caret"></span>' : ""; }

/* ========== Render: Sidebar ========== */
function sidebarHTML() {
  const collapsed = state.prefs.sidebarCollapsed;
  const threads = state.sessions.slice(0, 50);

  return `
    <aside class="sidebar">
      <button class="sidebar-edge-toggle" data-act="toggle-sidebar" title="Expand sidebar" aria-label="Expand sidebar">
        ${ICON.chevRight()}
      </button>

      <div class="sidebar-head">
        ${collapsed ? "" : `<div class="brand" title="Atlas"><div class="brand-mark"></div><span>Atlas</span></div>`}
        <button class="icon-btn" data-act="toggle-sidebar" title="${collapsed ? "Expand" : "Collapse"} sidebar"
                style="${collapsed ? "margin-left:auto;margin-right:auto;" : ""}">
          ${collapsed ? ICON.menu : ICON.panel}
        </button>
      </div>

      <button class="new-chat" data-act="new-session">
        ${ICON.plus}
        <span class="label">New inquiry</span>
        <span class="kbd">⌘K</span>
      </button>

      <div class="sidebar-nav">
        <button class="nav-item ${state.view === "chat" ? "active" : ""}" data-act="view-chat">
          ${ICON.chat}
          <span>Conversations</span>
          <span class="count">${state.sessions.length}</span>
        </button>
        <button class="nav-item ${state.view === "kb" ? "active" : ""}" data-act="view-kb">
          ${ICON.book()}
          <span>Knowledge base</span>
          <span class="count">${state.kbCount}</span>
        </button>
        <button class="nav-item" data-act="toggle-tweaks">
          ${ICON.settings()}
          <span>Settings</span>
        </button>
      </div>

      ${collapsed ? "" : `<div class="sidebar-section">Recent threads</div>`}
      ${collapsed ? "" : `
        <div class="thread-list">
          ${threads.length === 0
            ? `<div style="padding:10px 12px;color:var(--ink-4);font-size:12px;">No sessions yet.</div>`
            : threads.map((t) => `
              <button class="thread ${t.session_id === state.activeSessionId ? "active" : ""}" data-act="open-session" data-sid="${esc(t.session_id)}">
                <div class="thread-title">${esc(t.title || "Untitled")}</div>
                <div class="thread-meta">
                  <span>${relTime(t.updated_at || t.created_at)}</span>
                </div>
                <span class="thread-delete" data-act="delete-session" data-sid="${esc(t.session_id)}" title="Delete session">
                  ${ICON.trash}
                </span>
              </button>
            `).join("")}
        </div>
      `}

      <div class="sidebar-foot">
        <div class="avatar">AT</div>
        ${collapsed ? "" : `
          <div class="user-info">
            <div class="name">Researcher</div>
            <div class="plan">Local instance</div>
          </div>
        `}
      </div>
    </aside>
  `;
}

/* ========== Render: Topbar ========== */
function topbarHTML() {
  const activeSession = state.sessions.find((s) => s.session_id === state.activeSessionId);
  const hasAgentRail = state.prefs.agentViz === "rail" && state.view === "chat";
  const indexedAgo = state.kbLoadedAt ? relTime(state.kbLoadedAt) : "—";

  if (state.view === "kb") {
    return `
      <div class="topbar">
        <div class="topbar-title">
          <span class="title-text">Knowledge base</span>
        </div>
        <div class="topbar-spacer"></div>
        <span class="pill"><span class="dot"></span>${state.kbCount} indexed</span>
        <button class="btn ghost" data-act="reindex" title="Rebuild vector index">${ICON.refresh()} Rebuild</button>
        <button class="btn" data-act="toggle-tweaks" title="Open settings">${ICON.settings()}</button>
      </div>
    `;
  }

  return `
    <div class="topbar">
      <div class="topbar-title">
        ${activeSession
          ? `<span class="crumb-dim">Conversation</span><span class="crumb-sep">/</span><span class="title-text">${esc(activeSession.title || "Untitled")}</span>`
          : `<span class="title-text">New inquiry</span>`}
      </div>
      <div class="topbar-spacer"></div>
      <span class="pill"><span class="dot"></span>Indexed · ${esc(indexedAgo)}</span>
      ${state.prefs.agentViz !== "hidden"
        ? `<button class="btn ${hasAgentRail ? "active" : ""}" data-act="toggle-reasoning">
            ${ICON.sparkles(14)} Reasoning
          </button>`
        : ""}
      <button class="btn ghost" data-act="toggle-tweaks" title="Settings">${ICON.settings()}</button>
    </div>
  `;
}

/* ========== Render: Empty state ========== */
const SUGGESTIONS = [
  { kind: "Summary",    q: "Summarize the main themes across all indexed documents." },
  { kind: "Comparison", q: "Compare the risk factors across the indexed filings." },
  { kind: "Extraction", q: "Extract the key financial metrics from the most recent document." },
  { kind: "Timeline",   q: "Build a chronological timeline of the most important events." },
];

function emptyStateHTML() {
  const docChips = state.kbDocs.slice(0, 4).map((d) => `
    <button class="scope-chip" data-act="focus-doc" data-doc-id="${esc(d.id || d.name)}" title="${esc(d.name)}">
      <span>${esc(d.name)}</span>
      <span class="count">${d.chunk_count}</span>
    </button>
  `).join("");

  return `
    <div class="empty">
      <div class="empty-title">
        Ask <em class="accent">anything</em> across your indexed documents.
      </div>
      <div class="empty-sub">
        Atlas reads the documents you've indexed, routes your question through the chosen retrieval strategy,
        and returns answers with every claim tied to a source.
      </div>
      <div class="empty-scope">
        ${docChips || `<span class="scope-chip" style="color:var(--ink-3);">No documents indexed yet</span>`}
        <button class="scope-chip" data-act="upload" style="color: var(--ink-3);">
          ${ICON.plus} Add source
        </button>
      </div>
      <div class="suggested">
        ${SUGGESTIONS.map((s) => `
          <button class="suggest-card" data-act="ask-suggested" data-q="${esc(s.q)}">
            <span class="sc-kind">${esc(s.kind)}</span>
            <span class="sc-q">${esc(s.q)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

/* ========== Render: Agent inline timeline ========== */
function agentInlineHTML(msg, msgIdx) {
  const steps = msg.tool_trajectory || [];
  const streaming = msg.__streaming;
  const open = !!state.agentOpenByMsg[msg.message_id];
  const elapsed = msg.__elapsedMs != null ? `${(msg.__elapsedMs / 1000).toFixed(1)}s` : "";

  const label = streaming
    ? (state.streamingStatus === "generating" ? "Composing the answer" : "Thinking through your question")
    : `Answered with ${(msg.sources || []).length} source${(msg.sources || []).length === 1 ? "" : "s"}`;

  const detail = `${steps.length} step${steps.length === 1 ? "" : "s"} · ${esc(msg.mode || state.prefs.mode)} · ${esc(msg.fallback_used ? "fallback used" : "direct")}`;

  const body = open ? `
    <div class="agent-inline-body">
      ${steps.length === 0
        ? `<div class="agent-step"><span class="step-num">—</span><span class="step-kind">no tools</span><span class="step-detail">Model responded directly without invoking tools.</span><span class="step-time"></span></div>`
        : steps.map((s, i) => `
          <div class="agent-step">
            <div class="step-num">${String(i + 1).padStart(2, "0")}</div>
            <div class="step-kind ${(s.status === "completed" ? "" : "think")} ${(s.tool_name || "").includes("answer") ? "answer" : ""}">${esc(s.tool_name || "tool")}</div>
            <div class="step-detail"><b>${esc(s.query || "")}</b> ${s.summary ? "· " + esc(s.summary) : ""}</div>
            <div class="step-time">${esc(s.mode || s.status || "")}</div>
          </div>
        `).join("")}
    </div>
  ` : "";

  return `
    <button class="agent-inline-head ${open ? "open" : ""}" data-act="toggle-agent-inline" data-mid="${esc(msg.message_id)}">
      ${streaming ? '<div class="spinner"></div>' : '<div class="check">✓</div>'}
      <span class="label">${esc(label)}</span>
      <span class="dim">· ${detail}</span>
      ${elapsed ? `<span class="meta">${elapsed}</span>` : `<span class="meta"></span>`}
      <span class="chev">${ICON.chev}</span>
    </button>
    ${body}
  `;
}

/* ========== Render: Assistant turn ========== */
function assistantTurnHTML(msg, msgIdx) {
  const sources = msg.sources || [];
  const streaming = !!msg.__streaming;
  const proseHtml = renderMarkdown(msg.content || (streaming ? "" : ""), sources, msgIdx, streaming);

  const cards = state.prefs.citeStyle === "number" || state.prefs.citeStyle === "cards"
    ? sources.map((s, i) => `
        <button class="source-card" data-act="open-source" data-msg-idx="${msgIdx}" data-cite-n="${i + 1}">
          <div class="sc-head">
            <span class="num">${i + 1}</span>
            <span>${esc((s.mode || "source"))}</span>
            <span>·</span>
            <span>${esc(s.document_name || "source")}</span>
            <span style="margin-left:auto;">p.${esc(s.page ?? "—")}</span>
          </div>
          <div class="sc-title">${esc(s.summary || s.document_name || "Source")}</div>
          <div class="sc-snippet">${esc((s.snippet || "").slice(0, 240))}</div>
        </button>
      `).join("")
    : "";

  const rating = state.prefs.ratings?.[msg.message_id];

  const foot = !streaming && sources.length > 0 ? `
    <div class="answer-foot">
      <div class="sources-summary">
        <div class="source-stack">
          ${sources.slice(0, 4).map((s, i) => `
            <span class="src-chip" data-act="open-source" data-msg-idx="${msgIdx}" data-cite-n="${i + 1}" title="${esc(s.document_name || "")}">${i + 1}</span>
          `).join("")}
        </div>
        <span>Grounded in ${sources.length} source${sources.length === 1 ? "" : "s"}${msg.used_tools ? " · tools used" : ""}</span>
      </div>
      <button class="tiny-btn" data-act="copy-msg" data-mid="${esc(msg.message_id)}" title="Copy answer">${ICON.copy}</button>
      <button class="tiny-btn" data-act="regenerate" data-mid="${esc(msg.message_id)}" title="Regenerate answer">${ICON.refresh()}</button>
      <button class="tiny-btn ${rating === "up" ? "active" : ""}" data-act="rate" data-mid="${esc(msg.message_id)}" data-rating="up" title="Good answer">${ICON.thumbUp}</button>
      <button class="tiny-btn ${rating === "down" ? "active" : ""}" data-act="rate" data-mid="${esc(msg.message_id)}" data-rating="down" title="Poor answer">${ICON.thumbDown}</button>
    </div>
  ` : "";

  return `
    <div class="turn turn-assistant fade-up">
      <div class="assistant-avatar"></div>
      <div class="assistant-body">
        ${agentInlineHTML(msg, msgIdx)}
        <div class="prose">${proseHtml}</div>
        ${!streaming && sources.length > 0 ? `<div class="source-cards">${cards}</div>` : ""}
        ${foot}
      </div>
    </div>
  `;
}

function userTurnHTML(msg) {
  return `
    <div class="turn turn-user fade-up">
      <div class="bubble-user">${esc(msg.content || "")}</div>
    </div>
  `;
}

/* ========== Render: Composer ========== */
function composerHTML() {
  const deep = state.prefs.mode === "agentic" || state.prefs.mode === "hybrid";
  const web = state.prefs.mode === "corrective";
  const scopeLabel = state.kbCount > 0
    ? `${state.kbCount} document${state.kbCount === 1 ? "" : "s"}`
    : "Nothing indexed";
  return `
    <div class="composer-wrap">
      <div class="composer">
        <textarea id="composer-input" class="composer-input" rows="1"
          placeholder="Ask a grounded question…" ${state.isSending ? "disabled" : ""}></textarea>
        <div class="composer-row">
          <button class="composer-chip ${deep ? "active" : ""}" data-act="toggle-deep" title="Deep runs the agentic planner with iterative retrieval; Fast is a single retrieve-then-generate pass.">
            ${ICON.sparkles(12)} ${deep ? "Deep research" : "Fast retrieval"}
          </button>
          <button class="composer-chip" data-act="view-kb" title="Manage indexed documents (click to open the knowledge base)">
            ${ICON.book(12)} Scope: ${esc(scopeLabel)}
          </button>
          <button class="composer-chip" data-act="cycle-searchmode" title="Cycle retrieval strategy: balanced → semantic → keyword → exact">
            ${ICON.activity()} ${esc(state.prefs.searchMode)}
          </button>
          <button class="composer-chip" data-act="upload" title="Upload a PDF to the knowledge base">
            ${ICON.attach()} Attach
          </button>
          <button class="composer-chip ${web ? "active" : ""}" data-act="toggle-web" title="Enable Tavily web fallback when local retrieval is insufficient (corrective mode).">
            ${ICON.globe()} Web
          </button>
          <button class="composer-send" id="composer-send" data-act="send" ${state.isSending ? "disabled" : ""} title="Send (Enter)">
            ${ICON.send(14)}
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ========== Render: Agent rail (right) ========== */
function agentRailHTML() {
  const lastAssistant = [...state.messages].reverse().find((m) => m.role === "assistant");
  const streaming = !!(lastAssistant && lastAssistant.__streaming);
  const statusLabel = streaming
    ? (state.streamingStatus === "generating" ? "composing" : "retrieving")
    : lastAssistant ? "grounded" : "idle";

  const question = [...state.messages].reverse().find((m) => m.role === "user")?.content;
  const steps = lastAssistant?.tool_trajectory || [];
  const activeIdx = streaming ? steps.length - 1 : -1;

  const sources = lastAssistant?.sources || [];
  const elapsed = lastAssistant?.__elapsedMs;

  return `
    <aside class="agent-rail">
      <div class="rail-head">
        <div class="title">Reasoning</div>
        <span class="pill agent" style="margin-left:auto;">
          ${ICON.activity()} ${statusLabel}
        </span>
        <button class="icon-btn" data-act="hide-rail" title="Hide reasoning">${ICON.x()}</button>
      </div>
      <div class="rail-scroll">
        ${question ? `
          <div class="rail-group-title">Question</div>
          <div class="rail-question">"${esc(question)}"</div>
        ` : ""}

        <div class="rail-group-title">Agent trace</div>
        ${steps.length === 0 && !streaming ? `
          <div style="color:var(--ink-3);font-size:12px;">No tool calls recorded.</div>
        ` : `
          <div class="timeline">
            ${steps.map((s, i) => {
              const done = i < steps.length - 1 || !streaming;
              const active = i === activeIdx && streaming;
              return `
                <div class="tl-step ${done ? "done" : ""} ${active ? "active" : ""}">
                  <div class="dot"></div>
                  <div class="tl-kind">${esc(s.tool_name || "step")} · ${esc(s.mode || s.status || "")}</div>
                  <div class="tl-title">${esc(s.query || "")}</div>
                  ${s.summary ? `<div class="tl-detail">${esc(s.summary)}</div>` : ""}
                </div>
              `;
            }).join("")}
            ${streaming && steps.length === 0 ? `
              <div class="tl-step active">
                <div class="dot"></div>
                <div class="tl-kind">${esc(state.streamingStatus || "thinking")}</div>
                <div class="tl-title">Routing the request…</div>
              </div>
            ` : ""}
          </div>
        `}

        ${lastAssistant && !streaming ? `
          <div class="rail-group-title">Grounding</div>
          <div class="rail-stats">
            <div class="stat"><div class="v">${sources.length}</div><div class="l">Sources</div></div>
            <div class="stat"><div class="v">${lastAssistant.used_tools ? "yes" : "no"}</div><div class="l">Tools used</div></div>
            <div class="stat"><div class="v">${elapsed != null ? (elapsed / 1000).toFixed(1) + "s" : "—"}</div><div class="l">Time</div></div>
            <div class="stat"><div class="v">${lastAssistant.fallback_used ? "yes" : "no"}</div><div class="l">Fallback</div></div>
          </div>
        ` : !lastAssistant ? `
          <div class="rail-group-title">Workspace</div>
          <div class="rail-stats">
            <div class="stat"><div class="v">${state.kbCount}</div><div class="l">Documents</div></div>
            <div class="stat"><div class="v">${state.kbDocs.reduce((n, d) => n + (d.chunk_count || 0), 0)}</div><div class="l">Chunks</div></div>
            <div class="stat"><div class="v">${state.sessions.length}</div><div class="l">Sessions</div></div>
            <div class="stat"><div class="v">${esc(state.prefs.mode)}</div><div class="l">Mode</div></div>
          </div>
        ` : ""}
      </div>
    </aside>
  `;
}

/* ========== Render: Source panel ========== */
function sourcePanelHTML() {
  const msg = state.messages[state.openSourceMsgIdx];
  if (!msg) return "";
  const n = state.openSourceN;
  const src = (msg.sources || [])[n - 1];
  if (!src) return "";

  // Highlight query terms in snippet
  const q = [...state.messages].slice(0, state.openSourceMsgIdx).reverse().find((m) => m.role === "user")?.content || "";
  const terms = q.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
  let body = esc(src.snippet || src.summary || "");
  for (const t of terms.slice(0, 8)) {
    const re = new RegExp(`\\b(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi");
    body = body.replace(re, "<mark>$1</mark>");
  }

  return `
    <aside class="source-panel">
      <div class="sp-head">
        <span class="badge">${n}</span>
        <div class="title" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${esc(src.document_name || "Source")}
        </div>
        <button class="icon-btn" data-act="close-source" title="Close">${ICON.x()}</button>
      </div>
      <div class="sp-meta">
        <div class="item"><span class="k">mode</span><span style="text-transform:uppercase;">${esc(src.mode || "—")}</span></div>
        <div class="item"><span class="k">page</span>${esc(src.page ?? "—")}</div>
        <div class="item"><span class="k">score</span><span style="color:var(--accent-ink);">${Number(src.score || 0).toFixed(3)}</span></div>
        ${src.signals && Object.keys(src.signals).length > 0
          ? Object.entries(src.signals).slice(0, 3).map(([k, v]) => `<div class="item"><span class="k">${esc(k)}</span>${Number(v).toFixed(2)}</div>`).join("")
          : ""}
      </div>
      <div class="sp-body">
        <h4>Summary</h4>
        <p>${esc(src.summary || "—")}</p>
        <h4>Excerpt</h4>
        <p>${body}</p>
      </div>
    </aside>
  `;
}

/* ========== Render: Knowledge base ========== */
function knowledgeBaseHTML() {
  const totalChunks = state.kbDocs.reduce((n, d) => n + (d.chunk_count || 0), 0);
  const query = state.kbSearch.trim().toLowerCase();
  const filter = state.kbFilter;
  const filtered = state.kbDocs
    .filter((d) => !query || (d.name || "").toLowerCase().includes(query))
    .filter((d) => filter === "all" || docTypeFromName(d.name) === filter);

  return `
    <div class="chat-scroll">
      <div class="kb-wrap">
        <div class="kb-head">
          <div>
            <h1>Knowledge base</h1>
            <p>Atlas keeps your indexed corpus searchable in milliseconds. Upload documents and rebuild the index anytime.</p>
          </div>
          <div class="kb-tools">
            <button class="btn" data-act="reindex">${ICON.refresh()} Rebuild index</button>
            <button class="btn primary" data-act="upload">${ICON.upload()} Add source</button>
          </div>
        </div>

        <div class="kb-stats">
          <div class="kb-stat"><div class="v">${state.kbCount}</div><div class="l">Documents</div></div>
          <div class="kb-stat"><div class="v">${totalChunks.toLocaleString()}</div><div class="l">Chunks indexed</div></div>
          <div class="kb-stat"><div class="v">${esc(state.prefs.mode)}</div><div class="l">Active mode</div></div>
          <div class="kb-stat"><div class="v">${esc(state.prefs.searchMode)}</div><div class="l">Search mode</div></div>
        </div>

        <div class="kb-search">
          <span class="search-icon">${ICON.search(14)}</span>
          <input id="kb-search-input" type="search" placeholder="Search documents by name…" value="${esc(state.kbSearch)}" />
        </div>

        ${state.kbDocs.length === 0 ? `
          <div class="kb-empty">
            <div class="kb-empty-title">No documents indexed yet</div>
            <div>Click <strong>Add source</strong> above to upload a PDF and start asking grounded questions.</div>
          </div>
        ` : `
          <div class="kb-table">
            <div class="kb-row header">
              <div></div>
              <div>Document</div>
              <div>Type</div>
              <div>Chunks</div>
              <div>Status</div>
            </div>
            ${filtered.length === 0 ? `
              <div class="kb-row" style="grid-template-columns:1fr;padding:24px;color:var(--ink-3);">
                No documents match "${esc(query)}".
              </div>
            ` : filtered.map((d) => {
              const type = docTypeFromName(d.name);
              return `
                <div class="kb-row">
                  <div class="kb-doc-icon">${esc(type)}</div>
                  <div>
                    <div class="kb-doc-title">${esc(d.name)}</div>
                    <div class="kb-doc-path">${esc(d.id || "")}</div>
                  </div>
                  <div class="kb-num">${esc(type)}</div>
                  <div class="kb-num">${(d.chunk_count || 0).toLocaleString()}</div>
                  <div>
                    <span class="kb-status indexed"><span class="sdot"></span>indexed</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

/* ========== Render: Tweaks panel ========== */
function tweaksPanelHTML() {
  if (!state.tweaksOpen) return "";
  const p = state.prefs;
  const accentSwatches = Object.keys(ACCENTS).map((k) => `
    <button class="tweak-swatch ${p.accent === k ? "active" : ""}"
            style="background:${ACCENTS[k].a};"
            data-act="set-accent" data-v="${k}" aria-label="Accent ${k}"></button>
  `).join("");

  const optRow = (label, key, opts) => `
    <div class="tweak-row">
      <div class="tweak-label">${label}</div>
      <div class="tweak-options">
        ${opts.map((o) => `
          <button class="tweak-opt ${p[key] === o.v ? "active" : ""}" data-act="set-pref" data-key="${esc(key)}" data-v="${esc(o.v)}">${esc(o.l)}</button>
        `).join("")}
      </div>
    </div>
  `;

  return `
    <div class="tweaks-panel">
      <div class="tweaks-head">
        <span class="dot-mini"></span>
        <span>Tweaks</span>
        <span style="margin-left:auto;font-family:var(--mono);font-size:10px;color:var(--ink-4);font-weight:400;">atlas.v1</span>
        <button class="icon-btn close" data-act="toggle-tweaks" title="Close">${ICON.x()}</button>
      </div>
      <div class="tweaks-body">
        <div class="tweak-row">
          <div class="tweak-label">Accent</div>
          <div class="tweak-swatches">${accentSwatches}</div>
        </div>
        ${optRow("Theme", "theme", [{v:"light",l:"Light"},{v:"dark",l:"Dark"}])}
        ${optRow("Answer font", "answerFont", [{v:"serif",l:"Serif"},{v:"sans",l:"Sans"}])}
        ${optRow("Agent visibility", "agentViz", [{v:"rail",l:"Side rail"},{v:"inline",l:"Inline only"},{v:"hidden",l:"Hidden"}])}
        ${optRow("Density", "density", [{v:"spacious",l:"Spacious"},{v:"balanced",l:"Balanced"},{v:"dense",l:"Dense"}])}
        ${optRow("RAG mode", "mode", [{v:"two-step",l:"two-step"},{v:"agentic",l:"agentic"},{v:"corrective",l:"corrective"},{v:"hybrid",l:"hybrid"}])}
        ${optRow("Search mode", "searchMode", [{v:"balanced",l:"balanced"},{v:"semantic",l:"semantic"},{v:"keyword",l:"keyword"},{v:"exact",l:"exact"}])}
      </div>
      <div class="tweaks-foot">All settings saved locally.</div>
    </div>
  `;
}

/* ========== Main render ========== */
function render() {
  const p = state.prefs;
  const hasAgent = state.view === "chat" && p.agentViz === "rail" && state.messages.length > 0;
  const hasSource = state.openSourceMsgIdx != null;
  const appClass = `app ${p.sidebarCollapsed ? "sidebar-collapsed" : ""} ${hasSource ? "has-source" : hasAgent ? "has-agent" : ""}`;

  // chat column width
  const widthClass = p.density === "dense" ? "wide" : p.density === "spacious" ? "narrow" : "";

  // Apply accent / theme / prose font via CSS vars
  const accent = ACCENTS[p.accent] || ACCENTS.rust;
  document.documentElement.style.setProperty("--accent", accent.a);
  document.documentElement.style.setProperty("--accent-soft", accent.soft);
  document.documentElement.style.setProperty("--accent-ink", accent.ink);
  document.documentElement.setAttribute("data-theme", p.theme);
  document.documentElement.style.setProperty("--prose-font", p.answerFont === "sans" ? "var(--sans)" : "var(--serif)");

  let mainContent;
  if (state.view === "kb") {
    mainContent = knowledgeBaseHTML();
  } else if (state.messages.length === 0) {
    mainContent = `
      <div class="chat-scroll" id="chat-scroll">
        <div class="chat-col ${widthClass}">
          ${emptyStateHTML()}
        </div>
      </div>
      ${composerHTML()}
    `;
  } else {
    const messagesHtml = state.messages.map((m, i) => {
      if (m.role === "user") return userTurnHTML(m);
      if (p.agentViz === "hidden") {
        // override: hide inline trace when agent viz is hidden
        const original = assistantTurnHTML(m, i);
        return original.replace(/<button class="agent-inline-head[\s\S]*?<\/button>\s*(<div class="agent-inline-body"[\s\S]*?<\/div>)?/, "");
      }
      return assistantTurnHTML(m, i);
    }).join("");

    mainContent = `
      <div class="chat-scroll" id="chat-scroll">
        <div class="chat-col ${widthClass}">
          ${messagesHtml}
        </div>
      </div>
      ${composerHTML()}
    `;
  }

  const html = `
    <div class="${appClass}">
      ${sidebarHTML()}
      <main class="main">
        ${topbarHTML()}
        ${mainContent}
      </main>
      ${hasSource ? sourcePanelHTML() : hasAgent ? agentRailHTML() : ""}
    </div>
    ${tweaksPanelHTML()}
  `;
  root.innerHTML = html;

  // Re-focus composer input after render, preserve text
  const composerInput = document.getElementById("composer-input");
  if (composerInput && state.__composerValue != null) {
    composerInput.value = state.__composerValue;
    autoResizeComposer();
  }

  // Auto-scroll chat to bottom
  const scroller = document.getElementById("chat-scroll");
  if (scroller && state.__shouldScroll) {
    scroller.scrollTop = scroller.scrollHeight;
    state.__shouldScroll = false;
  }
}

function autoResizeComposer() {
  const ta = document.getElementById("composer-input");
  if (!ta) return;
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
}

/* ========== Event delegation ========== */
document.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.getAttribute("data-act");

  switch (act) {
    case "toggle-sidebar": {
      state.prefs.sidebarCollapsed = !state.prefs.sidebarCollapsed;
      savePrefs(); render(); break;
    }
    case "view-chat": {
      state.view = "chat"; render(); break;
    }
    case "view-kb": {
      state.view = "kb";
      await loadKnowledgeBase();
      render();
      break;
    }
    case "toggle-tweaks": {
      state.tweaksOpen = !state.tweaksOpen; render(); break;
    }
    case "toggle-reasoning": {
      state.prefs.agentViz = state.prefs.agentViz === "rail" ? "inline" : "rail";
      savePrefs(); render(); break;
    }
    case "hide-rail": {
      state.prefs.agentViz = "inline"; savePrefs(); render(); break;
    }
    case "new-session": {
      await createSession(); render(); break;
    }
    case "open-session": {
      const sid = btn.getAttribute("data-sid");
      await openSession(sid); break;
    }
    case "delete-session": {
      e.stopPropagation();
      const sid = btn.getAttribute("data-sid");
      await deleteSession(sid);
      break;
    }
    case "ask-suggested": {
      const q = btn.getAttribute("data-q");
      state.__composerValue = q;
      await sendMessage(q);
      break;
    }
    case "focus-doc": {
      state.view = "kb";
      state.kbSearch = btn.getAttribute("data-doc-id") || "";
      render();
      break;
    }
    case "upload": {
      triggerUpload(); break;
    }
    case "reindex": {
      await reindexKnowledgeBase(); break;
    }
    case "toggle-deep": {
      state.prefs.mode = (state.prefs.mode === "agentic" || state.prefs.mode === "hybrid") ? "two-step" : "agentic";
      savePrefs(); render(); break;
    }
    case "toggle-web": {
      state.prefs.mode = state.prefs.mode === "corrective" ? "agentic" : "corrective";
      savePrefs(); render(); break;
    }
    case "cycle-searchmode": {
      const modes = ["balanced", "semantic", "keyword", "exact"];
      const i = modes.indexOf(state.prefs.searchMode);
      state.prefs.searchMode = modes[(i + 1) % modes.length];
      savePrefs(); render(); break;
    }
    case "send": {
      const ta = document.getElementById("composer-input");
      const v = ta?.value?.trim();
      if (v) { state.__composerValue = ""; await sendMessage(v); }
      break;
    }
    case "open-source": {
      const idx = parseInt(btn.getAttribute("data-msg-idx"), 10);
      const n = parseInt(btn.getAttribute("data-cite-n"), 10);
      state.openSourceMsgIdx = idx;
      state.openSourceN = n;
      render();
      break;
    }
    case "close-source": {
      state.openSourceMsgIdx = null;
      state.openSourceN = null;
      render();
      break;
    }
    case "toggle-agent-inline": {
      const mid = btn.getAttribute("data-mid");
      state.agentOpenByMsg[mid] = !state.agentOpenByMsg[mid];
      render();
      break;
    }
    case "copy-msg": {
      const mid = btn.getAttribute("data-mid");
      const msg = state.messages.find((m) => m.message_id === mid);
      if (msg) {
        try {
          await navigator.clipboard.writeText(msg.content || "");
          toast("Answer copied");
        } catch { toast("Copy failed"); }
      }
      break;
    }
    case "regenerate": {
      // find the previous user message and resend
      const mid = btn.getAttribute("data-mid");
      const idx = state.messages.findIndex((m) => m.message_id === mid);
      let q;
      for (let i = idx - 1; i >= 0; i--) {
        if (state.messages[i].role === "user") { q = state.messages[i].content; break; }
      }
      if (q) await sendMessage(q);
      break;
    }
    case "rate": {
      const mid = btn.getAttribute("data-mid");
      const r = btn.getAttribute("data-rating");
      state.prefs.ratings = state.prefs.ratings || {};
      state.prefs.ratings[mid] = state.prefs.ratings[mid] === r ? null : r;
      savePrefs();
      toast(state.prefs.ratings[mid] === "up" ? "Thanks — marked as good" : state.prefs.ratings[mid] === "down" ? "Thanks — marked as poor" : "Rating cleared");
      render();
      break;
    }
    case "set-pref": {
      const k = btn.getAttribute("data-key");
      const v = btn.getAttribute("data-v");
      state.prefs[k] = v;
      savePrefs(); render(); break;
    }
    case "set-accent": {
      state.prefs.accent = btn.getAttribute("data-v");
      savePrefs(); render(); break;
    }
  }
});

// Preserve composer value across renders
document.addEventListener("input", (e) => {
  if (e.target.id === "composer-input") {
    state.__composerValue = e.target.value;
    autoResizeComposer();
  }
  if (e.target.id === "kb-search-input") {
    state.kbSearch = e.target.value;
    // local filter — render without loading
    render();
    // re-focus after render
    const el = document.getElementById("kb-search-input");
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }
});

// Enter = send in composer
document.addEventListener("keydown", async (e) => {
  if (e.target?.id === "composer-input" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const v = e.target.value?.trim();
    if (v && !state.isSending) { state.__composerValue = ""; await sendMessage(v); }
    return;
  }
  // ⌘K / Ctrl+K — new session
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    await createSession();
    render();
    return;
  }
  // Esc — close overlays
  if (e.key === "Escape") {
    if (state.openSourceMsgIdx != null) { state.openSourceMsgIdx = null; state.openSourceN = null; render(); }
    else if (state.tweaksOpen) { state.tweaksOpen = false; render(); }
  }
});

/* ========== Data ops ========== */
async function loadKnowledgeBase() {
  try {
    const res = await api("/knowledge/documents");
    const data = await res.json();
    state.kbCount = data.count ?? (data.documents?.length || 0);
    state.kbDocs = data.documents || [];
    state.kbLoadedAt = new Date().toISOString();
  } catch (e) {
    console.error("KB load failed", e);
    toast("Could not load knowledge base");
  }
}

async function loadSessions() {
  try {
    const res = await api("/sessions");
    state.sessions = await res.json();
  } catch (e) {
    console.error("Sessions load failed", e);
  }
}

async function createSession(title = "New inquiry") {
  const res = await api("/sessions", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  const session = await res.json();
  state.sessions.unshift(session);
  state.activeSessionId = session.session_id;
  state.messages = [];
  state.view = "chat";
  state.openSourceMsgIdx = null;
  return session;
}

async function openSession(sid) {
  state.activeSessionId = sid;
  state.view = "chat";
  state.openSourceMsgIdx = null;
  try {
    const res = await api(`/sessions/${sid}/messages`);
    state.messages = await res.json();
  } catch {
    state.messages = [];
  }
  state.__shouldScroll = true;
  render();
}

async function deleteSession(sid) {
  // backend has no delete endpoint; remove locally
  state.sessions = state.sessions.filter((s) => s.session_id !== sid);
  if (state.activeSessionId === sid) {
    state.activeSessionId = state.sessions[0]?.session_id || null;
    if (state.activeSessionId) await openSession(state.activeSessionId);
    else { state.messages = []; render(); }
  } else {
    render();
  }
  toast("Session removed from sidebar");
}

function triggerUpload() {
  let input = document.getElementById("__hidden-upload");
  if (!input) {
    input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.id = "__hidden-upload";
    input.style.display = "none";
    input.addEventListener("change", uploadFile);
    document.body.appendChild(input);
  }
  input.value = "";
  input.click();
}

async function uploadFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  toast(`Uploading ${file.name}…`);
  const fd = new FormData();
  fd.append("file", file);
  try {
    const r = await fetch("/api/knowledge/upload", { method: "POST", body: fd });
    if (!r.ok) throw new Error(await r.text());
    await loadKnowledgeBase();
    toast("Document indexed");
    render();
  } catch (err) {
    console.error(err);
    toast("Upload failed");
  }
}

async function reindexKnowledgeBase() {
  toast("Rebuilding index…");
  try {
    await api("/knowledge/reindex", { method: "POST" });
    await loadKnowledgeBase();
    toast("Index rebuilt");
    render();
  } catch (e) {
    toast("Rebuild failed");
  }
}

/* ========== Send message + stream ========== */
async function sendMessage(content) {
  if (!content || state.isSending) return;
  if (!state.activeSessionId) await createSession(content.slice(0, 40));

  const userMsg = {
    message_id: `local-u-${Date.now()}`,
    session_id: state.activeSessionId,
    role: "user",
    content,
    created_at: new Date().toISOString(),
  };
  const assistantMsg = {
    message_id: `local-a-${Date.now()}`,
    session_id: state.activeSessionId,
    role: "assistant",
    content: "",
    mode: state.prefs.mode,
    created_at: new Date().toISOString(),
    sources: [],
    tool_trajectory: [],
    used_tools: false,
    fallback_used: false,
    __streaming: true,
    __elapsedMs: null,
  };
  state.messages.push(userMsg);
  state.messages.push(assistantMsg);
  state.isSending = true;
  state.streamingStatus = "retrieving";
  state.__shouldScroll = true;
  state.__composerValue = "";
  state.replyStart = performance.now();
  render();

  try {
    const res = await api("/chat", {
      method: "POST",
      body: JSON.stringify({
        session_id: state.activeSessionId,
        message: content,
        mode: state.prefs.mode,
        search_mode: state.prefs.searchMode,
        stream: true,
      }),
    });
    await consumeStream(res, assistantMsg);
    assistantMsg.__elapsedMs = performance.now() - state.replyStart;
    assistantMsg.__streaming = false;
    state.streamingStatus = null;

    // refresh sessions (backend may have renamed the session based on first message)
    await loadSessions();
    await loadKnowledgeBase();
  } catch (err) {
    console.error(err);
    assistantMsg.content = `_An error occurred:_ ${err.message}`;
    assistantMsg.__streaming = false;
    state.streamingStatus = null;
    toast("Request failed");
  } finally {
    state.isSending = false;
    state.__shouldScroll = true;
    render();
  }
}

async function consumeStream(response, assistantMsg) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const raw of events) {
      if (!raw.trim()) continue;
      const lines = raw.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.slice(6).trim();
      let payload;
      try { payload = JSON.parse(dataLine.slice(5).trim()); }
      catch { continue; }

      if (event === "status") {
        if (payload.state === "retrieval-complete") state.streamingStatus = "generating";
        else state.streamingStatus = payload.state || "working";
        state.__shouldScroll = true;
        render();
      } else if (event === "delta") {
        assistantMsg.content += payload.content || "";
        state.__shouldScroll = true;
        render();
      } else if (event === "final") {
        assistantMsg.content = payload.answer || assistantMsg.content;
        assistantMsg.sources = payload.sources || [];
        assistantMsg.tool_trajectory = payload.tool_trajectory || [];
        assistantMsg.used_tools = !!payload.used_tools;
        assistantMsg.fallback_used = !!payload.fallback_used;
        assistantMsg.mode = payload.mode || assistantMsg.mode;
        state.__shouldScroll = true;
        render();
      }
    }
  }
}

/* ========== Boot ========== */
async function boot() {
  await Promise.all([loadKnowledgeBase(), loadSessions()]);
  if (state.sessions.length > 0) {
    state.activeSessionId = state.sessions[0].session_id;
    try {
      const r = await api(`/sessions/${state.activeSessionId}/messages`);
      state.messages = await r.json();
    } catch {}
  }
  state.__shouldScroll = true;
  render();
}

boot().catch((e) => {
  console.error(e);
  root.innerHTML = `<div style="padding:40px;font-family:sans-serif;">Failed to start: ${esc(e.message)}</div>`;
});
