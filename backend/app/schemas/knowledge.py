from __future__ import annotations

from pydantic import BaseModel, Field


class KnowledgeDocumentModel(BaseModel):
    document_id: str
    name: str
    source_path: str
    page_count: int
    chunk_count: int
    uploaded_at: str


class KnowledgeDocumentList(BaseModel):
    count: int
    documents: list[KnowledgeDocumentModel] = Field(default_factory=list)


class KnowledgeReindexResponse(BaseModel):
    status: str
    document_count: int
    chunk_count: int


class HealthResponse(BaseModel):
    status: str
    knowledge_base_ready: bool
    document_count: int
    chunk_count: int
    runtime: dict[str, str]
