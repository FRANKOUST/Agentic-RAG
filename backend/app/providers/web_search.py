from __future__ import annotations

import os

try:
    from langchain_community.tools import TavilySearchResults
except Exception:  # pragma: no cover - optional dependency
    TavilySearchResults = None


class TavilyFallback:
    def __init__(self, max_results: int = 3):
        if TavilySearchResults is None:
            raise RuntimeError("Tavily integration is unavailable.")
        self.tool = TavilySearchResults(max_results=max_results)

    def search(self, query: str) -> str:
        return str(self.tool.invoke(query))


def build_optional_web_fallback():
    if not os.getenv("TAVILY_API_KEY"):
        return None
    try:
        return TavilyFallback()
    except Exception:
        return None
