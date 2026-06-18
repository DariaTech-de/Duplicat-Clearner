from __future__ import annotations

from fastapi import APIRouter, Query

from app.apply_actions import apply_actions

router = APIRouter(prefix="/api/v1", tags=["actions"])


@router.get("/actions")
def list_actions(scan_id: str | None = None, limit: int = Query(default=200, ge=1, le=1000)) -> dict:
    return {"items": apply_actions.actions.list(scan_id=scan_id, limit=limit)}
