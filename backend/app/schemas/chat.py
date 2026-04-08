from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ModeOption(str, Enum):
    TWO_STEP = "two-step"
    AGENTIC = "agentic"
    CORRECTIVE = "corrective"
    HYBRID = "hybrid"


class SearchModeOption(str, Enum):
    BALANCED = "balanced"
    SEMANTIC = "semantic"
    KEYWORD = "keyword"
    EXACT = "exact"


class CreateSessionRequest(BaseModel):
    title: str = Field(default="New Session")


class SessionSummary(BaseModel):
    session_id: str
    title: str
    created_at: str
    updated_at: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    mode: ModeOption = ModeOption.AGENTIC
    search_mode: SearchModeOption = SearchModeOption.BALANCED
    stream: bool = False


class ToolTraceStepModel(BaseModel):
    tool_name: str
    query: str
    summary: str
    mode: str | None = None
    status: str = "completed"


class SourceModel(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    page: int
    summary: str
    snippet: str
    score: float
    signals: dict[str, float] = Field(default_factory=dict)
    mode: str


class ChatResponse(BaseModel):
    answer: str
    mode: str
    sources: list[SourceModel] = Field(default_factory=list)
    used_tools: bool = False
    tool_trajectory: list[ToolTraceStepModel] = Field(default_factory=list)
    fallback_used: bool = False
    status: str = "completed"


class MessageModel(BaseModel):
    message_id: str
    session_id: str
    role: str
    content: str
    mode: str | None = None
    created_at: str
    sources: list[dict[str, Any]] = Field(default_factory=list)
    tool_trajectory: list[dict[str, Any]] = Field(default_factory=list)
    used_tools: bool = False
    fallback_used: bool = False
