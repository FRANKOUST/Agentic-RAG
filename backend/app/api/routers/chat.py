from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from backend.app.schemas.chat import ChatRequest


router = APIRouter(tags=["chat"])


@router.post("/chat")
def chat(payload: ChatRequest, request: Request):
    session_service = request.app.state.session_service
    chat_service = request.app.state.chat_service

    session_service.add_message(
        session_id=payload.session_id,
        role="user",
        content=payload.message,
        mode=payload.mode.value,
    )

    result = chat_service.chat(
        query=payload.message,
        mode=payload.mode,
        search_mode=payload.search_mode.value,
    )

    assistant_message = session_service.add_message(
        session_id=payload.session_id,
        role="assistant",
        content=result.answer,
        mode=result.mode,
        sources=[item.to_source_dict() for item in result.sources],
        tool_trajectory=[item.to_dict() for item in result.tool_trajectory],
        used_tools=result.used_tools,
        fallback_used=result.fallback_used,
    )

    response_payload = result.to_dict()
    response_payload["assistant_message_id"] = assistant_message.message_id

    if payload.stream:
        return StreamingResponse(chat_service.stream_events(result), media_type="text/event-stream")

    return response_payload
