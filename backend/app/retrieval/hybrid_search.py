from __future__ import annotations

from backend.app.retrieval.local_store import WEIGHT_PRESETS


def resolve_search_mode(query: str, preferred_mode: str = "balanced") -> str:
    lowered = query.lower()
    if preferred_mode != "balanced":
        return preferred_mode
    if "item 1a" in lowered or "section" in lowered or '"' in query:
        return "exact"
    if any(token in lowered for token in ["revenue", "operating income", "fiscal", "margin"]):
        return "keyword"
    if any(token in lowered for token in ["strategy", "innovation", "sustainability", "digital"]):
        return "semantic"
    return "balanced"


def describe_search_mode(mode: str) -> str:
    weights = WEIGHT_PRESETS.get(mode, WEIGHT_PRESETS["balanced"])
    return f"dense={weights['dense']:.0%}, sparse={weights['sparse']:.0%}, fulltext={weights['fulltext']:.0%}"
