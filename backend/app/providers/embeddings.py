from __future__ import annotations

from backend.app.utils.text import hashed_embedding

try:
    from langchain_openai import OpenAIEmbeddings
except Exception:  # pragma: no cover - optional dependency
    OpenAIEmbeddings = None


class EmbeddingProvider:
    def embed_query(self, text: str) -> list[float]:
        raise NotImplementedError

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_query(text) for text in texts]


class LocalEmbeddingProvider(EmbeddingProvider):
    def embed_query(self, text: str) -> list[float]:
        return hashed_embedding(text)


class OpenAICompatibleEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model: str, api_key: str, base_url: str):
        if OpenAIEmbeddings is None:
            raise RuntimeError("langchain_openai is not installed.")
        self.client = OpenAIEmbeddings(model=model, api_key=api_key, base_url=base_url)

    def embed_query(self, text: str) -> list[float]:
        return self.client.embed_query(text)
