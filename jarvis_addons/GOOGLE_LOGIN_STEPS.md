# Google logins for Jarvis -- BOTH accounts, ONE setup. All READ-ONLY.
Changes later = verbal PIN. What each account is for: GOOGLE_ACCOUNTS_USAGE.md

  digitallifeinsurance@gmail.com          = primary / day-to-day (DEFAULT)
       Gmail, Drive, Sheets, Calendar, GBP, Search Console (+ GA4/Ads/YouTube)
  cory@thelifeinsuranceprofessionals.com  = business domain Workspace
       Gmail, Drive, Sheets, Calendar on the company domain

## PART A - Google Cloud Console (browser, ~5 min, ONE time)
Same OAuth client serves both accounts.
1. https://console.cloud.google.com/ -> create/select project "Jarvis".
2. APIs & Services -> Enable APIs -> enable:
     Gmail, Drive, Sheets, Calendar, Search Console, Business Profile.
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
  python jarvis_addons\google_oauth_setup.py digitallife   (sign in: digitallifeinsurance@gmail.com)
  python jarvis_addons\google_oauth_setup.py workspace     (sign in: cory@thelifeinsuranceprofessionals.com)

## PART D - verify reads
  python jarvis_addons\google_workspace_readonly_test.py digitallife
  python jarvis_addons\google_workspace_readonly_test.py workspace
  python jarvis_addons\gbp_readonly_test.py
  python jarvis_addons\searchconsole_readonly_test.py

Both accounts read-only. Jarvis uses each by purpose (see GOOGLE_ACCOUNTS_USAGE.md).
