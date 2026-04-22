# Agentic RAG Demo

A fully runnable **Agentic Retrieval-Augmented Generation** workbench with a FastAPI backend and a clean chat-style frontend. Supports four retrieval modes — `two-step`, `agentic`, `corrective`, and `hybrid` — all from a single codebase with zero build step for the frontend.

![Python](https://img.shields.io/badge/python-3.11%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688)
![License](https://img.shields.io/badge/license-MIT-green)
![uv](https://img.shields.io/badge/managed%20by-uv-5c3bff)

---

## Features

- **PDF knowledge base** — upload any PDF; the system chunks, embeds, and indexes it automatically
- **Four RAG modes** — switch between retrieval strategies without restarting the server
- **Streaming responses** — Server-Sent Events (SSE) stream tokens to the UI in real time
- **Source attribution** — every answer shows the source documents, page numbers, and relevance scores
- **Tool trajectory view** — inspect every tool call the agent made before generating an answer
- **Session management** — persistent multi-session chat history stored locally
- **Zero build frontend** — pure HTML/CSS/JS served directly by FastAPI; no Node.js required
- **Graceful degradation** — Tavily search and OceanBase vector store are optional; the app falls back to local implementations when they are absent

---

## Architecture

```
┌─────────────────────────────────┐
│         Browser (SPA)           │
│  HTML · CSS · Vanilla JS · SSE  │
└────────────────┬────────────────┘
                 │ HTTP / SSE
┌────────────────▼────────────────┐
│        FastAPI Backend          │
│  /api/chat  /api/sessions       │
│  /api/knowledge  /api/health    │
└──────┬──────────────┬───────────┘
       │              │
┌──────▼──────┐  ┌────▼────────────────┐
│  Chat       │  │  Knowledge Base     │
│  Service    │  │  Service            │
│  (4 modes)  │  │  Chunking · Embed   │
└──────┬──────┘  │  Rerank · Retrieve  │
       │         └─────────────────────┘
┌──────▼──────────────────────────┐
│  LangChain / LangGraph          │
│  + SiliconFlow / OpenAI LLMs    │
│  + OceanBase Vector (optional)  │
│  + Tavily Web Search (optional) │
└─────────────────────────────────┘
```

---

## Retrieval Modes

| Mode | Description |
|---|---|
| `two-step` | Fixed pipeline: retrieve → generate. Simple and predictable. |
| `agentic` | An LLM agent decides whether to retrieve and which tool to call. Falls back to local implementations when external APIs are not configured. |
| `corrective` | Retrieve → relevance-score chunks → fall back to Tavily web search when local results are insufficient. |
| `hybrid` | Fuses dense (vector), sparse (BM25), and full-text search with configurable weighting. |

---

## Quick Start

### Prerequisites

- Python 3.11+
- [`uv`](https://github.com/astral-sh/uv) package manager

### 1. Clone & install

```bash
git clone https://github.com/FRANKOUST/Agentic-RAG.git
cd Agentic-RAG
uv sync
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum a `SILICONFLOW_API_KEY` (or any OpenAI-compatible endpoint). All other values — OceanBase, Tavily, LangSmith — are optional.

| Variable | Required | Description |
|---|---|---|
| `SILICONFLOW_API_KEY` | Yes | API key for the LLM / embedding provider |
| `SILICONFLOW_BASE_URL` | Yes | OpenAI-compatible base URL |
| `SILICONFLOW_CHAT_MODEL` | Yes | Chat model name (e.g. `Qwen/Qwen3-8B`) |
| `SILICONFLOW_EMBEDDING_MODEL` | Yes | Embedding model (e.g. `BAAI/bge-m3`) |
| `SILICONFLOW_RERANK_MODEL` | No | Reranker model for corrective / hybrid modes |
| `OCEANBASE_HOST` | No | OceanBase vector store host |
| `TAVILY_API_KEY` | No | Tavily search API key for web fallback |
| `LANGCHAIN_API_KEY` | No | LangSmith tracing |

### 3. Bootstrap demo data

The repository ships with `nke-10k-2023.pdf` (Nike 2023 10-K filing) as a demo corpus.

```bash
uv run python scripts/bootstrap_demo_data.py
```

### 4. Start the server

```bash
uv run uvicorn backend.app.main:app --reload
```

Open **http://127.0.0.1:8000** in your browser.

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/routers/     # FastAPI route handlers (chat, sessions, knowledge, health)
│   │   ├── agent/           # LangGraph agentic RAG implementation
│   │   ├── corrective_rag/  # Corrective RAG with relevance scoring & web fallback
│   │   ├── core/            # Logging, exception handling
│   │   ├── kb/              # PDF ingestion, chunking, embedding, index management
│   │   ├── retrieval/       # Dense / sparse / hybrid retrieval strategies
│   │   ├── rerank/          # Cross-encoder reranking
│   │   ├── services/        # ChatService, KnowledgeBaseService, SessionService
│   │   ├── schemas/         # Pydantic request / response models
│   │   ├── config/          # Settings loaded from .env
│   │   └── main.py          # FastAPI app factory
│   ├── data/                # Runtime data (gitignored — created on first run)
│   └── tests/
│       ├── unit/
│       └── integration/
├── frontend/
│   └── src/
│       ├── index.html       # Single-page app shell
│       ├── styles.css       # Design tokens & component styles
│       ├── app.js           # Vanilla JS app (no framework, no bundler)
│       └── assets/          # Static images
├── scripts/
│   ├── bootstrap_demo_data.py
│   └── ingest_nike_10k.py
├── nke-10k-2023.pdf         # Demo corpus (Nike 2023 10-K)
├── pyproject.toml
├── uv.lock
└── .env.example
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message; returns an SSE stream |
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/sessions` | Create a new session |
| `GET` | `/api/sessions/{id}/messages` | Fetch messages for a session |
| `POST` | `/api/knowledge/upload` | Upload a PDF to the knowledge base |
| `POST` | `/api/knowledge/reindex` | Rebuild the vector index |
| `GET` | `/api/knowledge/documents` | List indexed documents |
| `GET` | `/api/health` | Health check |

The chat endpoint accepts:

```json
{
  "session_id": "string",
  "message": "string",
  "mode": "two-step | agentic | corrective | hybrid",
  "search_mode": "balanced | semantic | keyword | exact",
  "stream": true
}
```

---

## Development

### Run tests

```bash
uv run pytest -q -c pytest.ini
```

### Lint & format

```bash
uv run ruff check .
uv run black .
```

### Add a new document at startup

Drop any PDF into `backend/data/uploads/` before running `bootstrap_demo_data.py`, or use the `/api/knowledge/upload` endpoint at runtime.

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you would like to change. For pull requests:

1. Fork the repo and create your branch from `main`
2. Run the test suite and ensure all tests pass
3. Follow the existing code style (`ruff` + `black`)
4. Update documentation if needed

---

## License

This project is released under the [MIT License](LICENSE).
