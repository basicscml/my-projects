"""
Google Business Profile (GBP) read-only test for Jarvis.
Listing: The Life Insurance Professionals - Cory Levine (Owner, Verified).

IDs (identifiers, not secrets):
  Account  : accounts/10179203546351514980
  Location : accounts/10179203546351514980/locations/9899246156341434499

Read-only by default: reviews, calls/insights, profile info.
Any WRITE (reply to review, create post, edit profile, photos) must go through
approval_gate.require_pin() FIRST -- verbal PIN per JARVIS_APPROVAL_POLICY.md.

Needs Google OAuth with Business Profile scope, stored in config.json:
  config["google_oauth"]["access_token"]   (refreshed as needed)
Scope (read-only to start):
  https://www.googleapis.com/auth/business.manage   (Google's only GBP scope;
  Jarvis must self-restrict to READ calls until a verbal PIN is given.)
"""
import json
import urllib.request
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"

ACCOUNT_ID = "10179203546351514980"
LOCATION_ID = "9899246156341434499"


def _access_token():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    return cfg.get("google_oauth", {}).get("access_token")


def _get(url, token):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def test_read():
    token = _access_token()
    if not token:
        return ("MISSING: need Google OAuth access token in "
                "config['google_oauth']['access_token'] (Business Profile permission). "
                "IDs are ready; only the Google login is left.")
    # Read-only: pull reviews (most recent) for this location.
    reviews_url = (
        "https://mybusiness.googleapis.com/v4/"
        f"accounts/{ACCOUNT_ID}/locations/{LOCATION_ID}/reviews?pageSize=5"
    )
    try:
        data = _get(reviews_url, token)
        reviews = data.get("reviews", [])
        avg = data.get("averageRating")
        total = data.get("totalReviewCount")
        lines = [f"CONNECTED (read-only). Rating {avg} from {total} reviews. Latest:"]
        for rv in reviews[:5]:
            stars = rv.get("starRating", "?")
            who = rv.get("reviewer", {}).get("displayName", "Anonymous")
            comment = (rv.get("comment", "") or "").replace("\n", " ")[:80]
            lines.append(f"  - {stars} by {who}: {comment}")
        return "\n".join(lines)
    except Exception as e:
        return f"FAILED: {type(e).__name__}: {e}"


# ---- WRITE actions: ALWAYS gate these behind a verbal PIN ----
def reply_to_review(review_name, reply_text, get_spoken_pin):
    """Example write. Will NOT run without verbal PIN approval."""
    from approval_gate import require_pin  # local import to keep read path clean
    if not require_pin(f"reply to a Google review: '{reply_text[:50]}'", get_spoken_pin):
        return "Blocked. No reply posted."
    # (PIN ok) -> perform PUT to .../reviews/{id}/reply  -- left for PC wiring.
    return "Approved by PIN. (PC session performs the actual reply call.)"


if __name__ == "__main__":
    print(test_read())
