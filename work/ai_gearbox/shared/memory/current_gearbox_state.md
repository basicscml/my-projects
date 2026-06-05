# Current Gearbox State

_Last updated: 2026-06-05_

## Status

The Gearbox is rebuilt in version control in the `basicscml/my-projects`
repository under `work/ai_gearbox/`. This is the canonical, shareable copy.
Codex originally built a working prototype in a local Windows workspace; this
repo version mirrors that design so it can be pulled onto any machine and run.

## What exists

- `packet_builder.py` — gathers shared memory + selected files into a single
  prompt packet and saves it under `packets/`.
- `claude_runner.py` — sends a packet to Claude through the Anthropic API,
  saves the response under `responses/`, and updates the status pointer.
- `shared/memory/` — standing context included automatically on every call:
  - `system_purpose.md`
  - `global_working_agreement.md`
  - `current_gearbox_state.md` (this file)
- `packets/` — saved prompt packets.
- `responses/` — saved Claude responses.
- `status/latest_response.txt` — pointer to the most recent response file.
- `tests/` — unit tests for packet building and memory collection.

## Verified behavior

- `ANTHROPIC_API_KEY` is read from the environment by `claude_runner.py`.
- Packet building and memory collection are covered by unit tests that run
  without any API key.

## Next intended work

Use the Gearbox for real projects. The likely first project is Cory's
Bulletproof Retirement IUL book. The system is meant for every project Cory
works on, not just that one.
