import json, pathlib

ROOT   = pathlib.Path(__file__).parent.parent.parent
DBFILE = ROOT / "scan_history.json"

def store_scan(data: dict) -> None:
    history = fetch_all()
    history.append(data)
    DBFILE.write_text(json.dumps(history, indent=2))

def fetch_all() -> list[dict]:
    try:
        return json.loads(DBFILE.read_text())
    except FileNotFoundError:
        return []
