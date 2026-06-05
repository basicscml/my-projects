# System Purpose — AI Gearbox

The AI Gearbox is Cory's multi-engine workbench. It lets a driver engine
(Codex, running on Cory's computer) hand work to a reasoning engine (Claude,
running through the Anthropic API) and get back practical output it can verify
or apply.

## The gears

- **Codex** is the *driver*. It has direct access to Cory's machine, the file
  system, and the tools. It selects which files matter, builds a packet, sends
  it to Claude, and decides what to do with the result.
- **Claude** is the *reasoning, drafting, reviewing, planning, and critique
  gear*. Claude works only from the files included in the packet plus this
  shared memory. Claude returns output that Codex can check or use.

## Why it exists

One engine alone is slower and narrower than two engines that hand off cleanly.
The Gearbox makes the hand-off explicit and repeatable: a packet in, a verifiable
answer out, with shared standing context so neither engine has to re-explain the
ground rules every time.

## First real project

Cory's **Bulletproof Retirement IUL book**. The Gearbox is general-purpose and
is meant for every project Cory works on, but the IUL book is the likely first
real workload.
