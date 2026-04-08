from __future__ import annotations

import os

try:
    from langchain_openai import ChatOpenAI
except Exception:  # pragma: no cover - optional dependency
    ChatOpenAI = None


class LLMProvider:
    def is_available(self) -> bool:
        return False


class OpenAICompatibleLLMProvider(LLMProvider):
    def __init__(self, model: str, api_key: str, base_url: str):
        if ChatOpenAI is None:
            raise RuntimeError("langchain_openai is not installed.")
        self.client = ChatOpenAI(model=model, api_key=api_key, base_url=base_url, temperature=0)

    def is_available(self) -> bool:
        return True


def build_optional_llm_provider() -> LLMProvider | None:
    api_key = os.getenv("SILICONFLOW_API_KEY", "")
    base_url = os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
    model = os.getenv("SILICONFLOW_CHAT_MODEL", "Qwen/Qwen3-8B")
    if not api_key:
        return None
    try:
        return OpenAICompatibleLLMProvider(model=model, api_key=api_key, base_url=base_url)
    except Exception:
        return None
