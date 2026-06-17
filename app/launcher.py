from __future__ import annotations

import threading
import time
import webbrowser

import uvicorn


def _open_browser() -> None:
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:8787")


def main() -> None:
    threading.Thread(target=_open_browser, daemon=True).start()
    uvicorn.run("app.main:app", host="127.0.0.1", port=8787, log_level="warning")


if __name__ == "__main__":
    main()
