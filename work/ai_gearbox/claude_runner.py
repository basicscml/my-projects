"""Claude runner for the AI Gearbox.

Takes a packet (a string, or a saved packet file) and sends it to Claude through
the Anthropic API. The response is saved under ``responses/`` and the status
pointer is updated so Codex can always find the latest answer.

The Anthropic SDK is imported lazily inside ``run_packet`` so the rest of the
Gearbox (and its tests) work without the SDK installed or an API key set.
"""

from __future__ import annotations

import datetime as _dt
import os
import pathlib

GEARBOX_ROOT = pathlib.Path(__file__).resolve().parent
RESPONSES_DIR = GEARBOX_ROOT / "responses"
STATUS_DIR = GEARBOX_ROOT / "status"
STATUS_POINTER = STATUS_DIR / "latest_response.txt"

# Default model for the reasoning gear. Override with GEARBOX_MODEL.
DEFAULT_MODEL = "claude-opus-4-8"
DEFAULT_MAX_TOKENS = 8000


def _extract_text(message) -> str:
    """Pull the text out of an Anthropic message response."""
    parts = []
    for block in getattr(message, "content", []) or []:
        text = getattr(block, "text", None)
        if text:
            parts.append(text)
    return "\n".join(parts)


def save_response(
    text: str,
    *,
    responses_dir: pathlib.Path | None = None,
    status_pointer: pathlib.Path | None = None,
) -> pathlib.Path:
    """Save a response and update the status pointer to point at it.

    Returns the path to the saved response file.
    """
    responses_dir = pathlib.Path(responses_dir) if responses_dir else RESPONSES_DIR
    status_pointer = pathlib.Path(status_pointer) if status_pointer else STATUS_POINTER
    responses_dir.mkdir(parents=True, exist_ok=True)
    status_pointer.parent.mkdir(parents=True, exist_ok=True)

    stamp = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    out = responses_dir / f"response-{stamp}.md"
    counter = 1
    while out.exists():
        out = responses_dir / f"response-{stamp}-{counter}.md"
        counter += 1
    out.write_text(text, encoding="utf-8")

    # The pointer holds the path to the latest response so Codex can find it.
    status_pointer.write_text(str(out), encoding="utf-8")
    return out


def run_packet(
    packet: str,
    *,
    model: str | None = None,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    save: bool = True,
) -> dict:
    """Send a packet to Claude and (optionally) save the response.

    Returns a dict with ``text`` and, when saved, ``response_path``.

    Requires the ``anthropic`` package and the ``ANTHROPIC_API_KEY`` environment
    variable.
    """
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Export it before running a packet."
        )

    try:
        from anthropic import Anthropic
    except ImportError as exc:  # pragma: no cover - depends on environment
        raise RuntimeError(
            "The 'anthropic' package is required. Install it with "
            "'pip install anthropic'."
        ) from exc

    client = Anthropic()
    message = client.messages.create(
        model=model or os.environ.get("GEARBOX_MODEL", DEFAULT_MODEL),
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": packet}],
    )
    text = _extract_text(message)

    result = {"text": text}
    if save:
        result["response_path"] = str(save_response(text))
    return result


def _load_packet(arg: str) -> str:
    """Treat the argument as a file path if it exists, else as literal text."""
    path = pathlib.Path(arg)
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return arg


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run an AI Gearbox packet.")
    parser.add_argument(
        "packet",
        help="A packet file path, or the packet text itself.",
    )
    parser.add_argument("--model", default=None, help="Override the model id.")
    parser.add_argument(
        "--max-tokens", type=int, default=DEFAULT_MAX_TOKENS, help="Max output tokens."
    )
    args = parser.parse_args()

    outcome = run_packet(
        _load_packet(args.packet), model=args.model, max_tokens=args.max_tokens
    )
    print(outcome["text"])
    if "response_path" in outcome:
        print(f"\n[saved to {outcome['response_path']}]")
