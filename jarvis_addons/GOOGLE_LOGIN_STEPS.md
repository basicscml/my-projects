# One Google Login -> unlocks GBP + Gmail + Drive + Sheets + Calendar + Search Console
Account to use: digitallifeinsurance@gmail.com  (your owner account)
All READ-ONLY. Any change later = verbal PIN.

## PART A — in your web browser (Google Cloud Console), ~5 min, one time
1. Go to: https://console.cloud.google.com/
2. Top bar: create a project (or pick one). Name it e.g. "Jarvis".
3. Left menu -> "APIs & Services" -> "Enabled APIs & services" -> "+ Enable APIs".
   Search for and ENABLE each of these:
     - Gmail API
     - Google Drive API
     - Google Sheets API
     - Google Calendar API
     - Google Search Console API
     - Google My Business / Business Profile API
4. Left menu -> "OAuth consent screen":
     - User type: External -> Create
     - App name: Jarvis. User support email: your email. Save.
     - "Test users" -> Add: digitallifeinsurance@gmail.com -> Save.
       (Test mode is fine; no Google review needed for your own account.)
5. Left menu -> "Credentials" -> "+ Create Credentials" -> "OAuth client ID":
     - Application type: Desktop app -> name it "Jarvis" -> Create.
     - Copy the Client ID and Client secret it shows you.

## PART B — on your PC, drop the two values into config.json
Add this block (use your real values):
  "google_oauth": {
    "client_id": "PASTE_CLIENT_ID",
    "client_secret": "PASTE_CLIENT_SECRET"
  }

## PART C — run the one-time login
  cd C:\Users\User\Desktop\jarvis-voice-base
  python jarvis_addons\google_oauth_setup.py
- Your browser opens. Sign in as digitallifeinsurance@gmail.com. Approve.
- It saves the tokens into config.json automatically (nothing printed).

## PART D — verify it all reads
  python jarvis_addons\google_workspace_readonly_test.py
  python jarvis_addons\gbp_readonly_test.py
You should see Gmail / Drive / Calendar / Search Console / GBP reporting OK.

That's it -> one login, six connections, all read-only.
