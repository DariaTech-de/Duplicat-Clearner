from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RuntimeStatus:
    stage: str
    current: int
    total: int | None
    message: str
