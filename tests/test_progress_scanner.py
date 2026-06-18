from __future__ import annotations

from pathlib import Path

from app.progress_scanner import scan_with_progress
from app.scanner import ScanOptions


def test_progress_scanner_emits_progress(tmp_path: Path) -> None:
    (tmp_path / "a.txt").write_text("same", encoding="utf-8")
    (tmp_path / "b.txt").write_text("same", encoding="utf-8")
    events = []

    result = scan_with_progress(
        ScanOptions(folders=[str(tmp_path)], include_all_files=True),
        progress=lambda stage, current, total, message: events.append((stage, current, total, message)),
    )

    assert result["summary"]["duplicate_groups"] == 1
    assert any(event[0] == "hash" for event in events)
    assert events[-1][0] == "complete"
