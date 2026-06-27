"""
Google Workspace read-only smoke test (cory@thelifeinsuranceprofessionals.com).
Reads config["google_oauth"]["workspace"]. Gmail, Drive, Calendar, Sheets.
No writes. Never prints tokens.
"""
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"


def _creds():
    from google.oauth2.credentials import Credentials
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    g = cfg["google_oauth"]; acct = g["workspace"]
    return Credentials(
        token=acct.get("access_token"), refresh_token=acct.get("refresh_token"),
        token_uri=acct.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=g["client_id"], client_secret=g["client_secret"],
        scopes=acct.get("scopes"),
    )


def run():
    try:
        from googleapiclient.discovery import build
    except ImportError:
        return "Need libraries once:  pip install google-api-python-client google-auth"
    try:
        creds = _creds()
    except KeyError:
        return ("MISSING: workspace login not done. Run:  "
                "python jarvis_addons\\google_oauth_setup.py workspace")
    out = []
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
    print(run())
