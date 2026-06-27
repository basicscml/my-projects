"""
Google login for Jarvis -- two accounts. Run ONCE PER ACCOUNT on the PC.
Same OAuth client works for both; sign in as the right account each time.

  python jarvis_addons\google_oauth_setup.py digitallife
      -> sign in as digitallifeinsurance@gmail.com
         (Google Business Profile + Search Console; primary account)

  python jarvis_addons\google_oauth_setup.py workspace
      -> sign in as cory@thelifeinsuranceprofessionals.com
         (Gmail, Drive, Sheets, Calendar ONLY)

Tokens saved under config["google_oauth"][<account>]. Never printed. Read-only.

PREREQS in config.json (one OAuth client, Desktop app):
  config["google_oauth"]["client_id"]
  config["google_oauth"]["client_secret"]
Add BOTH emails as Test users on the OAuth consent screen.

If needed once:  pip install google-auth-oauthlib
"""
import sys
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"

ACCOUNT_SCOPES = {
    "digitallife": [
        "https://www.googleapis.com/auth/business.manage",      # GBP (read first; PIN for writes)
        "https://www.googleapis.com/auth/webmasters.readonly",  # Search Console
    ],
    "workspace": [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/calendar.readonly",
    ],
}

ACCOUNT_HINT = {
    "digitallife": "digitallifeinsurance@gmail.com",
    "workspace": "cory@thelifeinsuranceprofessionals.com",
}


def run(account):
    if account not in ACCOUNT_SCOPES:
        print("Usage: python google_oauth_setup.py [digitallife|workspace]")
        return
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

    print(f"Sign in as: {ACCOUNT_HINT[account]}")
    client_config = {
        "installed": {
            "client_id": cid, "client_secret": secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }
    flow = InstalledAppFlow.from_client_config(client_config, ACCOUNT_SCOPES[account])
    creds = flow.run_local_server(port=0, prompt="consent")
    g[account] = {
        "access_token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": "https://oauth2.googleapis.com/token",
        "scopes": ACCOUNT_SCOPES[account],
        "email_hint": ACCOUNT_HINT[account],
    }
    cfg["google_oauth"] = g
    CONFIG.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    print(f"SUCCESS: '{account}' login saved (read-only). No tokens printed.")


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "")
