"""
Google read-only smoke test. Works for EITHER account:
  python jarvis_addons\google_workspace_readonly_test.py digitallife   (default)
  python jarvis_addons\google_workspace_readonly_test.py workspace
Reads config["google_oauth"][<account>]. Gmail, Drive, Calendar. No writes.
Never prints tokens.
"""
import sys
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"


def _creds(account):
    from google.oauth2.credentials import Credentials
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    g = cfg["google_oauth"]; acct = g[account]
    return Credentials(
        token=acct.get("access_token"), refresh_token=acct.get("refresh_token"),
        token_uri=acct.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=g["client_id"], client_secret=g["client_secret"],
        scopes=acct.get("scopes"),
    )


def run(account="digitallife"):
    try:
        from googleapiclient.discovery import build
    except ImportError:
        return "Need libraries once:  pip install google-api-python-client google-auth"
    try:
        creds = _creds(account)
    except KeyError:
        return (f"MISSING: '{account}' login not done. Run:  "
                f"python jarvis_addons\\google_oauth_setup.py {account}")
    out = [f"[account: {account}]"]
    for label, fn in [
        ("Gmail", lambda: build('gmail','v1',credentials=creds).users().getProfile(userId='me').execute().get('emailAddress')),
        ("Drive", lambda: f"{len(build('drive','v3',credentials=creds).files().list(pageSize=3,fields='files(name)').execute().get('files',[]))} files"),
        ("Calendar", lambda: f"{len(build('calendar','v3',credentials=creds).calendarList().list(maxResults=3).execute().get('items',[]))} calendars"),
    ]:
        try:
            out.append(f"{label} OK: {fn()}")
        except Exception as e:
            out.append(f"{label} FAILED: {e}")
    out.append("Sheets: same auth; reads a specific sheet by ID on request.")
    return "\n".join(out)


if __name__ == "__main__":
    print(run(sys.argv[1] if len(sys.argv) > 1 else "digitallife"))
