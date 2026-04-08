from __future__ import annotations

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.services.knowledge_service import KnowledgeBaseService


def main() -> None:
    service = KnowledgeBaseService.for_local_data_dir(
        data_dir=ROOT / "backend" / "data",
        demo_pdf_path=ROOT / "nke-10k-2023.pdf",
    )
    document_count, chunk_count = service.reindex()
    print(f"Bootstrapped demo corpus: {document_count} document(s), {chunk_count} chunk(s).")


if __name__ == "__main__":
    main()
