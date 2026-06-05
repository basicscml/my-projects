"""Packet builder for the AI Gearbox.

Codex (the driver) uses this to gather shared memory plus a selected set of
local files into a single prompt packet that Claude (the reasoning gear) can
read. Shared memory is always included so the standing context travels with
every call.

This module has no third-party dependencies, so it can be unit tested without
an API key.
"""

from __future__ import annotations

import datetime as _dt
import pathlib

# The Gearbox root is the directory that contains this file.
GEARBOX_ROOT = pathlib.Path(__file__).resolve().parent
MEMORY_DIR = GEARBOX_ROOT / "shared" / "memory"
PACKETS_DIR = GEARBOX_ROOT / "packets"

# Marker used to delimit each file inside the packet so Claude can tell the
# included files apart cleanly.
_FILE_OPEN = "----- BEGIN FILE: {path} -----"
_FILE_CLOSE = "----- END FILE: {path} -----"


def collect_memory_files(memory_dir: pathlib.Path | None = None) -> list[pathlib.Path]:
    """Return the shared memory files, sorted by name for a stable order.

    Only top-level ``.md`` files in the memory directory are collected.
    """
    memory_dir = pathlib.Path(memory_dir) if memory_dir else MEMORY_DIR
    if not memory_dir.is_dir():
        return []
    return sorted(p for p in memory_dir.glob("*.md") if p.is_file())


def _render_file(path: pathlib.Path, label: str) -> str:
    """Render a single file as a labeled block for the packet."""
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:  # pragma: no cover - defensive
        text = f"[could not read file: {exc}]"
    return "\n".join(
        [
            _FILE_OPEN.format(path=label),
            text.rstrip("\n"),
            _FILE_CLOSE.format(path=label),
        ]
    )


def build_packet(
    task: str,
    selected_files: list[str | pathlib.Path] | None = None,
    *,
    memory_dir: pathlib.Path | None = None,
    base_dir: pathlib.Path | None = None,
) -> str:
    """Build a prompt packet from shared memory, selected files, and a task.

    Parameters
    ----------
    task:
        The instruction or question for Claude.
    selected_files:
        Paths to local files Codex wants Claude to use. Resolved relative to
        ``base_dir`` when given, otherwise used as-is.
    memory_dir:
        Override for the shared memory directory (used in tests).
    base_dir:
        Optional base directory for resolving ``selected_files``.
    """
    selected_files = selected_files or []
    base = pathlib.Path(base_dir) if base_dir else None

    sections: list[str] = []

    sections.append(
        "You are the reasoning, drafting, reviewing, planning, and critique "
        "gear of Cory's AI Gearbox. The shared memory below is standing "
        "context. Use only the files included in this packet. Honor the global "
        "working agreement and confirm it is in effect."
    )

    # Shared memory (always included).
    memory_files = collect_memory_files(memory_dir)
    if memory_files:
        sections.append("===== SHARED MEMORY =====")
        for path in memory_files:
            sections.append(_render_file(path, f"shared/memory/{path.name}"))

    # Selected project files.
    if selected_files:
        sections.append("===== PACKET FILES =====")
        for raw in selected_files:
            path = pathlib.Path(raw)
            if base and not path.is_absolute():
                path = base / path
            sections.append(_render_file(path, str(raw)))

    # The task goes last so it is the freshest instruction.
    sections.append("===== TASK =====")
    sections.append(task.strip())

    return "\n\n".join(sections) + "\n"


def save_packet(packet: str, *, packets_dir: pathlib.Path | None = None) -> pathlib.Path:
    """Save a packet to the packets directory with a timestamped name.

    Returns the path written.
    """
    packets_dir = pathlib.Path(packets_dir) if packets_dir else PACKETS_DIR
    packets_dir.mkdir(parents=True, exist_ok=True)
    stamp = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    out = packets_dir / f"packet-{stamp}.txt"
    # Avoid clobbering if two packets are built in the same second.
    counter = 1
    while out.exists():
        out = packets_dir / f"packet-{stamp}-{counter}.txt"
        counter += 1
    out.write_text(packet, encoding="utf-8")
    return out


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Build an AI Gearbox packet.")
    parser.add_argument("task", help="The instruction or question for Claude.")
    parser.add_argument(
        "files",
        nargs="*",
        help="Optional local files to include in the packet.",
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save the packet under packets/ instead of printing it.",
    )
    args = parser.parse_args()

    built = build_packet(args.task, args.files)
    if args.save:
        path = save_packet(built)
        print(f"Saved packet to {path}")
    else:
        print(built)
