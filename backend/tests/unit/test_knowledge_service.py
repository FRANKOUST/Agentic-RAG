from __future__ import annotations

from backend.app.kb.ingestion import PageDocument
from backend.app.services.knowledge_service import KnowledgeBaseService


def test_knowledge_service_ingests_pages_and_rebuilds_index(data_dir):
    service = KnowledgeBaseService.for_local_data_dir(data_dir=data_dir)
    pages = [
        PageDocument(page=1, content="Nike reported revenues of 51.2 billion dollars in 2023."),
        PageDocument(page=2, content="Risk factors include competition and supply chain volatility."),
    ]

    document = service.ingest_page_documents(name="nike-mini.pdf", source_path="nike-mini.pdf", pages=pages)

    assert document.chunk_count >= 2

    documents = service.list_documents()
    assert len(documents) == 1

    results = service.search(query="risk factors", mode="balanced", top_k=1)
    assert results[0].chunk.page == 2
