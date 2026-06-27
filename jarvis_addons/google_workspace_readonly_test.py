"""
Google read-only smoke test, routed by account:
  python jarvis_addons\google_workspace_readonly_test.py            (both)
  python jarvis_addons\google_workspace_readonly_test.py digitallife
  python jarvis_addons\google_workspace_readonly_test.py business
digitallife -> Drive, Calendar (Sheets/Docs share Drive auth; read by ID).
business    -> Gmail inbox (read-only).
No writes. Never prints tokens.
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


CHECKS = {
    "digitallife": [
        ("Drive", lambda c: f"{len(__import__('googleapiclient.discovery', fromlist=['build']).build('drive','v3',credentials=c).files().list(pageSize=3,fields='files(name)').execute().get('files',[]))} files"),
        ("Calendar", lambda c: f"{len(__import__('googleapiclient.discovery', fromlist=['build']).build('calendar','v3',credentials=c).calendarList().list(maxResults=3).execute().get('items',[]))} calendars"),
    ],
    "business": [
        ("Gmail (inbox)", lambda c: __import__('googleapiclient.discovery', fromlist=['build']).build('gmail','v1',credentials=c).users().getProfile(userId='me').execute().get('emailAddress')),
    ],
}


def run_one(account):
    try:
        creds = _creds(account)
    except KeyError:
        return (f"[{account}] MISSING login. Run:  "
                f"python jarvis_addons\\google_oauth_setup.py {account}")
    out = [f"[account: {account}]"]
    for label, fn in CHECKS.get(account, []):
        try:
            out.append(f"{label} OK: {fn(creds)}")
        except Exception as e:
            out.append(f"{label} FAILED: {e}")
    if account == "digitallife":
        out.append("Sheets/Docs: same Drive auth; read a specific file by ID on request.")
    return "\n".join(out)


def run(account=None):
    try:
        import googleapiclient.discovery  # noqa
    except ImportError:
        return "Need libraries once:  pip install google-api-python-client google-auth"
    targets = [account] if account else ["digitallife", "business"]
    return "\n\n".join(run_one(a) for a in targets)


if __name__ == "__main__":
    print(run(sys.argv[1] if len(sys.argv) > 1 else None))
