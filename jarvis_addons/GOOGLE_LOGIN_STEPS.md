# Google logins for Jarvis -- BOTH accounts, ONE setup. Read-only.
Routing: GOOGLE_ACCOUNTS_USAGE.md. Changes/sending = verbal PIN.

  business : cory@thelifeinsuranceprofessionals.com  -> EMAIL only (inbox read)
  digitallife : digitallifeinsurance@gmail.com       -> Drive, Sheets, Docs,
                Calendar, GBP, Search Console (+ GA4/Ads/YouTube)

## PART A - Google Cloud Console (browser, ~5 min, ONE time)
Same OAuth client serves both accounts.
1. https://console.cloud.google.com/ -> create/select project "Jarvis".
2. APIs & Services -> Enable APIs -> enable:
     Gmail, Drive, Sheets, Docs, Calendar, Search Console, Business Profile.
3. OAuth consent screen -> External -> app name "Jarvis" + support email.
   Test users -> ADD BOTH:
     - digitallifeinsurance@gmail.com
     - cory@thelifeinsuranceprofessionals.com
4. Credentials -> Create Credentials -> OAuth client ID -> Desktop app -> Create.
   Copy Client ID + Client secret.

## PART B - config.json (on PC)
  "google_oauth": {
    "client_id": "PASTE_CLIENT_ID",
    "client_secret": "PASTE_CLIENT_SECRET"
  }

## PART C - run the login for each account (sign in as the matching one)
  cd C:\Users\User\Desktop\jarvis-voice-base
  python jarvis_addons\google_oauth_setup.py digitallife  (sign in: digitallifeinsurance@gmail.com)
  python jarvis_addons\google_oauth_setup.py business     (sign in: cory@thelifeinsuranceprofessionals.com)

## PART D - verify reads
  python jarvis_addons\google_workspace_readonly_test.py            (both)
  python jarvis_addons\gbp_readonly_test.py                         (reviews)
  python jarvis_addons\searchconsole_readonly_test.py               (search stats)
