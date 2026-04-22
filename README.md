# Agentic RAG 演示

一套可直接运行的**智能体检索增强生成**工作台。FastAPI 后端 + 零构建的纯 HTML/CSS/JS 前端，单一代码仓同时支持 `two-step`、`agentic`、`corrective`、`hybrid` 四种检索模式。前端界面采用 Claude Design 的 Atlas 设计语言，全中文交互。

![Python](https://img.shields.io/badge/python-3.11%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688)
![License](https://img.shields.io/badge/license-MIT-green)
![uv](https://img.shields.io/badge/managed%20by-uv-5c3bff)

---

## 亮点

- **PDF 知识库**：上传任意 PDF，系统自动分块、向量化并建立索引
- **四种 RAG 模式**：无需重启即可在不同检索策略间切换
- **流式回答**：基于 SSE 的实时 token 流式输出
- **来源可追溯**：每条结论都附带文档名、页码、相关度与可跳转的来源卡片
- **执行轨迹可视化**：可展开每一次工具调用（检索 / 重排 / Web 回退）
- **会话管理**：多会话的对话历史，本地持久化
- **零构建前端**：纯 HTML/CSS/JS 由 FastAPI 直接托管，无需 Node.js
- **优雅降级**：OceanBase 向量库与 Tavily Web 搜索均为可选，未配置时自动回退到本地实现

---

## 架构

```
┌─────────────────────────────────┐
│       浏览器 (单页应用)          │
│   HTML · CSS · 原生 JS · SSE    │
└────────────────┬────────────────┘
                 │ HTTP / SSE
┌────────────────▼────────────────┐
│        FastAPI 后端             │
│  /api/chat  /api/sessions       │
│  /api/knowledge  /api/health    │
└──────┬──────────────┬───────────┘
       │              │
┌──────▼──────┐  ┌────▼────────────────┐
│  Chat       │  │  Knowledge Base     │
│  Service    │  │  Service            │
│  (四种模式) │  │  分块·向量化·重排   │
└──────┬──────┘  └─────────────────────┘
       │
┌──────▼──────────────────────────┐
│  LangChain / LangGraph          │
│  + SiliconFlow / OpenAI LLM     │
│  + OceanBase Vector (可选)      │
│  + Tavily Web 搜索 (可选)       │
└─────────────────────────────────┘
```

---

## 检索模式对比

| 模式 | 说明 |
|---|---|
| `two-step`（两步检索） | 固定流程：检索 → 生成。结构简单、可预测，适合基线对比。 |
| `agentic`（智能体） | LLM 智能体自主判断是否需要检索、调用哪个工具。外部 API 缺失时自动回退到本地实现。 |
| `corrective`（纠正式） | 检索 → 对片段打分 → 本地片段不足时自动调用 Tavily Web 搜索补齐。 |
| `hybrid`（混合） | 稠密向量 + 稀疏 BM25 + 全文检索加权融合，可按需要调整权重。 |

---

## 快速开始

### 环境要求

- Python 3.11 及以上
- [`uv`](https://github.com/astral-sh/uv) 包管理器

### 1. 克隆与安装

```bash
git clone https://github.com/FRANKOUST/Agentic-RAG.git
cd Agentic-RAG
uv sync
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少配置一个 `SILICONFLOW_API_KEY`（或任意兼容 OpenAI 的端点）。OceanBase、Tavily、LangSmith 等均为可选项，未配置时不影响核心功能。

| 变量 | 是否必需 | 说明 |
|---|---|---|
| `SILICONFLOW_API_KEY` | 是 | LLM / 向量模型的 API Key |
| `SILICONFLOW_BASE_URL` | 是 | 兼容 OpenAI 协议的 Base URL |
| `SILICONFLOW_CHAT_MODEL` | 是 | 对话模型名称（示例：`Qwen/Qwen3-8B`） |
| `SILICONFLOW_EMBEDDING_MODEL` | 是 | 向量模型名称（示例：`BAAI/bge-m3`） |
| `SILICONFLOW_RERANK_MODEL` | 否 | 用于 corrective / hybrid 模式的重排模型 |
| `OCEANBASE_HOST` | 否 | OceanBase 向量库地址 |
| `TAVILY_API_KEY` | 否 | Tavily Web 搜索 Key（对应 corrective 模式的回退） |
| `LANGCHAIN_API_KEY` | 否 | LangSmith 链路追踪 |

### 3. 初始化演示数据

仓库自带 `nke-10k-2023.pdf`（Nike 2023 年年报 10-K），作为演示语料。

```bash
uv run python scripts/bootstrap_demo_data.py
```

### 4. 启动服务

```bash
uv run uvicorn backend.app.main:app --reload
```

浏览器访问 **http://127.0.0.1:8000** 即可开始体验。

---

## 界面概览

- **左侧边栏**：切换「对话」与「知识库」两个视图，快速新建/删除会话；可收起。
- **顶部栏**：当前会话标题、索引时间、一键切换「推理」侧栏、打开「设置」面板。
- **主对话区**：
  - 空白态提示卡片：建议问题、文档快捷入口。
  - 回答区使用衬线字体，上标数字即来源引用；悬停显示卡片，点击打开右侧「来源面板」。
  - 每条回答下方可复制、重新生成、点赞/点踩。
- **推理侧栏**：实时展示智能体执行轨迹（计划 → 检索 → 工具调用 → 合成）。
- **输入区**：仅保留文本域。按 `Enter` 发送，`Shift + Enter` 换行。
- **设置面板**（右上角齿轮或侧边栏「设置」）：强调色、明/暗主题、答案字体、推理可见性、信息密度、RAG 模式、检索策略等。所有设置本地保存。

### 键盘快捷键

| 快捷键 | 作用 |
|---|---|
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |
| `⌘ K` / `Ctrl + K` | 新建会话 |
| `Esc` | 关闭来源面板 / 设置面板 |

---

## 项目结构

```
.
├── backend/
│   ├── app/
│   │   ├── api/routers/     # FastAPI 路由（chat / sessions / knowledge / health）
│   │   ├── agent/           # LangGraph 智能体式 RAG
│   │   ├── corrective_rag/  # 纠正式 RAG：打分 + Web 回退
│   │   ├── core/            # 日志、异常处理
│   │   ├── kb/              # PDF 解析、分块、向量化、索引管理
│   │   ├── retrieval/       # 稠密 / 稀疏 / 混合检索
│   │   ├── rerank/          # 交叉编码器重排
│   │   ├── services/        # ChatService、KnowledgeBaseService、SessionService
│   │   ├── schemas/         # Pydantic 模型
│   │   ├── config/          # .env 载入
│   │   └── main.py          # FastAPI 应用工厂
│   ├── data/                # 运行时数据（已加入 .gitignore，首次运行自动创建）
│   └── tests/
│       ├── unit/
│       └── integration/
├── frontend/
│   └── src/
│       ├── index.html       # 单页应用入口
│       ├── styles.css       # 设计令牌与组件样式
│       ├── app.js           # 原生 JS（无框架、无打包）
│       └── assets/          # 静态资源
├── scripts/
│   ├── bootstrap_demo_data.py
│   └── ingest_nike_10k.py
├── nke-10k-2023.pdf         # 演示语料（Nike 2023 10-K）
├── pyproject.toml
├── uv.lock
└── .env.example
```

---

## API 参考

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/chat` | 发送消息，返回 SSE 流 |
| `GET` | `/api/sessions` | 列出所有会话 |
| `POST` | `/api/sessions` | 创建新会话 |
| `GET` | `/api/sessions/{id}/messages` | 获取某个会话的历史消息 |
| `POST` | `/api/knowledge/upload` | 上传 PDF 至知识库 |
| `POST` | `/api/knowledge/reindex` | 重建向量索引 |
| `GET` | `/api/knowledge/documents` | 列出已索引文档 |
| `GET` | `/api/health` | 健康检查 |

聊天接口的请求体格式：

```json
{
  "session_id": "string",
  "message": "string",
  "mode": "two-step | agentic | corrective | hybrid",
  "search_mode": "balanced | semantic | keyword | exact",
  "stream": true
}
```

SSE 事件类型：

- `status`：阶段性进度（`retrieving` / `retrieval-complete` / `generating` …）
- `delta`：token 级的增量回答
- `final`：最终回答，附带 `sources`、`tool_trajectory`、`used_tools`、`fallback_used` 等

---

## 开发

### 运行测试

```bash
uv run pytest -q -c pytest.ini
```

### Lint 与格式化

```bash
uv run ruff check .
uv run black .
```

### 启动时注入新的 PDF

将任意 PDF 放入 `backend/data/uploads/` 后运行 `bootstrap_demo_data.py`，或通过 `/api/knowledge/upload` 接口在运行时上传。

---

## 贡献

欢迎 Issue / PR！请先开 Issue 讨论方案，PR 请确保：

1. 从 `main` 分支拉取
2. 测试全部通过
3. 遵循现有的代码风格（`ruff` + `black`）
4. 必要时同步更新文档

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源。
