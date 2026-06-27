"""
Google Workspace read-only smoke test for Jarvis.
After google_oauth_setup.py has saved tokens, this does ONE small read per
service to prove each connection. No sending, editing, or deleting.
Never prints tokens.
"""
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"


def _creds():
    from google.oauth2.credentials import Credentials  # google-auth
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    g = cfg["google_oauth"]
    return Credentials(
        token=g.get("access_token"),
        refresh_token=g.get("refresh_token"),
        token_uri=g.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=g["client_id"],
        client_secret=g["client_secret"],
        scopes=g.get("scopes"),
    )


def run():
    try:
        from googleapiclient.discovery import build
    except ImportError:
        return "Need libraries once:  pip install google-api-python-client google-auth"
    creds = _creds()
    out = []

    try:
        gmail = build("gmail", "v1", credentials=creds)
        prof = gmail.users().getProfile(userId="me").execute()
        out.append(f"Gmail OK: {prof.get('emailAddress')} "
                   f"({prof.get('messagesTotal')} messages)")
    except Exception as e:
        out.append(f"Gmail FAILED: {e}")

    try:
        drive = build("drive", "v3", credentials=creds)
        files = drive.files().list(pageSize=3, fields="files(name)").execute()
        names = ", ".join(f["name"] for f in files.get("files", [])) or "(none)"
        out.append(f"Drive OK: recent files -> {names}")
    except Exception as e:
        out.append(f"Drive FAILED: {e}")

    try:
        cal = build("calendar", "v3", credentials=creds)
        cals = cal.calendarList().list(maxResults=3).execute()
        out.append(f"Calendar OK: {len(cals.get('items', []))} calendars visible")
    except Exception as e:
        out.append(f"Calendar FAILED: {e}")

    try:
        sc = build("searchconsole", "v1", credentials=creds)
        sites = sc.sites().list().execute()
        out.append(f"Search Console OK: {len(sites.get('siteEntry', []))} sites")
    except Exception as e:
        out.append(f"Search Console FAILED: {e}")

    out.append("Sheets: shares Drive auth; reads a specific sheet by ID on request.")
    return "\n".join(out)


if __name__ == "__main__":
    print(run())
