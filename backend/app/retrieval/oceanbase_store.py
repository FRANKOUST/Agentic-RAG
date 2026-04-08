from __future__ import annotations


class OceanBaseKnowledgeStore:
    """Optional adapter placeholder for production OceanBase-backed retrieval.

    The demo defaults to `LocalKnowledgeStore` because OceanBase may not be
    configured in the current workspace. This adapter exists to preserve the
    notebook architecture and provide a clear extension seam.
    """

    def __init__(self, *args, **kwargs):
        raise RuntimeError("OceanBase store is not configured in this demo environment.")
