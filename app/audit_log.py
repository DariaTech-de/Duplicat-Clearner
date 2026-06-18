from __future__ import annotations

import json
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Any


class AuditLog:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, timeout=30)
        connection.row_factory = sqlite3.Row
        return connection

    def _init_db(self) -> None:
        with self._connect() as db:
            db.execute(
                """
                CREATE TABLE IF NOT EXISTS audit_events (
                    id TEXT PRIMARY KEY,
                    scan_id TEXT,
                    event_type TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at REAL NOT NULL
                )
                """
            )

    def append(self, scan_id: str | None, event_type: str, payload: dict[str, Any]) -> str:
        event_id = str(uuid.uuid4())
        with self._connect() as db:
            db.execute(
                "INSERT INTO audit_events(id, scan_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)",
                (event_id, scan_id, event_type, json.dumps(payload, ensure_ascii=False), time.time()),
            )
        return event_id

    def list(self, scan_id: str | None = None, limit: int = 200) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 1000))
        with self._connect() as db:
            if scan_id:
                rows = db.execute("SELECT * FROM audit_events WHERE scan_id = ? ORDER BY created_at ASC LIMIT ?", (scan_id, limit)).fetchall()
            else:
                rows = db.execute("SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
        result = []
        for row in rows:
            item = dict(row)
            item["payload"] = json.loads(item.pop("payload_json") or "{}")
            result.append(item)
        return result
