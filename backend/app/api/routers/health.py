from __future__ import annotations

import platform

from fastapi import APIRouter, Request


router = APIRouter(tags=["health"])


@router.get("/health")
def health(request: Request):
    knowledge_service = request.app.state.knowledge_service
    return {
        "status": "ok",
        "knowledge_base_ready": knowledge_service.store.chunk_count() > 0,
        "document_count": knowledge_service.store.document_count(),
        "chunk_count": knowledge_service.store.chunk_count(),
        "runtime": {
            "python": platform.python_version(),
            "search_backend": "local-json",
        },
    }
