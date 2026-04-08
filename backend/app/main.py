from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.api.routers import chat, health, knowledge, sessions
from backend.app.config.settings import load_settings
from backend.app.core.logging import configure_logging
from backend.app.services.chat_service import ChatService
from backend.app.services.knowledge_service import KnowledgeBaseService
from backend.app.services.session_service import SessionService


def create_app(data_dir: Path | None = None, demo_pdf_path: Path | None = None) -> FastAPI:
    configure_logging()
    settings = load_settings(data_dir=data_dir, demo_pdf_path=demo_pdf_path)

    app = FastAPI(title=settings.app_name)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.cors_origin],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    knowledge_service = KnowledgeBaseService.for_local_data_dir(
        data_dir=settings.data_dir,
        demo_pdf_path=settings.demo_pdf_path,
    )
    knowledge_service.ensure_demo_corpus()
    session_service = SessionService(storage_path=settings.data_dir / 'sessions.json')
    chat_service = ChatService(knowledge_service=knowledge_service)

    app.state.settings = settings
    app.state.knowledge_service = knowledge_service
    app.state.session_service = session_service
    app.state.chat_service = chat_service

    app.include_router(chat.router, prefix='/api')
    app.include_router(sessions.router, prefix='/api')
    app.include_router(knowledge.router, prefix='/api')
    app.include_router(health.router, prefix='/api')

    frontend_dir = Path(__file__).resolve().parents[2] / 'frontend' / 'src'
    app.mount('/static', StaticFiles(directory=frontend_dir), name='static')

    @app.get('/')
    def index():
        return FileResponse(frontend_dir / 'index.html')

    @app.get('/styles.css')
    def styles():
        return FileResponse(frontend_dir / 'styles.css')

    @app.get('/app.js')
    def app_js():
        return FileResponse(frontend_dir / 'app.js')

    return app


app = create_app()
