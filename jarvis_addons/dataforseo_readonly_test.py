"""
DataForSEO / SERP read-only test for Jarvis.
Reads creds from config["dataforseo"] = {"login": "...", "password": "..."}.
Does one read-only call: where a keyword ranks in Google. No spend beyond the
tiny API cost of the lookup. Never prints creds.
"""
import json
import base64
import urllib.request
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"

# Default sample lookup (Cory can change keyword/location by voice later)
SAMPLE_KEYWORD = "indexed universal life insurance"
LOCATION = "United States"


def _auth():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    d = cfg.get("dataforseo", {})
    return d.get("login"), d.get("password")


def test_read():
    login, pw = _auth()
    if not login or not pw:
        return ("MISSING: add config['dataforseo'] = {'login': '...', 'password': '...'} "
                "(sign up at dataforseo.com -> API access).")
    token = base64.b64encode(f"{login}:{pw}".encode()).decode()
    url = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
    payload = json.dumps([{
        "keyword": SAMPLE_KEYWORD,
        "location_name": LOCATION,
        "language_code": "en",
        "depth": 10,
    }]).encode()
    req = urllib.request.Request(url, data=payload, method="POST", headers={
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode())
        task = (data.get("tasks") or [{}])[0]
        items = ((task.get("result") or [{}])[0].get("items") or [])
        out = [f"CONNECTED (read-only). Top results for '{SAMPLE_KEYWORD}':"]
        for it in items[:5]:
            if it.get("type") == "organic":
                out.append(f"  #{it.get('rank_absolute')}: {it.get('domain')}")
        return "\n".join(out) if len(out) > 1 else "CONNECTED. No organic items returned."
    except Exception as e:
        return f"FAILED: {type(e).__name__}: {e}"


if __name__ == "__main__":
    print(test_read())
