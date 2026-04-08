from __future__ import annotations

from pathlib import Path

from backend.app.schemas.domain import MessageRecord, SessionRecord
from backend.app.utils.ids import new_id
from backend.app.utils.json_store import load_json, save_json
from backend.app.utils.text import pick_title_from_text


class SessionService:
    def __init__(self, storage_path: Path):
        self.storage_path = storage_path
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

    def _load(self) -> dict:
        return load_json(self.storage_path, default={"sessions": [], "messages": []})

    def _save(self, payload: dict) -> None:
        save_json(self.storage_path, payload)

    def create_session(self, title: str | None = None) -> SessionRecord:
        payload = self._load()
        session = SessionRecord(session_id=new_id("session"), title=title or "New Session")
        payload["sessions"].append(session.to_dict())
        self._save(payload)
        return session

    def list_sessions(self) -> list[SessionRecord]:
        payload = self._load()
        sessions = [SessionRecord(**item) for item in payload["sessions"]]
        sessions.sort(key=lambda item: item.updated_at, reverse=True)
        return sessions

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        mode: str | None = None,
        sources: list[dict] | None = None,
        tool_trajectory: list[dict] | None = None,
        used_tools: bool = False,
        fallback_used: bool = False,
    ) -> MessageRecord:
        payload = self._load()
        message = MessageRecord(
            message_id=new_id("message"),
            session_id=session_id,
            role=role,
            content=content,
            mode=mode,
            sources=sources or [],
            tool_trajectory=tool_trajectory or [],
            used_tools=used_tools,
            fallback_used=fallback_used,
        )
        payload["messages"].append(message.to_dict())

        for item in payload["sessions"]:
            if item["session_id"] == session_id:
                item["updated_at"] = message.created_at
                if role == "user" and item["title"] == "New Session":
                    item["title"] = pick_title_from_text(content)
                break

        self._save(payload)
        return message

    def list_messages(self, session_id: str) -> list[MessageRecord]:
        payload = self._load()
        messages = [MessageRecord(**item) for item in payload["messages"] if item["session_id"] == session_id]
        messages.sort(key=lambda item: item.created_at)
        return messages
