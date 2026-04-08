from __future__ import annotations

import re

from backend.app.schemas.domain import SearchResult


def extractive_answer(query: str, results: list[SearchResult]) -> str:
    if not results:
        return "I could not find relevant information in the current knowledge base."

    lines: list[str] = []
    for result in results:
        sentence = focused_excerpt(result.chunk.content, query)
        lines.append(f"- {sentence} (Source: {result.chunk.document_name} p.{result.chunk.page})")

    return "\n".join(lines)


def first_relevant_sentence(text: str, query: str) -> str:
    query_terms = set(re.findall(r"[A-Za-z0-9]+", query.lower()))
    sentences = re.split(r"(?<=[.!?])\s+", " ".join(text.split()))
    scored = []
    for sentence in sentences:
        lower_sentence = sentence.lower()
        overlap = sum(1 for term in query_terms if term in lower_sentence)
        scored.append((overlap, sentence))
    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[0][1] if scored and scored[0][1] else text[:180]


def focused_excerpt(text: str, query: str, limit: int = 180) -> str:
    normalized = " ".join(text.split())
    query_terms = [term for term in re.findall(r"[A-Za-z0-9$%.]+", query.lower()) if len(term) > 3]

    best_position = None
    for term in query_terms:
        index = normalized.lower().find(term)
        if index != -1:
            best_position = index
            break

    if best_position is None:
        candidate = first_relevant_sentence(normalized, query)
        return candidate[:limit].rstrip() + ("..." if len(candidate) > limit else "")

    start = max(best_position - 60, 0)
    end = min(best_position + 120, len(normalized))
    snippet = normalized[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(normalized):
        snippet = snippet + "..."
    return snippet[:limit].rstrip() + ("..." if len(snippet) > limit else "")
