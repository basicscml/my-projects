"""
ONE Google login for Jarvis. Everything is on digitallifeinsurance@gmail.com.
Run ONCE on the PC:

  python jarvis_addons\google_oauth_setup.py

Opens browser -> sign in as digitallifeinsurance@gmail.com -> approve.
Connects (READ-ONLY): Gmail, Drive, Sheets, Calendar, Search Console, GBP.
Tokens saved under config["google_oauth"]["digitallife"]. Never printed.

PREREQS in config.json (one OAuth client, Desktop app):
  config["google_oauth"]["client_id"]
  config["google_oauth"]["client_secret"]

If needed once:  pip install google-auth-oauthlib
"""
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"
ACCOUNT = "digitallife"
EMAIL = "digitallifeinsurance@gmail.com"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",   # Search Console
    "https://www.googleapis.com/auth/business.manage",        # GBP (read first; PIN for writes)
]


def run():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    g = cfg.setdefault("google_oauth", {})
    cid, secret = g.get("client_id"), g.get("client_secret")
    if not cid or not secret:
        print("MISSING: add google_oauth.client_id and google_oauth.client_secret "
              "to config.json first (Google Cloud Console -> OAuth client -> Desktop app).")
        return
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("Need the library once:  pip install google-auth-oauthlib")
        return

    print(f"Sign in as: {EMAIL}")
    client_config = {
        "installed": {
            "client_id": cid, "client_secret": secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")
    g[ACCOUNT] = {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": "https://oauth2.googleapis.com/token",
        "scopes": SCOPES,
        "email_hint": EMAIL,
    }
    cfg["google_oauth"] = g
    CONFIG.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    print("SUCCESS: Google login saved (read-only): Gmail, Drive, Sheets, "
          "Calendar, Search Console, GBP. No tokens printed.")


if __name__ == "__main__":
    run()
