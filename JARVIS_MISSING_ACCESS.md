# Jarvis — Connections & Missing Access Checklist
Working build only: C:\Users\User\Desktop\jarvis-voice-base  (port 8340)
Status read live at: http://127.0.0.1:8340/integrations
Rule: read-only first. Any send/edit/delete/move/publish/payment = verbal-PIN-gated.
Legend: [x] done   [~] code built, key/login needed   [ ] not started

=====================================================
## CONNECTED & VERIFIED  (do not break these)
=====================================================
[x] Claude brain
[x] OpenAI voice / TTS
[x] GoHighLevel (GHL) — read-only
[x] Google Ads via GAQL.app — read-only  (workaround, working)
[x] Google Analytics 4 (GA4) — read-only
[x] YouTube — read-only / analytics
[x] Browser — search / open / read
[x] Screen look
[x] Local files / tasks — read
[x] Computer / file system operator — changes require approval

=====================================================
## GOOGLE — two accounts, routed by purpose
(see jarvis_addons/GOOGLE_ACCOUNTS_USAGE.md)
=====================================================
Build A (browser, once): Google Cloud project + OAuth client (Desktop app),
  enable Gmail/Drive/Sheets/Docs/Calendar/Search Console/Business Profile APIs,
  add BOTH emails as test users. Put client_id + client_secret in config.json.

[~] digitallifeinsurance@gmail.com  (config key "digitallife")  — code built
    Login: python jarvis_addons/google_oauth_setup.py digitallife
    Covers: Drive, Sheets, Docs, Calendar, GBP, Search Console
    [x] GBP Account ID : 10179203546351514980
    [x] GBP Location ID: 9899246156341434499
    [x] Store Code     : 09109871034188580570
    Need: the one-time browser sign-in.

[~] cory@thelifeinsuranceprofessionals.com  (config key "business")  — code built
    Login: python jarvis_addons/google_oauth_setup.py business
    Covers: business email INBOX (read-only). Sending = later, PIN-gated.
    Need: the one-time browser sign-in.

=====================================================
## OTHER INTEGRATIONS
=====================================================
[~] WORDPRESS  — code built (jarvis_addons/wordpress_readonly_test.py)
    Need in config["wordpress"]:
      - url       (https://thelifeinsuranceprofessionals.com/wp-admin)
      - username  (cory@thelifeinsuranceprofessionals.com)
      - app_password  (WP Admin -> Users -> Profile -> Application Passwords)
    Editing/publishing = verbal PIN.

[~] DATAFORSEO / SERP  — code built (jarvis_addons/dataforseo_readonly_test.py)
    Need in config["dataforseo"]:
      - login + password   (sign up at dataforseo.com -> API access)
    Read-only keyword ranks / SERP data.

[parked] STRIPE  — NOT NEEDED right now (Cory). Code exists but unused.
    If ever wanted: config["stripe"]["restricted_key"] (read-only "rk_" key).

[ ] OPTMYZR
    Need: Optmyzr API key (Settings -> API access; plan must include API).

[ ] OFFICIAL GOOGLE ADS API  (GAQL.app covers reporting meanwhile)
    Need: developer token + refresh token (+ OAuth client id/secret).

[ ] SOCIAL — Facebook / Instagram / LinkedIn
    Need: Meta Business app token (FB/IG, read scopes);
          LinkedIn app client id + secret + access token (read scopes).
    Read-only first.

=====================================================
## SECURITY / CONTROL (already set)
=====================================================
[x] Verbal PIN gate — jarvis_addons/approval_gate.py (read JARVIS_APPROVAL_POLICY.md)
[x] PIN file template — jarvis_pin.txt.example (real jarvis_pin.txt is git-ignored)

=====================================================
## HOW TO USE THIS
=====================================================
For each [~] item: drop the key/login into config.json on the PC, run its test
script, and it flips on. For each [ ] item: that's the key still to go get.
Never print or expose token values. Confirm /integrations still passes after each add.
