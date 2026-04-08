from __future__ import annotations

import re

from backend.app.retrieval.hybrid_search import resolve_search_mode
from backend.app.schemas.domain import ChatRunResult, ToolTraceStep
from backend.app.services.answer_builder import extractive_answer


class FallbackAgentService:
    def __init__(self, retriever):
        self.retriever = retriever

    def run(self, query: str, mode, search_mode: str = "balanced") -> ChatRunResult:
        normalized = query.strip()
        resolved_mode = resolve_search_mode(normalized, preferred_mode=search_mode)
        if self._is_simple_math(normalized):
            return ChatRunResult(answer=str(self._solve_simple_math(normalized)), mode=str(mode.value if hasattr(mode, "value") else mode))

        if not self._needs_retrieval(normalized):
            return ChatRunResult(
                answer="I can answer simple general questions directly, but this demo is optimized for Nike 10-K knowledge-grounded questions.",
                mode=str(mode.value if hasattr(mode, "value") else mode),
            )

        subqueries = self._build_subqueries(normalized)
        collected = []
        trajectory: list[ToolTraceStep] = []

        for subquery in subqueries:
            results = self.retriever.search(subquery, mode=resolved_mode, top_k=3)
            collected.extend(results)
            trajectory.append(
                ToolTraceStep(
                    tool_name="knowledge_base_search",
                    query=subquery,
                    summary=f"Retrieved {len(results)} chunk(s) with {resolved_mode} mode.",
                    mode=resolved_mode,
                )
            )

        unique = []
        seen = set()
        for result in sorted(collected, key=lambda item: item.score, reverse=True):
            if result.chunk.chunk_id in seen:
                continue
            seen.add(result.chunk.chunk_id)
            unique.append(result)

        return ChatRunResult(
            answer=extractive_answer(normalized, unique[:4]),
            mode=str(mode.value if hasattr(mode, "value") else mode),
            sources=unique[:4],
            used_tools=True,
            tool_trajectory=trajectory,
        )

    def _needs_retrieval(self, query: str) -> bool:
        trigger_terms = {"nike", "revenue", "digital", "risk", "10-k", "strategy", "segment", "fiscal"}
        lowered = query.lower()
        return any(term in lowered for term in trigger_terms) or len(query.split()) > 8

    def _build_subqueries(self, query: str) -> list[str]:
        pieces = re.split(r"\b(?:and|compare|then|also)\b|[,:;]", query, flags=re.IGNORECASE)
        cleaned = [piece.strip() for piece in pieces if len(piece.strip()) > 6]
        return cleaned[:4] or [query]

    def _is_simple_math(self, query: str) -> bool:
        return bool(re.fullmatch(r"What is \d+ \+ \d+\??", query, flags=re.IGNORECASE))

    def _solve_simple_math(self, query: str) -> int:
        numbers = [int(value) for value in re.findall(r"\d+", query)]
        return sum(numbers)
