from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from backend.app.utils.text import summarize_text

try:
    from langchain_community.document_loaders import PyPDFLoader
except Exception:  # pragma: no cover - optional dependency
    PyPDFLoader = None

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except Exception:  # pragma: no cover - optional dependency
    RecursiveCharacterTextSplitter = None

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - optional dependency
    PdfReader = None


@dataclass(slots=True)
class PageDocument:
    page: int
    content: str


def load_pdf_pages(path: Path) -> list[PageDocument]:
    if PyPDFLoader is not None:
        pages = PyPDFLoader(str(path)).load()
        return [
            PageDocument(
                page=int(item.metadata.get("page", index + 1)),
                content=item.page_content,
            )
            for index, item in enumerate(pages)
        ]

    if PdfReader is None:
        raise RuntimeError("No PDF loader is available. Install langchain-community or pypdf.")

    reader = PdfReader(str(path))
    results: list[PageDocument] = []
    for index, page in enumerate(reader.pages):
        results.append(PageDocument(page=index + 1, content=page.extract_text() or ""))
    return results


def split_pages(pages: list[PageDocument], chunk_size: int = 1000, chunk_overlap: int = 120) -> list[PageDocument]:
    if RecursiveCharacterTextSplitter is not None:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        chunks: list[PageDocument] = []
        for page in pages:
            texts = splitter.split_text(page.content)
            chunks.extend(PageDocument(page=page.page, content=text) for text in texts if text.strip())
        return chunks

    chunks: list[PageDocument] = []
    stride = max(chunk_size - chunk_overlap, 1)
    for page in pages:
        text = page.content
        for start in range(0, len(text), stride):
            chunk = text[start : start + chunk_size]
            if chunk.strip():
                chunks.append(PageDocument(page=page.page, content=chunk))
    return chunks


def build_demo_pages() -> list[PageDocument]:
    return [
        PageDocument(
            page=31,
            content="Nike reported total revenues of $51.2 billion in fiscal 2023, reflecting resilient demand across key geographies.",
        ),
        PageDocument(
            page=12,
            content="Item 1A Risk Factors highlights supply chain disruption, competition, macroeconomic volatility, and foreign currency impacts.",
        ),
        PageDocument(
            page=44,
            content="Nike Digital, membership, and Nike Direct remain central to the company's digital commerce and consumer connection strategy.",
        ),
    ]


def summarize_chunk(text: str) -> str:
    return summarize_text(text, limit=120)
