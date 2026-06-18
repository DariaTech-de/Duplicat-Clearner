from __future__ import annotations

from typing import Any

from app.action_log import ActionLog
from app.enterprise_store import EnterpriseStore
from app.scanner import clean_files


class ApplyActions:
    def __init__(self, store: EnterpriseStore | None = None) -> None:
        self.store = store or EnterpriseStore()
        self.actions = ActionLog(self.store.db_path)

    def run(self, scan_id: str, file_paths: list[str], mode: str = "quarantine") -> dict[str, Any]:
        scan = self.store.get_scan(scan_id, include_result=True)
        if not scan or not scan.get("result"):
            raise ValueError("Scan result not available")
        result = scan["result"]
        allowed = {item["path"] for group in result.get("groups", []) for item in group.get("duplicates", [])}
        selected = [path for path in file_paths if path in allowed]
        ignored = [{"path": path, "reason": "not a current suggestion"} for path in file_paths if path not in allowed]
        output = clean_files(result.get("folders", []), selected, mode="quarantine" if mode != "recycle_bin" else "recycle_bin")
        for item in output.get("changed", []):
            self.actions.record(scan_id, item.get("from", ""), item.get("to", ""), mode, "applied")
        for item in output.get("skipped", []):
            self.actions.record(scan_id, item.get("path", ""), "", mode, "skipped", item.get("reason"))
        output["skipped"] = ignored + output.get("skipped", [])
        return output


apply_actions = ApplyActions()
