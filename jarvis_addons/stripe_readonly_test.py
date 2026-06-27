"""
Stripe READ-ONLY test for Jarvis.
Reads a RESTRICTED, read-only key from config["stripe"]["restricted_key"].
Pulls a quick snapshot: account name + recent charges total. No money movement.
Any payment/refund/payout = always verbal-PIN-gated (never automatic).
Never prints the key.
"""
import json
import urllib.request
from pathlib import Path

CONFIG = Path(__file__).resolve().parent.parent / "config.json"


def _key():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    return cfg.get("stripe", {}).get("restricted_key")


def _get(path, key):
    req = urllib.request.Request(
        f"https://api.stripe.com/v1/{path}",
        headers={"Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def test_read():
    key = _key()
    if not key:
        return ("MISSING: add config['stripe']['restricted_key'] -- a RESTRICTED "
                "read-only key (Stripe -> Developers -> API keys -> Create restricted key). "
                "Never use the secret key.")
    if not key.startswith("rk_"):
        return ("WARNING: that does not look like a restricted key (should start 'rk_'). "
                "Use a read-only restricted key only.")
    try:
        acct = _get("account", key)
        charges = _get("charges?limit=5", key)
        total = sum(c.get("amount", 0) for c in charges.get("data", []) if c.get("paid"))
        name = acct.get("business_profile", {}).get("name") or acct.get("id")
        return (f"CONNECTED (read-only). Account: {name}. "
                f"Last {len(charges.get('data', []))} charges total: "
                f"${total/100:,.2f}. (Read-only; any payout/refund needs verbal PIN.)")
    except Exception as e:
        return f"FAILED: {type(e).__name__}: {e}"


if __name__ == "__main__":
    print(test_read())
