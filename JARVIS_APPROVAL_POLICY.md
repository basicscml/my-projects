# Jarvis — Change-Approval Policy (PIN-Gated)
Working build only: C:\Users\User\Desktop\jarvis-voice-base  (port 8340)
Set by Cory. This policy applies to EVERY integration, current and future.

=====================================================
## CORE RULE
=====================================================
1. DEFAULT = READ-ONLY for every connector.
   Jarvis may read/list/search/report freely.

2. ANY change action requires a PIN BEFORE it runs.
   No PIN, or wrong PIN -> action is BLOCKED. Jarvis stays read-only.

   *** PIN IS ONLY EVER REQUESTED FOR A CHANGE ***
   - Jarvis must NOT ask for the PIN during normal talk, questions,
     reports, or any read-only action. No nagging, no upfront login.
   - The PIN prompt appears ONLY at the exact moment a change is about
     to run. Cory says it, that one change runs, then back to read-only.

3. The PIN is VERBAL / SPOKEN. Cory says it out loud to the orb.
   Jarvis listens for the spoken PIN; no typing required.

4. On a change request Jarvis must:
   a. STOP before doing anything.
   b. SAY OUT LOUD in plain language exactly what it will do
      (which connector, which item, what change).
   c. Ask aloud: "Say your PIN to approve."
   d. Correct spoken PIN -> perform that ONE action, then return to read-only.
      Wrong/no PIN        -> block, do nothing, say it is blocked.

=====================================================
## WHAT COUNTS AS A "CHANGE" (PIN REQUIRED)
=====================================================
- Email: send, reply, forward, delete, move, label, archive
- WordPress: create/edit/publish/delete posts, pages, settings, plugins
- Calendar: create, edit, delete, respond to events
- Drive/Sheets/Files: create, edit, move, rename, delete, share
- GHL: edit contacts, send messages, change pipelines/automations
- Ads / Optmyzr: change budgets, bids, status, campaigns
- Stripe / payments: ANY money movement (always PIN, no exceptions)
- Social: post, comment, message, delete
- Local computer / file system: any write, move, delete, run-that-changes
- Any new connector's write/delete/send/publish/pay action

=====================================================
## WHAT IS ALWAYS ALLOWED (NO PIN)
=====================================================
- Reading, listing, searching, viewing, reporting
- Pulling analytics / metrics
- Drafting (preparing a draft is fine; SENDING/SAVING it needs PIN)

=====================================================
## PIN HANDLING RULES
=====================================================
- PIN is set and stored ONLY on the PC (config, stored hashed/scrambled).
- PIN is approved by VOICE: Cory speaks it, Jarvis matches it to the stored PIN.
- Never print, display, or repeat the PIN aloud. Never put it in chat, logs, or GitHub.
- One PIN approves ONE change action, then Jarvis reverts to read-only.
  (Adjustable later if Cory wants a short approved window instead.)
- Cory can change or revoke the PIN at any time.
- If unsure whether something is a change -> treat it as a change, ask for PIN.

=====================================================
## FOR THE PC CLAUDE CODE SESSION
=====================================================
Implement this as a single approval gate in front of all write/change
tool calls, so every connector goes through the same PIN check.
Do not break the orb or change port 8340. Read-only paths stay un-gated.
