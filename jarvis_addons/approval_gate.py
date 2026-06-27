"""
Verbal PIN approval gate for Jarvis.
Default: everything read-only. Any change must be approved by a SPOKEN PIN.
Drop into jarvis-voice-base. Wire require_pin() in front of every write action.
Never prints or logs the PIN.
"""
import hashlib
from pathlib import Path

PIN_FILE = Path(__file__).resolve().parent.parent / "jarvis_pin.txt"


def _load_pin_hash():
    """Read jarvis_pin.txt (local, git-ignored). Line format: PIN=xxxx"""
    if not PIN_FILE.exists():
        return None
    for line in PIN_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("#") or not line:
            continue
        if line.upper().startswith("PIN="):
            value = line.split("=", 1)[1].strip()
            if value:
                return hashlib.sha256(value.encode()).hexdigest()
    return None


def check_pin(spoken_pin: str) -> bool:
    """True if the spoken PIN matches the stored one. Never logs either value."""
    stored = _load_pin_hash()
    if not stored or not spoken_pin:
        return False
    given = hashlib.sha256(spoken_pin.strip().encode()).hexdigest()
    return given == stored


def require_pin(action_description: str, get_spoken_pin):
    """
    Call this right before ANY change.
      action_description: plain words Jarvis says out loud, e.g.
                          "publish the post titled Spring IUL Tips"
      get_spoken_pin:     a function that prompts aloud and returns what the user said.
    Returns True only if approved. Returns False (blocked) otherwise.
    """
    # Jarvis should SAY this out loud:
    prompt = f"I'm about to {action_description}. Say your PIN to approve."
    spoken = get_spoken_pin(prompt)
    if check_pin(spoken):
        return True
    # blocked -> Jarvis says: "Blocked. No change made."
    return False
