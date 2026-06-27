"""
WordPress read-only connection test for Jarvis.
Reads creds from config.json (never prints them). Does a single read-only call:
fetches the 3 most recent posts. No writes, no publishing.
"""
import json
import base64
import urllib.request
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"


def _creds():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    wp = cfg.get("wordpress", {})
    return wp.get("url"), wp.get("username"), wp.get("app_password")


def test_read():
    url, user, app_pw = _creds()
    if not all([url, user, app_pw]):
        return "MISSING: need wordpress.url, wordpress.username, wordpress.app_password in config.json"
    base = url.rstrip("/").replace("/wp-admin", "")
    endpoint = f"{base}/wp-json/wp/v2/posts?per_page=3&_fields=id,title,status,date"
    token = base64.b64encode(f"{user}:{app_pw}".encode()).decode()
    req = urllib.request.Request(endpoint, headers={"Authorization": f"Basic {token}"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            posts = json.loads(r.read().decode())
        if not posts:
            return "CONNECTED (read-only). Site reachable, no posts returned."
        lines = ["CONNECTED (read-only). Recent posts:"]
        for p in posts:
            title = p.get("title", {}).get("rendered", "(no title)")
            lines.append(f"  - [{p.get('status')}] {title}")
        return "\n".join(lines)
    except Exception as e:
        return f"FAILED: {type(e).__name__}: {e}"


if __name__ == "__main__":
    print(test_read())
