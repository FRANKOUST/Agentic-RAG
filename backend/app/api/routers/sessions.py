from __future__ import annotations

from fastapi import APIRouter, Request, status

from backend.app.schemas.chat import CreateSessionRequest


router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("")
def list_sessions(request: Request):
    session_service = request.app.state.session_service
    return [session.to_dict() for session in session_service.list_sessions()]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_session(payload: CreateSessionRequest, request: Request):
    session_service = request.app.state.session_service
    session = session_service.create_session(title=payload.title)
    return session.to_dict()


@router.get("/{session_id}/messages")
def list_messages(session_id: str, request: Request):
    session_service = request.app.state.session_service
    return [message.to_dict() for message in session_service.list_messages(session_id)]
