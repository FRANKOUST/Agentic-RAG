from __future__ import annotations

from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.schemas.domain import ChunkRecord, DocumentRecord


@pytest.fixture()
def data_dir(tmp_path: Path) -> Path:
    base = tmp_path / "data"
    (base / "kb").mkdir(parents=True, exist_ok=True)
    (base / "uploads").mkdir(parents=True, exist_ok=True)
    return base


@pytest.fixture()
def sample_document() -> DocumentRecord:
    return DocumentRecord(
        document_id="doc-nike",
        name="nike-10k.pdf",
        source_path="nike-10k.pdf",
        page_count=3,
        chunk_count=3,
    )


@pytest.fixture()
def sample_chunks(sample_document: DocumentRecord) -> list[ChunkRecord]:
    return [
        ChunkRecord(
            chunk_id="chunk-1",
            document_id=sample_document.document_id,
            document_name=sample_document.name,
            page=31,
            content="Nike reported total revenues of 51.2 billion dollars in fiscal 2023.",
            summary="Nike revenue summary",
            metadata={"section": "financials"},
        ),
        ChunkRecord(
            chunk_id="chunk-2",
            document_id=sample_document.document_id,
            document_name=sample_document.name,
            page=12,
            content="Item 1A Risk Factors discusses supply chain disruption, competition, and macroeconomic pressure.",
            summary="Risk factors summary",
            metadata={"section": "risk factors"},
        ),
        ChunkRecord(
            chunk_id="chunk-3",
            document_id=sample_document.document_id,
            document_name=sample_document.name,
            page=44,
            content="Nike Digital and Nike Direct continue to support digital commerce and membership growth.",
            summary="Digital strategy summary",
            metadata={"section": "strategy"},
        ),
    ]
