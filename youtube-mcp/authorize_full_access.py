#!/usr/bin/env python3
"""
One-time authorization helper: re-authorize the existing YouTube project with
full (read + write) scopes and save the credentials back to youtube-token.json.

Run this once on the machine that has the OAuth client file:

    python authorize_full_access.py

A browser window opens for you to approve the expanded access on your own
Google account. The token/secret are NEVER printed.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except Exception:
    sys.stderr.write("Install deps first: pip install -r requirements.txt\n")
    raise

PROJECT_DIR = Path(os.environ.get("YOUTUBE_API_DIR") or Path(__file__).resolve().parent)
CLIENT_FILE = PROJECT_DIR / "youtube-oauth-client.json"
TOKEN_FILE = PROJECT_DIR / "youtube-token.json"

# Full access: read data, read analytics, and modify channel metadata.
SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]


def main() -> int:
    if not CLIENT_FILE.exists():
        sys.stderr.write(f"OAuth client file not found: {CLIENT_FILE}\n")
        return 1

    flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_FILE), SCOPES)
    # Opens a browser and runs a local redirect server to capture the code.
    creds = flow.run_local_server(port=0)

    TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    # Deliberately do NOT print the token contents.
    print(f"Full-access token saved to {TOKEN_FILE.name}. You can now use the write tools.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
