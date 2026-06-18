from __future__ import annotations

from app.api_action_history import router as api_action_history_router
from app.api_v1 import router as api_v1_router
from app.main import app

app.include_router(api_v1_router)
app.include_router(api_action_history_router)
