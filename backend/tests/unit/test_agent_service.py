from __future__ import annotations

from backend.app.agent.fallback_agent import FallbackAgentService
from backend.app.schemas.chat import ModeOption
from backend.app.schemas.domain import SearchResult


class StubRetriever:
    def __init__(self, results: list[SearchResult]):
        self.calls: list[tuple[str, str]] = []
        self.results = results

    def search(self, query: str, mode: str, top_k: int = 3):
        self.calls.append((query, mode))
        return self.results[:top_k]


def test_fallback_agent_uses_multiple_searches_for_complex_query(sample_chunks):
    results = [SearchResult.from_chunk(chunk, score=0.9, signals={"dense": 0.9}) for chunk in sample_chunks]
    retriever = StubRetriever(results)
    agent = FallbackAgentService(retriever=retriever)

    response = agent.run(
        query="Compare Nike revenue, digital strategy, and risk factors in one answer.",
        mode=ModeOption.AGENTIC,
        search_mode="balanced",
    )

    assert response.used_tools is True
    assert len(response.tool_trajectory) >= 2
    assert "revenue" in response.answer.lower()
    assert len(retriever.calls) >= 2


def test_fallback_agent_skips_search_for_simple_math(sample_chunks):
    results = [SearchResult.from_chunk(chunk, score=0.9, signals={"dense": 0.9}) for chunk in sample_chunks]
    retriever = StubRetriever(results)
    agent = FallbackAgentService(retriever=retriever)

    response = agent.run(query="What is 2 + 2?", mode=ModeOption.AGENTIC, search_mode="balanced")

    assert response.used_tools is False
    assert response.answer.strip() == "4"
