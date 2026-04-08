from __future__ import annotations

from pathlib import Path

from backend.app.schemas.domain import ChunkRecord, DocumentRecord, SearchResult
from backend.app.utils.json_store import load_json, save_json
from backend.app.utils.text import (
    cosine_similarity,
    fulltext_score,
    hashed_embedding,
    make_sparse_vector,
)


WEIGHT_PRESETS: dict[str, dict[str, float]] = {
    "balanced": {"dense": 0.4, "sparse": 0.3, "fulltext": 0.3},
    "semantic": {"dense": 0.7, "sparse": 0.2, "fulltext": 0.1},
    "keyword": {"dense": 0.2, "sparse": 0.6, "fulltext": 0.2},
    "exact": {"dense": 0.1, "sparse": 0.2, "fulltext": 0.7},
}


class LocalKnowledgeStore:
    def __init__(self, index_path: Path):
        self.index_path = index_path
        self._documents: list[DocumentRecord] = []
        self._chunks: list[ChunkRecord] = []
        self._load()

    def _load(self) -> None:
        payload = load_json(self.index_path, default={"documents": [], "chunks": []})
        self._documents = [DocumentRecord.from_dict(item) for item in payload["documents"]]
        self._chunks = [ChunkRecord.from_dict(item) for item in payload["chunks"]]

    def _save(self) -> None:
        payload = {
            "documents": [document.to_dict() for document in self._documents],
            "chunks": [chunk.to_dict() for chunk in self._chunks],
        }
        save_json(self.index_path, payload)

    def rebuild(self, documents: list[DocumentRecord], chunks: list[ChunkRecord]) -> None:
        prepared_chunks: list[ChunkRecord] = []
        for chunk in chunks:
            chunk.dense_vector = chunk.dense_vector or hashed_embedding(chunk.content)
            chunk.sparse_vector = chunk.sparse_vector or make_sparse_vector(chunk.content)
            chunk.fulltext = chunk.fulltext or f"{chunk.document_name} page {chunk.page} {chunk.content}"
            prepared_chunks.append(chunk)

        self._documents = documents
        self._chunks = prepared_chunks
        self._save()

    def list_documents(self) -> list[DocumentRecord]:
        return list(self._documents)

    def chunk_count(self) -> int:
        return len(self._chunks)

    def document_count(self) -> int:
        return len(self._documents)

    def search(self, query: str, mode: str = "balanced", top_k: int = 3) -> list[SearchResult]:
        weights = WEIGHT_PRESETS.get(mode, WEIGHT_PRESETS["balanced"])
        dense_query = hashed_embedding(query)
        sparse_query = make_sparse_vector(query)
        scored: list[SearchResult] = []

        for chunk in self._chunks:
            dense = max(cosine_similarity(dense_query, chunk.dense_vector), 0.0)
            sparse = sum(sparse_query.get(token, 0.0) * chunk.sparse_vector.get(token, 0.0) for token in sparse_query)
            fulltext = fulltext_score(query, chunk.fulltext or chunk.content)
            total = (dense * weights["dense"]) + (sparse * weights["sparse"]) + (fulltext * weights["fulltext"])
            scored.append(
                SearchResult.from_chunk(
                    chunk=chunk,
                    score=total,
                    signals={"dense": dense, "sparse": sparse, "fulltext": fulltext},
                    mode=mode,
                )
            )

        scored.sort(key=lambda item: item.score, reverse=True)
        return [result for result in scored[:top_k] if result.score > 0]
