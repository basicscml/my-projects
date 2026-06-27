# Jarvis — Connections & Missing Access Checklist
Working build only: C:\Users\User\Desktop\jarvis-voice-base  (port 8340)
Status read live at: http://127.0.0.1:8340/integrations
Rule: read-only first. Any send/edit/delete/move/publish/payment = approval-gated.

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
## PARTIAL — works now, official upgrade pending
=====================================================
[ ] Official Google Ads API  (GAQL.app covers reporting meanwhile)
    Missing:
      - Google Ads developer token  (Ads account -> API Center)
      - Google Ads refresh token    (OAuth login, one time)
      - (also need: OAuth client ID + secret)

=====================================================
## NEXT TARGETS — gather these to connect
=====================================================

[ ] GOOGLE WORKSPACE  (one OAuth setup covers all 5)
    Where: Google Cloud Console -> APIs & Services
    Steps: enable Gmail, Drive, Sheets, Calendar, Search Console APIs
           -> create OAuth client -> authorize .readonly scopes
    Hand Jarvis:
      - OAuth client ID
      - OAuth client secret
      - refresh token (from one login)
    Sub-items:
      [ ] Gmail          — read-only first
      [ ] Drive          — read-only first
      [ ] Sheets         — read-only first
      [ ] Calendar       — read-only first
      [ ] Search Console — read-only

[ ] WORDPRESS
    Hand Jarvis:
      - WordPress admin URL
      - WordPress username
      - Application Password  (WP Admin -> Users -> Profile -> Application Passwords -> Add New)
    Note: write-capable -> keep editing/publishing approval-gated.

[~] GOOGLE BUSINESS PROFILE (GBP)   <-- IDs DONE, OAuth login still needed
    Owner access: VERIFIED (digitallifeinsurance@gmail.com)
    [x] GBP Account ID : 10179203546351514980
    [x] GBP Location ID: 9899246156341434499
    [x] Store Code     : 09109871034188580570
    [ ] Google OAuth with Business Profile permission (the only thing left)
        -> stored in config["google_oauth"]["access_token"]
        -> scope: https://www.googleapis.com/auth/business.manage
           (Jarvis self-restricts to READ until a verbal PIN is given)
    Read-only first: reviews, calls, profile insights.
    Code ready: jarvis_addons/gbp_readonly_test.py
    Writes (reply/post/edit/photos) = verbal PIN required.

[ ] DATAFORSEO / SERP
    Hand Jarvis (one of):
      - DataForSEO API login + password, OR
      - SERP provider API key
    Get it: sign up -> copy key from dashboard.

[ ] OPTMYZR
    Hand Jarvis:
      - Optmyzr API key  (Settings -> API access)
    Note: requires a plan that includes API.

[ ] STRIPE  (later)
    Hand Jarvis:
      - Restricted key, READ-ONLY scopes only
        (Stripe -> Developers -> API keys -> Create restricted key)
    Rule: never the secret key. Money movement always approval-gated.

[ ] SOCIAL — Facebook / Instagram / LinkedIn
    Hand Jarvis:
      - Facebook/Instagram: Meta Business app token (Graph API, read scopes)
      - LinkedIn: app client ID + secret + access token (read scopes)
    Read-only first: page/post/insights reads.

=====================================================
## HOW TO USE THIS
=====================================================
For each unchecked item:
  1. PC Claude Code checks if the credential already exists locally
     (config.json / token files) before asking.
  2. If found -> connect -> run ONE real read-only test call -> check the box.
  3. If missing -> that's the exact item to go get (listed above).

Never print or expose token values. Confirm /integrations still passes after each add.
