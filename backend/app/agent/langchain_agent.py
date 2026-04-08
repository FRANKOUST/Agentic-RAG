from __future__ import annotations

from backend.app.retrieval.hybrid_search import resolve_search_mode
from backend.app.schemas.domain import ChatRunResult
from backend.app.schemas.domain import SearchResult, ToolTraceStep

try:
    from langchain.agents import create_agent
    from langchain.tools import tool
except Exception:  # pragma: no cover - optional dependency
    create_agent = None
    tool = None


class LangChainAgentService:
    def __init__(self, llm_provider, retriever):
        self.llm_provider = llm_provider
        self.retriever = retriever

    def is_available(self) -> bool:
        return create_agent is not None and hasattr(self.llm_provider, "client")

    def run(self, query: str, mode: str, search_mode: str = "balanced") -> ChatRunResult:
        if not self.is_available():
            raise RuntimeError("LangChain agent is not available in the current environment.")

        resolved_mode = resolve_search_mode(query, preferred_mode=search_mode)
        collected_results: list[SearchResult] = []
        trajectory: list[ToolTraceStep] = []

        @tool
        def search_knowledge_base(query: str, top_k: int = 3) -> str:
            """Search the Nike 10-K knowledge base for grounded answers."""
            results = self.retriever.search(query=query, mode=resolved_mode, top_k=top_k)
            collected_results.extend(results)
            trajectory.append(
                ToolTraceStep(
                    tool_name="search_knowledge_base",
                    query=query,
                    summary=f"LangChain agent retrieved {len(results)} chunk(s).",
                    mode=resolved_mode,
                )
            )
            if not results:
                return "No relevant information found."
            return "\n\n".join(
                f"[{item.chunk.document_name} p.{item.chunk.page}] {item.chunk.content}" for item in results
            )

        agent = create_agent(
            model=self.llm_provider.client,
            tools=[search_knowledge_base],
            system_prompt=(
                "You are a grounded assistant for Nike's 10-K. "
                "Use the search_knowledge_base tool when factual Nike document evidence is needed. "
                "Skip retrieval for trivial questions."
            ),
        )
        payload = agent.invoke({"messages": [{"role": "user", "content": query}]})
        answer = payload["messages"][-1].content

        unique: list[SearchResult] = []
        seen = set()
        for result in collected_results:
            if result.chunk.chunk_id in seen:
                continue
            seen.add(result.chunk.chunk_id)
            unique.append(result)

        return ChatRunResult(
            answer=answer,
            mode=mode,
            sources=unique[:4],
            used_tools=bool(unique),
            tool_trajectory=trajectory,
        )
