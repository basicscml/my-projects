#!/usr/bin/env python3
"""
Register the YouTube MCP server with the Claude Desktop app by merging an
entry into claude_desktop_config.json. Safe to re-run: it only adds/updates
the "youtube" entry and leaves any other servers untouched.
"""

from __future__ import annotations

import os
import json
import sys
from pathlib import Path


def _config_path() -> Path:
    # Windows: %APPDATA%\Claude\claude_desktop_config.json
    appdata = os.environ.get("APPDATA")
    if appdata:
        return Path(appdata) / "Claude" / "claude_desktop_config.json"
    # macOS fallback (in case this is used cross-platform)
    home = Path.home()
    mac = home / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
    return mac


def main() -> int:
    project_dir = Path(os.environ.get("YOUTUBE_API_DIR") or Path(__file__).resolve().parent)
    server_script = project_dir / "youtube_mcp_server.py"
    python_exe = sys.executable or "python"

    cfg_path = _config_path()
    cfg_path.parent.mkdir(parents=True, exist_ok=True)

    if cfg_path.exists():
        try:
            config = json.loads(cfg_path.read_text(encoding="utf-8") or "{}")
        except json.JSONDecodeError:
            print(f"Existing config at {cfg_path} is not valid JSON. Fix or remove it, then re-run.")
            return 1
    else:
        config = {}

    config.setdefault("mcpServers", {})
    config["mcpServers"]["youtube"] = {
        "command": python_exe,
        "args": [str(server_script)],
        "env": {"YOUTUBE_API_DIR": str(project_dir)},
    }

    cfg_path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    print(f"Registered 'youtube' in {cfg_path}.")
    print("Fully quit Claude Desktop (system tray -> Quit) and reopen it to load the server.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
