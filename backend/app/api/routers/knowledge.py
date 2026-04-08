from __future__ import annotations

from fastapi import APIRouter, File, Request, UploadFile


router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/documents")
def list_documents(request: Request):
    knowledge_service = request.app.state.knowledge_service
    documents = knowledge_service.list_documents()
    return {"count": len(documents), "documents": [document.to_dict() for document in documents]}


@router.post("/reindex")
def reindex(request: Request):
    knowledge_service = request.app.state.knowledge_service
    document_count, chunk_count = knowledge_service.reindex()
    return {"status": "ok", "document_count": document_count, "chunk_count": chunk_count}


@router.post("/upload")
async def upload_document(request: Request, file: UploadFile = File(...)):
    knowledge_service = request.app.state.knowledge_service
    content = await file.read()
    target = knowledge_service.save_upload(file.filename, content)
    knowledge_service.ingest_pdf(target)
    return {"status": "ok", "filename": file.filename}
