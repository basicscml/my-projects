# Google logins for Jarvis -- two accounts, one setup. All READ-ONLY.
Changes later = verbal PIN.

Account split (as Cory confirmed):
  digitallifeinsurance@gmail.com   = PRIMARY. GBP + Search Console
                                     (also already: GA4, Google Ads, YouTube)
  cory@thelifeinsuranceprofessionals.com = WORKSPACE ONLY
                                     (Gmail, Drive, Sheets, Calendar)

## PART A - Google Cloud Console (browser, ~5 min, ONE time)
Same OAuth client serves both accounts.
1. https://console.cloud.google.com/ -> create/select project "Jarvis".
2. APIs & Services -> Enable APIs -> enable:
     Gmail, Drive, Sheets, Calendar, Search Console, Business Profile.
3. OAuth consent screen -> External -> app name "Jarvis" + your support email.
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

## PART C - run the login twice (sign in as the matching account)
  cd C:\Users\User\Desktop\jarvis-voice-base

  python jarvis_addons\google_oauth_setup.py digitallife
     -> sign in as digitallifeinsurance@gmail.com   (GBP + Search Console)

  python jarvis_addons\google_oauth_setup.py workspace
     -> sign in as cory@thelifeinsuranceprofessionals.com   (Gmail/Drive/Sheets/Calendar)

## PART D - verify reads
  python jarvis_addons\gbp_readonly_test.py             (reviews + rating)
  python jarvis_addons\searchconsole_readonly_test.py   (site clicks/impressions)
  python jarvis_addons\google_workspace_readonly_test.py (Gmail/Drive/Calendar)

Two sign-ins -> all read-only. Writes always need the verbal PIN.
