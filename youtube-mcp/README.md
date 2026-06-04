# YouTube Read-Only MCP Server

A local [Model Context Protocol](https://modelcontextprotocol.io) server that lets
Claude read your YouTube channel data through your **existing** YouTube API project
(the one in `C:\YouTubeAPI`). It reuses the credentials you already authorized — it
never asks you to log in again, and it **never exposes or prints your OAuth token or
client secret**.

> Channel verified by the existing project: **The Life Insurance Professionals**

## What it does (read-only, phase 1)

| Tool | Description |
|------|-------------|
| `get_channel_summary` | Channel title, description preview, subscribers, total views, video count |
| `get_top_videos` | Top videos ranked by views (or other order) with public stats |
| `run_analytics_dashboard` | Runs your `youtube_analytics_dashboard.py` and returns its output |
| `list_reports` | Lists generated report files in the project folder |
| `read_report` | Reads a chosen report file (credential files are blocked) |
| `recommend_improvements` | Heuristic title / description / tag / thumbnail suggestions for a video |

## Safety guarantees

- **Read-only.** No write scopes are requested; there are no tools that change
  metadata, upload, or delete. (Metadata editing is intentionally out of scope for now.)
- **No secret leakage.** The token and client-secret files can never be read through
  the report tools, and all script/report output is run through a credential redactor.
- **Sandboxed file access.** Report reads are restricted to the project directory and
  to report-like file extensions.

## Setup

1. Copy `youtube_mcp_server.py` and `requirements.txt` into `C:\YouTubeAPI`
   (next to `youtube-token.json`).

2. Install dependencies (ideally into the same Python env your project already uses):

   ```bat
   cd C:\YouTubeAPI
   pip install -r requirements.txt
   ```

3. Make sure your existing token has read scopes
   (`youtube.readonly` and `yt-analytics.readonly`). If your project authorized
   with broader scopes that already include these, no action is needed.

## Connect it to Claude

Run this from any terminal (replace `python` with `py` or a full path if needed):

```bat
claude mcp add youtube-readonly --env YOUTUBE_API_DIR=C:\YouTubeAPI -- python C:\YouTubeAPI\youtube_mcp_server.py
```

Then verify:

```bat
claude mcp list
```

You should see `youtube-readonly` connected. In Claude you can then ask things like
*"Get my channel summary"* or *"Show my top 10 videos and recommend improvements for the first one."*

### Notes
- `YOUTUBE_API_DIR` tells the server where your token/reports live. If you put the
  server file directly in `C:\YouTubeAPI`, it auto-detects the folder even without the env var.
- To remove it later: `claude mcp remove youtube-readonly`.
