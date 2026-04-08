from __future__ import annotations

from backend.app.corrective_rag.service import CorrectiveRAGService
from backend.app.schemas.chat import ModeOption
from backend.app.schemas.domain import SearchResult


class StubRetriever:
    def __init__(self, results):
        self.results = results

    def search(self, query: str, mode: str, top_k: int = 3):
        return self.results[:top_k]


class StubGrader:
    def __init__(self, relevant: bool):
        self.relevant = relevant

    def grade(self, query: str, results):
        return self.relevant, "stubbed"


class StubFallback:
    def search(self, query: str):
        return "web fallback result about Nike earnings call"


def test_corrective_rag_uses_fallback_when_docs_are_irrelevant(sample_chunks):
    results = [SearchResult.from_chunk(sample_chunks[0], score=0.2, signals={"dense": 0.2})]
    service = CorrectiveRAGService(
        retriever=StubRetriever(results),
        grader=StubGrader(relevant=False),
        answer_builder=None,
        web_fallback=StubFallback(),
    )

    response = service.run(
        query="What happened in Nike's latest earnings call this quarter?",
        mode=ModeOption.CORRECTIVE,
        search_mode="balanced",
    )

    assert response.fallback_used is True
    assert any(step.tool_name == "web_fallback" for step in response.tool_trajectory)
    assert "web fallback" in response.answer.lower()
