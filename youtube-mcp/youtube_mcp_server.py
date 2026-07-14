#!/usr/bin/env python3
"""
Local read-only MCP server for the existing YouTube API project.

Design goals:
  * READ-ONLY. No metadata writes, no uploads, no deletes.
  * Never expose, log, or return OAuth tokens or client secrets.
  * Reuse the credentials already authorized by the existing project
    (youtube-token.json + youtube-oauth-client.json).

The project directory is resolved from the YOUTUBE_API_DIR environment
variable, falling back to this file's own directory, then to C:\\YouTubeAPI.

Tools exposed:
  * get_channel_summary        - channel title + headline statistics
  * get_top_videos             - top videos ranked by views (or other order)
  * run_analytics_dashboard    - run the project's analytics dashboard script
  * list_reports / read_report - read previously generated report files
  * recommend_improvements     - heuristic title/description/tag/thumbnail tips
"""

from __future__ import annotations

import os
import re
import sys
import json
import subprocess
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Third-party imports (installed via requirements.txt)
# ---------------------------------------------------------------------------
try:
    from mcp.server.fastmcp import FastMCP
except Exception as exc:  # pragma: no cover
    sys.stderr.write(
        "Missing dependency 'mcp'. Install with: pip install -r requirements.txt\n"
    )
    raise

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
except Exception:  # pragma: no cover
    sys.stderr.write(
        "Missing Google API libraries. Install with: pip install -r requirements.txt\n"
    )
    raise


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
def _resolve_project_dir() -> Path:
    env_dir = os.environ.get("YOUTUBE_API_DIR")
    if env_dir:
        return Path(env_dir)
    here = Path(__file__).resolve().parent
    if (here / "youtube-token.json").exists():
        return here
    return Path(r"C:\YouTubeAPI")


PROJECT_DIR = _resolve_project_dir()
TOKEN_FILE = PROJECT_DIR / "youtube-token.json"
CLIENT_FILE = PROJECT_DIR / "youtube-oauth-client.json"

# Scopes. Read scopes power the read tools; the write scope (force-ssl) powers
# the metadata/thumbnail write tools. Granting actually happens during OAuth
# authorization (see authorize_full_access.py); listing a scope here does not
# expand a token that was not granted it.
READ_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]
WRITE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl"
ALL_SCOPES = READ_SCOPES + [WRITE_SCOPE]

# Files that must never be read/returned by report tools.
SECRET_FILENAMES = {"youtube-token.json", "youtube-oauth-client.json"}

# Extensions considered "reports" that are safe to read.
REPORT_EXTENSIONS = {".txt", ".md", ".csv", ".json", ".html", ".log"}

mcp = FastMCP("youtube")


# ---------------------------------------------------------------------------
# Secret-safety helpers
# ---------------------------------------------------------------------------
_SECRET_PATTERNS = [
    re.compile(r"ya29\.[A-Za-z0-9_\-]+"),                 # OAuth access tokens
    re.compile(r"1//[A-Za-z0-9_\-]+"),                    # OAuth refresh tokens
    re.compile(r"GOCSPX-[A-Za-z0-9_\-]+"),                # client secrets
    re.compile(r'"(client_secret|refresh_token|access_token|token)"\s*:\s*"[^"]*"'),
]


def _redact(text: str) -> str:
    """Defensively strip anything that looks like a credential."""
    if not text:
        return text
    redacted = text
    for pat in _SECRET_PATTERNS:
        redacted = pat.sub("[REDACTED]", redacted)
    return redacted


# ---------------------------------------------------------------------------
# Credential / client construction
# ---------------------------------------------------------------------------
def _load_credentials() -> Credentials:
    """Load already-authorized credentials. Refresh silently if expired.

    Tokens are NEVER returned to the caller or logged.
    """
    if not TOKEN_FILE.exists():
        raise FileNotFoundError(
            f"Token file not found at {TOKEN_FILE}. "
            "Authorize the project first, then set YOUTUBE_API_DIR."
        )

    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE))

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        # Persist the refreshed token back, preserving the existing structure.
        try:
            TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
        except Exception:
            # Non-fatal: a refreshed in-memory cred still works for this run.
            pass

    if not creds or not creds.valid:
        raise RuntimeError(
            "Stored credentials are not valid. Re-run the project's OAuth flow."
        )
    return creds


def _require_write_scope(creds: Credentials) -> None:
    """Raise a clear, actionable error if the token lacks the write scope."""
    granted = set(creds.scopes or [])
    if WRITE_SCOPE not in granted:
        raise PermissionError(
            "This token does not have YouTube write access. Run "
            "`python authorize_full_access.py` in the project directory once to "
            "re-authorize with full (read/write) scopes, then retry."
        )


def _youtube_data(write: bool = False):
    creds = _load_credentials()
    if write:
        _require_write_scope(creds)
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def _youtube_analytics():
    return build(
        "youtubeAnalytics", "v2", credentials=_load_credentials(), cache_discovery=False
    )


def _int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------
@mcp.tool()
def get_channel_summary() -> dict:
    """Return a summary of the authorized YouTube channel.

    Includes title, description, and headline statistics (subscribers,
    total views, video count). Read-only. No credentials are returned.
    """
    yt = _youtube_data()
    resp = (
        yt.channels()
        .list(part="snippet,statistics,contentDetails", mine=True)
        .execute()
    )
    items = resp.get("items", [])
    if not items:
        return {"error": "No channel found for the authorized account."}

    ch = items[0]
    snippet = ch.get("snippet", {})
    stats = ch.get("statistics", {})
    uploads = (
        ch.get("contentDetails", {})
        .get("relatedPlaylists", {})
        .get("uploads")
    )
    description = snippet.get("description", "")
    return {
        "channel_id": ch.get("id"),
        "title": snippet.get("title"),
        "description_preview": description[:300],
        "published_at": snippet.get("publishedAt"),
        "subscriber_count": _int(stats.get("subscriberCount")),
        "view_count": _int(stats.get("viewCount")),
        "video_count": _int(stats.get("videoCount")),
        "uploads_playlist_id": uploads,
    }


@mcp.tool()
def get_top_videos(max_results: int = 10, order: str = "viewCount") -> dict:
    """Return the channel's top videos.

    Args:
        max_results: How many videos to return (1-50). Default 10.
        order: Ordering for the search ("viewCount", "date", "rating",
               "relevance", "title"). Default "viewCount".

    Read-only. Returns title, video id, URL, and public statistics.
    """
    max_results = max(1, min(int(max_results), 50))
    allowed_order = {"viewCount", "date", "rating", "relevance", "title"}
    if order not in allowed_order:
        order = "viewCount"

    yt = _youtube_data()
    search = (
        yt.search()
        .list(part="id", forMine=True, type="video", order=order, maxResults=max_results)
        .execute()
    )
    video_ids = [
        item["id"]["videoId"]
        for item in search.get("items", [])
        if item.get("id", {}).get("videoId")
    ]
    if not video_ids:
        return {"videos": [], "note": "No videos found."}

    details = (
        yt.videos()
        .list(part="snippet,statistics", id=",".join(video_ids))
        .execute()
    )
    videos = []
    for item in details.get("items", []):
        snip = item.get("snippet", {})
        st = item.get("statistics", {})
        vid = item.get("id")
        videos.append(
            {
                "video_id": vid,
                "title": snip.get("title"),
                "published_at": snip.get("publishedAt"),
                "url": f"https://www.youtube.com/watch?v={vid}",
                "views": _int(st.get("viewCount")),
                "likes": _int(st.get("likeCount")),
                "comments": _int(st.get("commentCount")),
            }
        )
    videos.sort(key=lambda v: v["views"], reverse=True)
    return {"count": len(videos), "order": order, "videos": videos}


@mcp.tool()
def run_analytics_dashboard(script_name: str = "youtube_analytics_dashboard.py", timeout_seconds: int = 180) -> dict:
    """Run the project's analytics dashboard script and return its output.

    Args:
        script_name: Script to execute (must live in the project directory and
                     end in .py). Defaults to youtube_analytics_dashboard.py.
        timeout_seconds: Max seconds to allow the script to run.

    The script's stdout/stderr are redacted of anything resembling a
    credential before being returned. Read-only invocation.
    """
    if not script_name.endswith(".py") or "/" in script_name or "\\" in script_name:
        return {"error": "script_name must be a bare .py filename in the project dir."}

    script_path = PROJECT_DIR / script_name
    if not script_path.exists():
        return {"error": f"Script not found: {script_path}"}

    try:
        proc = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=str(PROJECT_DIR),
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired:
        return {"error": f"Script timed out after {timeout_seconds}s."}

    return {
        "script": script_name,
        "return_code": proc.returncode,
        "stdout": _redact(proc.stdout)[-12000:],
        "stderr": _redact(proc.stderr)[-4000:],
    }


@mcp.tool()
def list_reports() -> dict:
    """List report files available in the project directory.

    Only files with report-like extensions are listed, and the OAuth
    token / client-secret files are always excluded.
    """
    reports = []
    for path in sorted(PROJECT_DIR.iterdir()):
        if not path.is_file():
            continue
        if path.name in SECRET_FILENAMES:
            continue
        if path.suffix.lower() not in REPORT_EXTENSIONS:
            continue
        reports.append(
            {
                "filename": path.name,
                "size_bytes": path.stat().st_size,
                "modified": int(path.stat().st_mtime),
            }
        )
    return {"project_dir": str(PROJECT_DIR), "reports": reports}


@mcp.tool()
def read_report(filename: str, max_chars: int = 20000) -> dict:
    """Read the contents of a generated report file from the project directory.

    Args:
        filename: Bare filename of the report (no path components).
        max_chars: Maximum characters to return.

    The OAuth token and client-secret files can never be read through this
    tool, and output is redacted of any credential-like strings.
    """
    if "/" in filename or "\\" in filename or filename in {"", ".", ".."}:
        return {"error": "Provide a bare filename with no path components."}
    if filename in SECRET_FILENAMES:
        return {"error": "Access to credential files is not permitted."}

    path = (PROJECT_DIR / filename).resolve()
    # Ensure the resolved path is still inside the project directory.
    if PROJECT_DIR.resolve() not in path.parents:
        return {"error": "Path escapes the project directory."}
    if path.suffix.lower() not in REPORT_EXTENSIONS:
        return {"error": f"Unsupported report type: {path.suffix}"}
    if not path.exists():
        return {"error": f"Report not found: {filename}"}

    content = path.read_text(encoding="utf-8", errors="replace")
    truncated = len(content) > max_chars
    return {
        "filename": filename,
        "truncated": truncated,
        "content": _redact(content[:max_chars]),
    }


@mcp.tool()
def recommend_improvements(video_id: str) -> dict:
    """Suggest title, description, tag, and thumbnail improvements for a video.

    Args:
        video_id: The YouTube video id to analyze.

    Read-only and advisory: this tool only fetches public metadata and
    returns suggestions. It does NOT modify any metadata.
    """
    if not video_id or any(c in video_id for c in " \t\n"):
        return {"error": "Provide a valid video_id."}

    yt = _youtube_data()
    resp = yt.videos().list(part="snippet,statistics", id=video_id).execute()
    items = resp.get("items", [])
    if not items:
        return {"error": f"No video found for id {video_id}."}

    snip = items[0].get("snippet", {})
    title = snip.get("title", "") or ""
    description = snip.get("description", "") or ""
    tags = snip.get("tags", []) or []
    thumbs = snip.get("thumbnails", {}) or {}

    suggestions: dict[str, list[str]] = {
        "title": [],
        "description": [],
        "tags": [],
        "thumbnail": [],
    }

    # --- Title heuristics ---
    if len(title) > 70:
        suggestions["title"].append(
            f"Title is {len(title)} chars; aim for <=70 so it isn't truncated in search."
        )
    if len(title) < 30:
        suggestions["title"].append(
            "Title is short; add a specific benefit or keyword (e.g. who it's for)."
        )
    if not re.search(r"\d", title):
        suggestions["title"].append(
            "Consider a number or year for specificity (e.g. '3 Tips', '2026 Guide')."
        )
    if title and title == title.upper():
        suggestions["title"].append("Avoid ALL-CAPS titles; use title case.")

    # --- Description heuristics ---
    if len(description) < 200:
        suggestions["description"].append(
            "Description is thin; aim for 200+ chars with keywords in the first 1-2 lines."
        )
    if "http" not in description.lower():
        suggestions["description"].append(
            "Add a call-to-action link (booking page, website, or related video)."
        )
    if "#" not in description:
        suggestions["description"].append(
            "Add 2-3 relevant hashtags at the end (e.g. #LifeInsurance)."
        )
    first_line = description.split("\n", 1)[0] if description else ""
    if len(first_line) > 157:
        suggestions["description"].append(
            "First line is long; front-load the hook in the first ~150 chars."
        )

    # --- Tag heuristics ---
    if len(tags) < 5:
        suggestions["tags"].append(
            f"Only {len(tags)} tag(s); add 8-15 relevant tags mixing broad and specific terms."
        )
    if len(tags) > 30:
        suggestions["tags"].append(
            "Too many tags can dilute relevance; trim to the 10-15 strongest."
        )

    # --- Thumbnail heuristics ---
    has_maxres = "maxres" in thumbs
    suggestions["thumbnail"].append(
        "Use a custom 1280x720 thumbnail with a clear face, bold readable text (3-5 words), "
        "and high contrast."
        + ("" if has_maxres else " A high-resolution (maxres) thumbnail is not present.")
    )

    # Drop empty buckets for a cleaner response.
    suggestions = {k: v for k, v in suggestions.items() if v}

    return {
        "video_id": video_id,
        "current": {
            "title": title,
            "title_length": len(title),
            "description_length": len(description),
            "tag_count": len(tags),
            "has_maxres_thumbnail": has_maxres,
        },
        "suggestions": suggestions,
        "note": "Advisory only. No metadata was changed.",
    }


@mcp.tool()
def get_analytics_report(days: int = 10) -> dict:
    """Return a full channel analytics report for the last N days.

    Args:
        days: Size of the trailing window in days (default 10).

    Uses the YouTube Analytics API and requires the channel owner's
    credentials (which this project has). Includes headline totals,
    a daily trend, top videos, traffic sources, and top countries.
    """
    from datetime import date, timedelta

    days = max(1, min(int(days), 365))
    end = date.today()
    start = end - timedelta(days=days - 1)
    start_s, end_s = start.isoformat(), end.isoformat()

    yta = _youtube_analytics()

    def _query(metrics, dimensions=None, sort=None, max_results=None):
        params = {
            "ids": "channel==MINE",
            "startDate": start_s,
            "endDate": end_s,
            "metrics": metrics,
        }
        if dimensions:
            params["dimensions"] = dimensions
        if sort:
            params["sort"] = sort
        if max_results:
            params["maxResults"] = max_results
        try:
            return yta.reports().query(**params).execute()
        except Exception as exc:  # surface partial report rather than failing all
            return {"error": _redact(str(exc)), "columnHeaders": [], "rows": []}

    def _rows_as_dicts(resp):
        headers = [h.get("name") for h in resp.get("columnHeaders", [])]
        return [dict(zip(headers, row)) for row in resp.get("rows", [])]

    # 1. Headline totals for the window.
    totals_metrics = (
        "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,"
        "subscribersGained,subscribersLost,likes,comments,shares"
    )
    totals_resp = _query(totals_metrics)
    totals_rows = _rows_as_dicts(totals_resp)
    totals = totals_rows[0] if totals_rows else {}
    if "subscribersGained" in totals or "subscribersLost" in totals:
        totals["netSubscribers"] = _int(totals.get("subscribersGained")) - _int(
            totals.get("subscribersLost")
        )

    # 2. Daily trend.
    daily = _rows_as_dicts(
        _query("views,estimatedMinutesWatched", dimensions="day", sort="day")
    )

    # 3. Top videos in the window.
    top_videos = _rows_as_dicts(
        _query(
            "views,estimatedMinutesWatched,likes,comments",
            dimensions="video",
            sort="-views",
            max_results=10,
        )
    )
    # Attach titles for readability.
    if top_videos:
        ids = [r.get("video") for r in top_videos if r.get("video")]
        try:
            meta = (
                _youtube_data()
                .videos()
                .list(part="snippet", id=",".join(ids))
                .execute()
            )
            title_by_id = {
                it["id"]: it.get("snippet", {}).get("title") for it in meta.get("items", [])
            }
            for r in top_videos:
                r["title"] = title_by_id.get(r.get("video"))
        except Exception:
            pass

    # 4. Traffic sources and 5. Top countries.
    traffic = _rows_as_dicts(
        _query("views", dimensions="insightTrafficSourceType", sort="-views")
    )
    countries = _rows_as_dicts(
        _query("views", dimensions="country", sort="-views", max_results=10)
    )

    return {
        "channel": "authorized channel (owner analytics)",
        "period": {"start": start_s, "end": end_s, "days": days},
        "totals": totals,
        "daily_trend": daily,
        "top_videos": top_videos,
        "traffic_sources": traffic,
        "top_countries": countries,
        "note": "Read-only. Owner analytics via the YouTube Analytics API.",
    }


# ---------------------------------------------------------------------------
# Write tools (full access). These modify your channel. Requires the write
# scope on the token (see authorize_full_access.py). Credentials are never
# returned or logged.
# ---------------------------------------------------------------------------
@mcp.tool()
def update_video_metadata(
    video_id: str,
    title: str | None = None,
    description: str | None = None,
    tags: list[str] | None = None,
    category_id: str | None = None,
) -> dict:
    """Update a video's title, description, tags, and/or category.

    Only the fields you pass are changed; omitted fields keep their current
    values. WRITE operation — modifies your channel.

    Args:
        video_id: The video to update.
        title: New title (<=100 chars). Omit to keep current.
        description: New description (<=5000 chars). Omit to keep current.
        tags: New list of tags (replaces existing). Omit to keep current.
        category_id: New category id. Omit to keep current.
    """
    if not video_id:
        return {"error": "Provide a video_id."}

    yt = _youtube_data(write=True)

    # Fetch current snippet so we only change requested fields. categoryId is
    # required by videos.update, so it must be preserved when not overridden.
    current = yt.videos().list(part="snippet", id=video_id).execute()
    items = current.get("items", [])
    if not items:
        return {"error": f"No video found for id {video_id}."}
    snippet = items[0]["snippet"]

    before = {
        "title": snippet.get("title"),
        "description_length": len(snippet.get("description", "") or ""),
        "tag_count": len(snippet.get("tags", []) or []),
        "category_id": snippet.get("categoryId"),
    }

    if title is not None:
        if len(title) > 100:
            return {"error": "Title exceeds 100 characters."}
        snippet["title"] = title
    if description is not None:
        if len(description) > 5000:
            return {"error": "Description exceeds 5000 characters."}
        snippet["description"] = description
    if tags is not None:
        snippet["tags"] = tags
    if category_id is not None:
        snippet["categoryId"] = category_id

    updated = (
        yt.videos()
        .update(part="snippet", body={"id": video_id, "snippet": snippet})
        .execute()
    )
    new_snip = updated.get("snippet", {})
    return {
        "video_id": video_id,
        "updated": True,
        "before": before,
        "after": {
            "title": new_snip.get("title"),
            "description_length": len(new_snip.get("description", "") or ""),
            "tag_count": len(new_snip.get("tags", []) or []),
            "category_id": new_snip.get("categoryId"),
        },
    }


@mcp.tool()
def set_video_thumbnail(video_id: str, image_path: str) -> dict:
    """Upload and set a custom thumbnail for a video.

    Args:
        video_id: The video to update.
        image_path: Path to the image file (JPG/PNG, <=2MB, ideally 1280x720).

    WRITE operation — modifies your channel.
    """
    from googleapiclient.http import MediaFileUpload

    if not video_id:
        return {"error": "Provide a video_id."}
    img = Path(image_path)
    if not img.exists() or not img.is_file():
        return {"error": f"Image not found: {image_path}"}
    if img.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        return {"error": "Thumbnail must be a .jpg or .png file."}
    if img.stat().st_size > 2 * 1024 * 1024:
        return {"error": "Thumbnail exceeds the 2MB limit."}

    yt = _youtube_data(write=True)
    media = MediaFileUpload(str(img))
    resp = yt.thumbnails().set(videoId=video_id, media_body=media).execute()
    items = resp.get("items", [])
    return {
        "video_id": video_id,
        "thumbnail_set": True,
        "available_resolutions": list(items[0].keys()) if items else [],
    }


if __name__ == "__main__":
    mcp.run()
