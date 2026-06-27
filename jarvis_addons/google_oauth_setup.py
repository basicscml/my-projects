"""
Google logins for Jarvis -- BOTH accounts, routed by purpose
(see GOOGLE_ACCOUNTS_USAGE.md). Run once per account on the PC:

  python jarvis_addons\google_oauth_setup.py digitallife
      -> sign in as digitallifeinsurance@gmail.com
         (Drive, Sheets, Docs, Calendar, GBP, Search Console)

  python jarvis_addons\google_oauth_setup.py business
      -> sign in as cory@thelifeinsuranceprofessionals.com
         (business email inbox -- read-only; sending added later behind PIN)

Same OAuth client serves both; pick the matching Google account at sign-in.
Tokens saved under config["google_oauth"][<account>]. Never printed.

PREREQS in config.json (one OAuth client, Desktop app):
  config["google_oauth"]["client_id"], ["client_secret"]
Add BOTH emails as Test users on the OAuth consent screen.

If needed once:  pip install google-auth-oauthlib
"""
import sys
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"

ACCOUNT_SCOPES = {
    # digitallifeinsurance@gmail.com -- everything EXCEPT email
    "digitallife": [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/documents.readonly",     # Docs
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/webmasters.readonly",    # Search Console
        "https://www.googleapis.com/auth/business.manage",        # GBP (read first; PIN for writes)
    ],
    # cory@thelifeinsuranceprofessionals.com -- business EMAIL only
    "business": [
        "https://www.googleapis.com/auth/gmail.readonly",         # inbox read; send added later behind PIN
    ],
}
ACCOUNT_HINT = {
    "digitallife": "digitallifeinsurance@gmail.com",
    "business": "cory@thelifeinsuranceprofessionals.com",
}


def run(account):
    if account not in ACCOUNT_SCOPES:
        print("Usage: python google_oauth_setup.py [digitallife|business]")
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
