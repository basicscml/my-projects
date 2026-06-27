"""
ONE-TIME Google login for Jarvis.
Run this ONCE on the PC. It opens your browser, you sign in as
digitallifeinsurance@gmail.com, approve read-only access, and it saves the
tokens into config.json. Covers GBP + all of Workspace in a single login.

Never prints tokens. Read-only scopes only (GBP has just one scope, so Jarvis
self-restricts it to reads until a verbal PIN is given).

PREREQS in config.json (from Google Cloud Console -> OAuth client, Desktop app):
  config["google_oauth"]["client_id"]
  config["google_oauth"]["client_secret"]

If google-auth-oauthlib isn't installed:  pip install google-auth-oauthlib
"""
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",   # Search Console
    "https://www.googleapis.com/auth/business.manage",        # GBP (read first)
]


def run():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    g = cfg.get("google_oauth", {})
    cid, secret = g.get("client_id"), g.get("client_secret")
    if not cid or not secret:
        print("MISSING: add google_oauth.client_id and google_oauth.client_secret "
              "to config.json first (Google Cloud Console -> Credentials -> "
              "OAuth client ID -> Desktop app).")
        return

    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("Need the library once:  pip install google-auth-oauthlib")
        return

    client_config = {
        "installed": {
            "client_id": cid,
            "client_secret": secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")  # opens browser

    # Save tokens back into config.json (never printed)
    g["access_token"] = creds.token
    g["refresh_token"] = creds.refresh_token
    g["token_uri"] = "https://oauth2.googleapis.com/token"
    g["scopes"] = SCOPES
    cfg["google_oauth"] = g
    CONFIG.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    print("SUCCESS: Google login saved. Gmail, Drive, Sheets, Calendar, "
          "Search Console, and GBP are now connected READ-ONLY.")
    print("(No tokens printed. Next: run the read-only tests.)")


if __name__ == "__main__":
    run()
