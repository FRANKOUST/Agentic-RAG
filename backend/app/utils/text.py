from __future__ import annotations

import hashlib
import math
import re
from collections import Counter


STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "are",
    "was",
    "were",
    "been",
    "has",
    "have",
    "had",
    "its",
    "our",
    "their",
    "from",
    "which",
    "may",
    "can",
    "will",
    "would",
    "could",
    "should",
    "about",
    "what",
    "when",
    "where",
    "how",
    "into",
    "than",
    "then",
    "they",
    "them",
    "your",
}


def tokenize(text: str) -> list[str]:
    words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9-]*\b", text.lower())
    return [word for word in words if len(word) > 1 and word not in STOPWORDS]


def summarize_text(text: str, limit: int = 140) -> str:
    normalized = " ".join(text.split())
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def hashed_embedding(text: str, dimensions: int = 128) -> list[float]:
    vector = [0.0] * dimensions
    tokens = tokenize(text)
    if not tokens:
        return vector

    counts = Counter(tokens)
    for token, weight in counts.items():
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        index = int(digest[:8], 16) % dimensions
        sign = -1.0 if int(digest[8:10], 16) % 2 else 1.0
        vector[index] += sign * float(weight)

    return normalize_vector(vector)


def normalize_vector(values: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in values))
    if norm == 0:
        return values
    return [value / norm for value in values]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right:
        return 0.0
    return sum(a * b for a, b in zip(left, right))


def make_sparse_vector(text: str) -> dict[str, float]:
    tokens = tokenize(text)
    counts = Counter(tokens)
    total = sum(counts.values()) or 1
    return {token: count / total for token, count in counts.items()}


def sparse_overlap_score(query: dict[str, float], document: dict[str, float]) -> float:
    return sum(query.get(token, 0.0) * document.get(token, 0.0) for token in query)


def fulltext_score(query: str, content: str) -> float:
    lower_query = query.lower().strip()
    lower_content = content.lower()
    if not lower_query:
        return 0.0
    if lower_query in lower_content:
        return 1.0
    query_tokens = tokenize(query)
    if not query_tokens:
        return 0.0
    matches = sum(1 for token in query_tokens if token in lower_content)
    return matches / len(query_tokens)


def pick_title_from_text(text: str) -> str:
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "New Session")
    return summarize_text(first_line, limit=60)
