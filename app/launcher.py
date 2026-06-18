from __future__ import annotations

import socket
import sys
import threading
import time
import traceback
import webbrowser

HOST = "127.0.0.1"
PREFERRED_PORT = 8787


def _is_free(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        try:
            sock.bind((host, port))
            return True
        except OSError:
            return False


def _pick_port(host: str, preferred: int, attempts: int = 20) -> int:
    for port in range(preferred, preferred + attempts):
        if _is_free(host, port):
            return port
    return preferred


def _server_up(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex((host, port)) == 0


def _open_browser_when_ready(port: int) -> None:
    url = f"http://{HOST}:{port}"
    for _ in range(80):
        if _server_up(HOST, port):
            try:
                webbrowser.open(url)
            except Exception:
                pass
            return
        time.sleep(0.4)


def main() -> None:
    port = _pick_port(HOST, PREFERRED_PORT)
    url = f"http://{HOST}:{port}"

    print("=" * 56)
    print("  DariaTech Data Cleanup")
    print(f"  Lokaler Start auf {url}")
    if port != PREFERRED_PORT:
        print(f"  Hinweis: Port {PREFERRED_PORT} war belegt (evtl. eine ältere")
        print(f"  Version). Diese Version läuft jetzt auf Port {port}.")
    print("  Dieses Fenster bitte geöffnet lassen.")
    print("=" * 56)

    # Import here so any import error is surfaced by the guarded runner.
    import uvicorn

    from app.asgi import app

    threading.Thread(target=_open_browser_when_ready, args=(port,), daemon=True).start()
    # Force the dependency-free asyncio loop and h11 HTTP so the frozen EXE does
    # not rely on optional native extensions (uvloop/httptools/websockets).
    uvicorn.run(app, host=HOST, port=port, log_level="info", loop="asyncio", http="h11")


def _run_guarded() -> None:
    try:
        main()
    except SystemExit:
        raise
    except BaseException:
        print("\n=== Fehler beim Start von DariaTech Data Cleanup ===")
        traceback.print_exc()
        print("\nBitte diesen Text an den Support senden.")
        try:
            input("\nEnter zum Schließen …")
        except EOFError:
            pass
        sys.exit(1)


if __name__ == "__main__":
    _run_guarded()
