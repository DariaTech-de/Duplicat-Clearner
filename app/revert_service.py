from __future__ import annotations

import shutil
import time
from pathlib import Path
from typing import Any

from app.action_log import ActionLog
from app.enterprise_store import EnterpriseStore


class RevertService:
    def __init__(self, store: EnterpriseStore | None = None) -> None:
        self.store = store or EnterpriseStore()
        self.actions = ActionLog(self.store.db_path)

    def run(self, action_id: str) -> dict[str, Any]:
        action = self.actions.get(action_id)
        if action is None:
            raise ValueError("Action not found")
        current = Path(action["target_path"]).expanduser().resolve()
        original = Path(action["source_path"]).expanduser().resolve()
        if not current.exists() or not current.is_file():
            raise ValueError("Stored file not found")
        original.parent.mkdir(parents=True, exist_ok=True)
        if original.exists():
            original = original.with_name(f"{original.stem}__recovered_{int(time.time())}{original.suffix}")
        shutil.move(str(current), str(original))
        self.actions.mark_restored(action_id, str(original))
        return {"action_id": action_id, "path": str(original)}


revert_service = RevertService()
