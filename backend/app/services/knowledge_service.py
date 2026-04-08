from __future__ import annotations

from pathlib import Path

from backend.app.kb.ingestion import PageDocument, build_demo_pages, load_pdf_pages, split_pages, summarize_chunk
from backend.app.retrieval.local_store import LocalKnowledgeStore
from backend.app.schemas.domain import ChunkRecord, DocumentRecord
from backend.app.utils.ids import new_id


class KnowledgeBaseService:
    def __init__(self, data_dir: Path, demo_pdf_path: Path | None = None):
        self.data_dir = data_dir
        self.demo_pdf_path = demo_pdf_path
        self.uploads_dir = data_dir / "uploads"
        self.kb_dir = data_dir / "kb"
        self.store = LocalKnowledgeStore(index_path=self.kb_dir / "index.json")
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.kb_dir.mkdir(parents=True, exist_ok=True)

    @classmethod
    def for_local_data_dir(cls, data_dir: Path, demo_pdf_path: Path | None = None) -> "KnowledgeBaseService":
        return cls(data_dir=data_dir, demo_pdf_path=demo_pdf_path)

    def ingest_page_documents(
        self,
        name: str,
        source_path: str,
        pages: list[PageDocument],
    ) -> DocumentRecord:
        document_id = new_id("doc")
        chunks = split_pages(pages)
        document = DocumentRecord(
            document_id=document_id,
            name=name,
            source_path=source_path,
            page_count=len(pages),
            chunk_count=len(chunks),
        )

        existing_documents = self.list_documents()
        existing_chunks = list(self.store._chunks)  # internal reuse inside service boundary
        materialized_chunks = [
            ChunkRecord(
                chunk_id=new_id("chunk"),
                document_id=document_id,
                document_name=name,
                page=chunk.page,
                content=chunk.content,
                summary=summarize_chunk(chunk.content),
                metadata={},
            )
            for chunk in chunks
        ]

        self.store.rebuild(existing_documents + [document], existing_chunks + materialized_chunks)
        return document

    def ingest_pdf(self, path: Path) -> DocumentRecord:
        pages = load_pdf_pages(path)
        return self.ingest_page_documents(name=path.name, source_path=str(path), pages=pages)

    def ensure_demo_corpus(self) -> None:
        if self.store.document_count() > 0:
            return
        if self.demo_pdf_path and self.demo_pdf_path.exists():
            self.ingest_pdf(self.demo_pdf_path)
            return
        self.ingest_page_documents(
            name="nike-demo.pdf",
            source_path="embedded-demo",
            pages=build_demo_pages(),
        )

    def reindex(self) -> tuple[int, int]:
        self.store.rebuild(documents=[], chunks=[])
        sources: list[Path] = []
        if self.demo_pdf_path and self.demo_pdf_path.exists():
            sources.append(self.demo_pdf_path)
        sources.extend(sorted(self.uploads_dir.glob("*.pdf")))

        if not sources:
            self.ingest_page_documents(
                name="nike-demo.pdf",
                source_path="embedded-demo",
                pages=build_demo_pages(),
            )
        else:
            for source in sources:
                self.ingest_pdf(source)

        return self.store.document_count(), self.store.chunk_count()

    def list_documents(self) -> list[DocumentRecord]:
        return self.store.list_documents()

    def search(self, query: str, mode: str = "balanced", top_k: int = 3):
        return self.store.search(query=query, mode=mode, top_k=top_k)

    def save_upload(self, filename: str, content: bytes) -> Path:
        target = self.uploads_dir / filename
        target.write_bytes(content)
        return target
