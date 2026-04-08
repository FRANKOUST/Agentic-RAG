from __future__ import annotations

from backend.app.retrieval.local_store import LocalKnowledgeStore


def test_local_knowledge_store_indexes_documents(data_dir, sample_document, sample_chunks):
    store = LocalKnowledgeStore(index_path=data_dir / "kb" / "index.json")

    store.rebuild(documents=[sample_document], chunks=sample_chunks)

    documents = store.list_documents()
    assert len(documents) == 1
    assert documents[0].chunk_count == 3

    results = store.search("What were Nike revenues in fiscal 2023?", mode="balanced", top_k=2)
    assert results
    assert results[0].chunk.page == 31


def test_local_knowledge_store_supports_exact_mode(data_dir, sample_document, sample_chunks):
    store = LocalKnowledgeStore(index_path=data_dir / "kb" / "index.json")
    store.rebuild(documents=[sample_document], chunks=sample_chunks)

    results = store.search("Item 1A Risk Factors", mode="exact", top_k=2)

    assert results[0].chunk.page == 12
    assert results[0].signals["fulltext"] >= results[0].signals["dense"]
