from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass(slots=True)
class DocumentRecord:
    document_id: str
    name: str
    source_path: str
    page_count: int
    chunk_count: int
    uploaded_at: str = field(default_factory=utc_now_iso)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "DocumentRecord":
        return cls(**payload)


@dataclass(slots=True)
class ChunkRecord:
    chunk_id: str
    document_id: str
    document_name: str
    page: int
    content: str
    summary: str
    metadata: dict[str, Any] = field(default_factory=dict)
    dense_vector: list[float] = field(default_factory=list)
    sparse_vector: dict[str, float] = field(default_factory=dict)
    fulltext: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "ChunkRecord":
        return cls(**payload)


@dataclass(slots=True)
class SearchResult:
    chunk: ChunkRecord
    score: float
    signals: dict[str, float] = field(default_factory=dict)
    mode: str = "balanced"

    @classmethod
    def from_chunk(
        cls,
        chunk: ChunkRecord,
        score: float,
        signals: dict[str, float] | None = None,
        mode: str = "balanced",
    ) -> "SearchResult":
        return cls(chunk=chunk, score=score, signals=signals or {}, mode=mode)

    def to_source_dict(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk.chunk_id,
            "document_id": self.chunk.document_id,
            "document_name": self.chunk.document_name,
            "page": self.chunk.page,
            "summary": self.chunk.summary,
            "snippet": self.chunk.content[:240],
            "score": self.score,
            "signals": self.signals,
            "mode": self.mode,
        }


@dataclass(slots=True)
class ToolTraceStep:
    tool_name: str
    query: str
    summary: str
    mode: str | None = None
    status: str = "completed"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class ChatRunResult:
    answer: str
    mode: str
    sources: list[SearchResult] = field(default_factory=list)
    used_tools: bool = False
    tool_trajectory: list[ToolTraceStep] = field(default_factory=list)
    fallback_used: bool = False
    status: str = "completed"

    def to_dict(self) -> dict[str, Any]:
        return {
            "answer": self.answer,
            "mode": self.mode,
            "sources": [source.to_source_dict() for source in self.sources],
            "used_tools": self.used_tools,
            "tool_trajectory": [step.to_dict() for step in self.tool_trajectory],
            "fallback_used": self.fallback_used,
            "status": self.status,
        }


@dataclass(slots=True)
class SessionRecord:
    session_id: str
    title: str
    created_at: str = field(default_factory=utc_now_iso)
    updated_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class MessageRecord:
    message_id: str
    session_id: str
    role: str
    content: str
    mode: str | None = None
    created_at: str = field(default_factory=utc_now_iso)
    sources: list[dict[str, Any]] = field(default_factory=list)
    tool_trajectory: list[dict[str, Any]] = field(default_factory=list)
    used_tools: bool = False
    fallback_used: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
