# AI Gearbox

Cory's multi-engine workbench. **Codex** drives (it has the machine and the
files); **Claude** is the reasoning, drafting, reviewing, planning, and critique
gear (it works from a packet sent through the Anthropic API). Shared memory
travels with every call so the standing context never has to be re-explained.

```
work/ai_gearbox/
├── README.md
├── packet_builder.py        # gather shared memory + selected files into a packet
├── claude_runner.py         # send a packet to Claude, save the response
├── shared/memory/           # standing context, auto-included on every call
│   ├── system_purpose.md
│   ├── global_working_agreement.md
│   └── current_gearbox_state.md
├── packets/                 # saved prompt packets
├── responses/               # saved Claude responses
├── status/latest_response.txt   # pointer to the most recent response
└── tests/                   # unit tests (run without an API key)
```

## How a call flows

1. **Codex builds a packet** with `packet_builder.build_packet(task, files)`.
   Shared memory is always included; Codex adds whichever project files matter.
2. **Codex sends it** with `claude_runner.run_packet(packet)`.
3. **Claude answers**, working only from the packet, honoring the global working
   agreement, and flagging anything that needs human/legal/compliance review.
4. **The response is saved** under `responses/` and `status/latest_response.txt`
   is updated so Codex can always find the latest answer.

## Quick start

```bash
# from the repo root
export ANTHROPIC_API_KEY=...        # required to actually call Claude
export PYTHONPATH=work/ai_gearbox   # so the modules import cleanly

# Build a packet that includes a project file and save it
python work/ai_gearbox/packet_builder.py "Review this draft" path/to/draft.md --save

# Run a packet (file path or literal text both work)
python work/ai_gearbox/claude_runner.py work/ai_gearbox/packets/packet-XXXX.txt
```

Use from Python:

```python
import packet_builder, claude_runner

packet = packet_builder.build_packet(
    task="Critique chapter 1 of the IUL book for compliance risk.",
    selected_files=["book/chapter1.md"],
)
result = claude_runner.run_packet(packet)   # needs ANTHROPIC_API_KEY
print(result["text"])
print("saved to", result["response_path"])
```

## Configuration

- `ANTHROPIC_API_KEY` — required by `claude_runner` to call Claude.
- `GEARBOX_MODEL` — override the model id (default `claude-opus-4-8`).

## Tests

```bash
PYTHONPATH=work/ai_gearbox python -m unittest discover -s work/ai_gearbox/tests
```

Tests cover packet building, shared-memory collection, response saving, and the
status pointer. They do not hit the network, so no API key is needed to run them.

## What Claude does on every call

See `shared/memory/global_working_agreement.md`. In short: treat shared memory as
standing context, use only the files in the packet, return verifiable practical
output, flag uncertainty and any need for human/legal/financial/compliance
review, and never claim direct access to Cory's machine or outside tools unless
their contents are in the packet.
