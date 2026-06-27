# ONE Google login for Jarvis. Everything is on digitallifeinsurance@gmail.com.
All READ-ONLY. Changes later = verbal PIN.

This single sign-in connects:
  Gmail, Drive, Sheets, Calendar, Search Console, Google Business Profile.
(GA4, Google Ads, YouTube are already connected on this same account.)

## PART A - Google Cloud Console (browser, ~5 min, ONE time)
1. https://console.cloud.google.com/ -> create/select project "Jarvis".
2. APIs & Services -> Enable APIs -> enable:
     Gmail, Drive, Sheets, Calendar, Search Console, Business Profile.
3. OAuth consent screen -> External -> app name "Jarvis" + support email.
   Test users -> ADD: digitallifeinsurance@gmail.com
4. Credentials -> Create Credentials -> OAuth client ID -> Desktop app -> Create.
   Copy Client ID + Client secret.

## PART B - config.json (on PC)
  "google_oauth": {
    "client_id": "PASTE_CLIENT_ID",
    "client_secret": "PASTE_CLIENT_SECRET"
  }

## PART C - run the login ONCE
  cd C:\Users\User\Desktop\jarvis-voice-base
  python jarvis_addons\google_oauth_setup.py
     -> browser opens -> sign in as digitallifeinsurance@gmail.com -> approve

## PART D - verify reads
  python jarvis_addons\google_workspace_readonly_test.py   (Gmail/Drive/Calendar)
  python jarvis_addons\gbp_readonly_test.py                (reviews + rating)
  python jarvis_addons\searchconsole_readonly_test.py      (site clicks/impressions)

One sign-in -> six connections, all read-only. Writes always need the verbal PIN.

Note: admin.google.com (Workspace admin for thelifeinsuranceprofessionals.com)
is a separate domain-management console -- NOT needed for these integrations.
