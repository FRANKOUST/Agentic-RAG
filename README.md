# Agentic RAG Demo

一个可直接运行的 Agentic RAG 演示项目，包含 FastAPI 后端、聊天式前端，以及 two-step / agentic / corrective / hybrid 四种问答模式。

## 项目特性

- 基于 PDF 文档的知识库构建与检索
- 支持检索、重排、生成三层服务拆分
- 支持 `two-step`、`agentic`、`corrective`、`hybrid` 四种运行模式
- 提供消息会话、知识库上传、重建索引等 API
- 前端为零构建静态页面，由 FastAPI 直接托管
- 默认附带 `nke-10k-2023.pdf` 作为演示语料

## 目录结构

- `backend/app`：后端应用与 RAG 核心逻辑
- `backend/tests`：单元测试与集成测试
- `frontend/src`：前端静态资源
- `scripts`：数据初始化脚本
- `backend/data`：运行期数据目录

## 使用 uv 管理 Python 环境

### 1. 安装依赖

```bash
uv sync
```

默认会同步开发依赖组。

### 2. 配置环境变量

```bash
cp .env.example .env
```

按需填写模型、OceanBase、LangChain、Tavily 等配置。

### 3. 初始化演示数据

```bash
uv run python scripts/bootstrap_demo_data.py
```

### 4. 启动应用

```bash
uv run uvicorn backend.app.main:app --reload
```

启动后访问：`http://127.0.0.1:8000`

## 测试

```bash
uv run pytest -q -c pytest.ini
```

## API 列表

- `POST /api/chat`
- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/{id}/messages`
- `POST /api/knowledge/upload`
- `POST /api/knowledge/reindex`
- `GET /api/knowledge/documents`
- `GET /api/health`

## 运行模式说明

### `two-step`

固定先检索，再基于检索结果生成回答。

### `agentic`

由代理判断是否需要检索，并记录工具调用轨迹。若外部能力未完整配置，则自动退回本地兼容实现。

### `corrective`

先检索、再做相关性判断；当结果质量不足时执行回退策略。Tavily 搜索为可选能力，未配置时会优雅降级。

### `hybrid`

统一融合稠密检索、稀疏检索与全文检索，并支持多种搜索模式切换。

## 说明

- OceanBase、Tavily、模型 API Key 都是可选配置；未配置时项目仍可在本地演示基础能力。
- `backend/data` 中的索引和会话文件属于运行期产物，已在 `.gitignore` 中忽略。
