# YouTube MCP Server (full access)

A local [Model Context Protocol](https://modelcontextprotocol.io) server that lets
Claude read **and manage** your YouTube channel through your **existing** YouTube API
project (the one in `C:\YouTubeAPI`). It reuses the credentials from that project and
**never exposes or prints your OAuth token or client secret**.

> Channel verified by the existing project: **The Life Insurance Professionals**

## Tools

### Read
| Tool | Description |
|------|-------------|
| `get_channel_summary` | Channel title, description preview, subscribers, total views, video count |
| `get_top_videos` | Top videos ranked by views (or other order) with public stats |
| `run_analytics_dashboard` | Runs your `youtube_analytics_dashboard.py` and returns its output |
| `list_reports` | Lists generated report files in the project folder |
| `read_report` | Reads a chosen report file (credential files are blocked) |
| `recommend_improvements` | Heuristic title / description / tag / thumbnail suggestions for a video |

### Write (modifies your channel)
| Tool | Description |
|------|-------------|
| `update_video_metadata` | Update a video's title, description, tags, and/or category (only the fields you pass change) |
| `set_video_thumbnail` | Upload and set a custom thumbnail (JPG/PNG, ≤2MB) |

## Safety

- **No secret leakage.** The token and client-secret files can never be read through
  the report tools, and all script/report output is run through a credential redactor.
- **Surgical edits.** `update_video_metadata` fetches the current snippet first and only
  changes the fields you pass, so untouched fields are preserved.
- **Write gating.** Write tools require the token to hold the `youtube.force-ssl` scope;
  if it doesn't, they return a clear instruction to run the authorization step below.

## Setup

1. Copy `youtube_mcp_server.py`, `authorize_full_access.py`, and `requirements.txt`
   into `C:\YouTubeAPI` (next to `youtube-token.json`).

2. Install dependencies:

   ```bat
   cd C:\YouTubeAPI
   pip install -r requirements.txt
   ```

3. **Authorize full (read + write) access — one time.** Your current token is likely
   read-only, so the write tools won't work until you grant write scope:

   ```bat
   cd C:\YouTubeAPI
   python authorize_full_access.py
   ```

   A browser opens; approve the access on your Google account. The new token is saved
   back to `youtube-token.json` (the token itself is never printed).

## Connect it to Claude

**Claude Code CLI:**

```bat
claude mcp add youtube --env YOUTUBE_API_DIR=C:\YouTubeAPI -- python C:\YouTubeAPI\youtube_mcp_server.py
```

Verify with `claude mcp list`.

**Claude Desktop** — `Settings → Developer → Edit Config`:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "python",
      "args": ["C:\\YouTubeAPI\\youtube_mcp_server.py"],
      "env": { "YOUTUBE_API_DIR": "C:\\YouTubeAPI" }
    }
  }
}
```

Then fully quit and reopen Claude Desktop.

### Notes
- If `python` isn't recognized, use `py` or the full path to your Python executable.
- To remove later: `claude mcp remove youtube`.
