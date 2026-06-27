# Google logins for Jarvis -- TWO accounts, ONE setup. All READ-ONLY.
Changes later = verbal PIN.

Your accounts:
  WORKSPACE (Gmail, Drive, Sheets, Calendar, Search Console)
      -> cory@thelifeinsuranceprofessionals.com
  BUSINESS PROFILE (GBP reviews, calls, insights)
      -> digitallifeinsurance@gmail.com

## PART A - Google Cloud Console (web browser, ~5 min, ONE time)
Do this once; the same OAuth client works for BOTH accounts.
1. https://console.cloud.google.com/  -> create/select a project named "Jarvis".
2. "APIs & Services" -> "Enable APIs" -> enable each:
     Gmail API, Google Drive API, Google Sheets API, Google Calendar API,
     Google Search Console API, Google Business Profile API.
3. "OAuth consent screen" -> External -> fill app name "Jarvis", your support email.
   Under "Test users" ADD BOTH:
     - cory@thelifeinsuranceprofessionals.com
     - digitallifeinsurance@gmail.com
4. "Credentials" -> "Create Credentials" -> "OAuth client ID"
     -> Application type: Desktop app -> Create.
     -> copy the Client ID and Client secret.

## PART B - on your PC, put the two values into config.json
  "google_oauth": {
    "client_id": "PASTE_CLIENT_ID",
    "client_secret": "PASTE_CLIENT_SECRET"
  }

## PART C - run the login TWICE (sign in as the matching account each time)
  cd C:\Users\User\Desktop\jarvis-voice-base

  python jarvis_addons\google_oauth_setup.py workspace
     -> browser opens -> sign in as cory@thelifeinsuranceprofessionals.com -> approve

  python jarvis_addons\google_oauth_setup.py gbp
     -> browser opens -> sign in as digitallifeinsurance@gmail.com -> approve

Each one saves its own tokens into config.json (nothing printed).

## PART D - verify reads
  python jarvis_addons\google_workspace_readonly_test.py    (Gmail/Drive/Cal/Search Console)
  python jarvis_addons\gbp_readonly_test.py                 (reviews + rating)

Two sign-ins -> six connections, all read-only.
Note: if Search Console says 0 sites, the site may be verified under the OTHER
account -- tell me and we'll point Search Console there instead.
