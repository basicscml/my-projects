"""
Google Search Console read-only test (digitallifeinsurance@gmail.com account).
Reads config["google_oauth"]["digitallife"]. Lists verified sites and pulls a
small clicks/impressions sample for thelifeinsuranceprofessionals.com. No writes.
Never prints tokens.
"""
import json
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"
SITE = "https://thelifeinsuranceprofessionals.com/"


def _creds():
    from google.oauth2.credentials import Credentials
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    g = cfg["google_oauth"]; acct = g["digitallife"]
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
        return ("MISSING: digitallife login not done. Run:  "
                "python jarvis_addons\\google_oauth_setup.py digitallife")
    try:
        sc = build("searchconsole", "v1", credentials=creds)
        sites = [s["siteUrl"] for s in sc.sites().list().execute().get("siteEntry", [])]
        if not sites:
            return ("Search Console: 0 sites on this account. The site may be "
                    "verified under a different Google account -- tell me which.")
        out = [f"Search Console OK: {len(sites)} site(s): {', '.join(sites)}"]
        target = SITE if SITE in sites else sites[0]
        body = {"startDate": "2025-05-01", "endDate": "2025-06-27",
                "dimensions": ["query"], "rowLimit": 3}
        rows = sc.searchanalytics().query(siteUrl=target, body=body).execute().get("rows", [])
        out.append(f"Top queries for {target}:")
        for r in rows:
            q = r["keys"][0]
            out.append(f"  - '{q}': {int(r['clicks'])} clicks, {int(r['impressions'])} impressions")
        return "\n".join(out)
    except Exception as e:
        return f"Search Console FAILED: {e}"


if __name__ == "__main__":
    print(run())
