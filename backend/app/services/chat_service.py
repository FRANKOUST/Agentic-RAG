from __future__ import annotations

import json
import time
from collections.abc import Iterable

from backend.app.agent.fallback_agent import FallbackAgentService
from backend.app.agent.langchain_agent import LangChainAgentService
from backend.app.corrective_rag.service import CorrectiveRAGService
from backend.app.providers.llm import build_optional_llm_provider
from backend.app.providers.web_search import build_optional_web_fallback
from backend.app.retrieval.hybrid_search import describe_search_mode, resolve_search_mode
from backend.app.rerank.service import RerankService
from backend.app.schemas.chat import ModeOption
from backend.app.schemas.domain import ChatRunResult, ToolTraceStep
from backend.app.services.answer_builder import extractive_answer


class ChatService:
    def __init__(self, knowledge_service):
        self.knowledge_service = knowledge_service
        self.llm_provider = build_optional_llm_provider()
        self.agent_service = FallbackAgentService(retriever=knowledge_service)
        self.langchain_agent = None
        if self.llm_provider is not None:
            candidate = LangChainAgentService(llm_provider=self.llm_provider, retriever=knowledge_service)
            if candidate.is_available():
                self.langchain_agent = candidate
        self.corrective_service = CorrectiveRAGService(
            retriever=knowledge_service,
            web_fallback=build_optional_web_fallback(),
        )
        self.rerank_service = RerankService()

    def chat(self, query: str, mode: ModeOption, search_mode: str) -> ChatRunResult:
        self.knowledge_service.ensure_demo_corpus()

        if mode == ModeOption.TWO_STEP:
            return self._run_two_step(query=query, mode=mode, search_mode=search_mode)
        if mode == ModeOption.CORRECTIVE:
            return self.corrective_service.run(query=query, mode=mode, search_mode=search_mode)
        if mode == ModeOption.HYBRID:
            return self._run_hybrid(query=query, mode=mode, search_mode=search_mode)
        if self.langchain_agent is not None:
            try:
                return self.langchain_agent.run(query=query, mode=mode.value, search_mode=search_mode)
            except Exception:
                pass
        return self.agent_service.run(query=query, mode=mode, search_mode=search_mode)

    def stream_events(self, result: ChatRunResult) -> Iterable[str]:
        yield self._event("status", {"state": "retrieval-complete"})
        answer = result.answer
        for index in range(0, len(answer), 32):
            chunk = answer[index : index + 32]
            yield self._event("delta", {"content": chunk})
            time.sleep(0.001)
        yield self._event("final", result.to_dict())

    def _run_two_step(self, query: str, mode: ModeOption, search_mode: str) -> ChatRunResult:
        resolved_mode = resolve_search_mode(query, preferred_mode=search_mode)
        results = self.knowledge_service.search(query=query, mode=resolved_mode, top_k=6)
        reranked = self.rerank_service.rerank(query=query, results=results, top_k=4)
        trajectory = [
            ToolTraceStep(
                tool_name="knowledge_base_search",
                query=query,
                summary=f"Two-step mode retrieved {len(results)} chunk(s) then reranked them using {describe_search_mode(resolved_mode)}.",
                mode=resolved_mode,
            )
        ]
        return ChatRunResult(
            answer=extractive_answer(query, reranked),
            mode=mode.value,
            sources=reranked,
            used_tools=True,
            tool_trajectory=trajectory,
        )

    def _run_hybrid(self, query: str, mode: ModeOption, search_mode: str) -> ChatRunResult:
        resolved_mode = resolve_search_mode(query, preferred_mode=search_mode)
        results = self.knowledge_service.search(query=query, mode=resolved_mode, top_k=6)
        reranked = self.rerank_service.rerank(query=query, results=results, top_k=4)
        trajectory = [
            ToolTraceStep(
                tool_name="hybrid_search",
                query=query,
                summary=f"Hybrid mode used {resolved_mode} weighting over dense, sparse, and full-text scoring ({describe_search_mode(resolved_mode)}).",
                mode=resolved_mode,
            )
        ]
        return ChatRunResult(
            answer=extractive_answer(query, reranked),
            mode=mode.value,
            sources=reranked,
            used_tools=True,
            tool_trajectory=trajectory,
        )

    def _event(self, event: str, payload: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"
