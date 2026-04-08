from __future__ import annotations

from backend.app.schemas.domain import SearchResult

try:
    from langchain_oceanbase.ai_functions import OceanBaseAIFunctions
except Exception:  # pragma: no cover - optional dependency
    OceanBaseAIFunctions = None


class AIPipeline:
    backend_name = "local"

    def rerank(self, query: str, results: list[SearchResult], top_k: int = 3) -> list[SearchResult]:
        raise NotImplementedError

    def complete(self, query: str, results: list[SearchResult]) -> str:
        raise NotImplementedError


class LocalAIPipeline(AIPipeline):
    backend_name = "local-app-layer"

    def rerank(self, query: str, results: list[SearchResult], top_k: int = 3) -> list[SearchResult]:
        query_terms = {term.lower() for term in query.split()}

        def score(result: SearchResult) -> float:
            overlap = sum(1 for term in query_terms if term in result.chunk.content.lower())
            return result.score + (overlap * 0.05)

        return sorted(results, key=score, reverse=True)[:top_k]

    def complete(self, query: str, results: list[SearchResult]) -> str:
        if not results:
            return "I could not find relevant information in the current knowledge base."
        return "\n".join(
            f"- {item.chunk.summary} (Source: {item.chunk.document_name} p.{item.chunk.page})"
            for item in results
        )


class OceanBaseAIFunctionsPipeline(AIPipeline):
    backend_name = "oceanbase-ai-functions"

    def __init__(self, ai_functions: OceanBaseAIFunctions, rerank_model: str, completion_model: str):
        self.ai_functions = ai_functions
        self.rerank_model = rerank_model
        self.completion_model = completion_model

    def rerank(self, query: str, results: list[SearchResult], top_k: int = 3) -> list[SearchResult]:
        if not results:
            return []
        reranked = self.ai_functions.ai_rerank(
            query=query,
            documents=[result.chunk.content for result in results],
            model_name=self.rerank_model,
            top_k=top_k,
        )
        ordered = []
        for item in reranked:
            for result in results:
                if result.chunk.content == item["document"]:
                    ordered.append(result)
                    break
        return ordered

    def complete(self, query: str, results: list[SearchResult]) -> str:
        context = "\n\n".join(result.chunk.content for result in results)
        return self.ai_functions.ai_complete(
            prompt=f"Answer the question with the supplied context.\n\nContext:\n{{{{TEXT}}}}\n\nQuestion: {query}\n\nAnswer:",
            model_name=self.completion_model,
            content=context,
        )
