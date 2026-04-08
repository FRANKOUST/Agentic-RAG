from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class Settings:
    app_name: str
    data_dir: Path
    demo_pdf_path: Path | None
    cors_origin: str


def load_settings(data_dir: Path | None = None, demo_pdf_path: Path | None = None) -> Settings:
    repo_root = Path(__file__).resolve().parents[3]
    resolved_data_dir = data_dir or (repo_root / "backend" / "data")
    resolved_demo_pdf = demo_pdf_path
    if resolved_demo_pdf is None:
        candidate = repo_root / "nke-10k-2023.pdf"
        resolved_demo_pdf = candidate if candidate.exists() else None

    return Settings(
        app_name="Agentic RAG Demo",
        data_dir=resolved_data_dir,
        demo_pdf_path=resolved_demo_pdf,
        cors_origin=os.getenv("APP_CORS_ORIGIN", "*"),
    )
