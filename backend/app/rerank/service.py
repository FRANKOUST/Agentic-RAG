from __future__ import annotations

from backend.app.providers.ai_pipeline import LocalAIPipeline
from backend.app.schemas.domain import SearchResult


class RerankService:
    def __init__(self, pipeline=None):
        self.pipeline = pipeline or LocalAIPipeline()

    def rerank(self, query: str, results: list[SearchResult], top_k: int = 3) -> list[SearchResult]:
        return self.pipeline.rerank(query=query, results=results, top_k=top_k)
