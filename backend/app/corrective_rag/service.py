from __future__ import annotations

from backend.app.schemas.domain import ChatRunResult, ToolTraceStep
from backend.app.services.answer_builder import extractive_answer
from backend.app.retrieval.hybrid_search import resolve_search_mode


class LexicalRelevanceGrader:
    def grade(self, query: str, results) -> tuple[bool, str]:
        if not results:
            return False, "No retrieval results were returned."
        lowered = query.lower()
        matches = sum(1 for result in results if any(token in result.chunk.content.lower() for token in lowered.split()))
        return matches > 0, f"{matches} retrieved chunk(s) had direct lexical overlap."


class CorrectiveRAGService:
    def __init__(self, retriever, grader=None, answer_builder=None, web_fallback=None):
        self.retriever = retriever
        self.grader = grader or LexicalRelevanceGrader()
        self.answer_builder = answer_builder or extractive_answer
        self.web_fallback = web_fallback

    def run(self, query: str, mode, search_mode: str = "balanced") -> ChatRunResult:
        resolved_mode = resolve_search_mode(query, preferred_mode=search_mode)
        results = self.retriever.search(query, mode=resolved_mode, top_k=4)
        relevant, reasoning = self.grader.grade(query, results)
        trajectory = [
            ToolTraceStep(
                tool_name="knowledge_base_search",
                query=query,
                summary=f"Retrieved {len(results)} chunk(s); relevance={relevant}. {reasoning}",
                mode=resolved_mode,
            )
        ]

        if relevant:
            return ChatRunResult(
                answer=self.answer_builder(query, results),
                mode=str(mode.value if hasattr(mode, "value") else mode),
                sources=results,
                used_tools=True,
                tool_trajectory=trajectory,
            )

        if self.web_fallback is not None:
            fallback_answer = str(self.web_fallback.search(query))
            trajectory.append(
                ToolTraceStep(
                    tool_name="web_fallback",
                    query=query,
                    summary="Knowledge-base retrieval was graded irrelevant, so web fallback was used.",
                    mode="web",
                )
            )
            return ChatRunResult(
                answer=fallback_answer,
                mode=str(mode.value if hasattr(mode, "value") else mode),
                sources=results,
                used_tools=True,
                tool_trajectory=trajectory,
                fallback_used=True,
            )

        trajectory.append(
            ToolTraceStep(
                tool_name="fallback_notice",
                query=query,
                summary="No web fallback was configured; returned the best available local context.",
                mode="local",
            )
        )
        return ChatRunResult(
            answer=self.answer_builder(query, results),
            mode=str(mode.value if hasattr(mode, "value") else mode),
            sources=results,
            used_tools=True,
            tool_trajectory=trajectory,
            fallback_used=True,
        )
