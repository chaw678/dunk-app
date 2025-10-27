Migration scripts

migrate_matches.js

Usage:
  - Ensure you have a Firebase service account JSON and set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT to its path.
  - Optional: set FIREBASE_DATABASE_URL to your Realtime Database URL.
 - Ensure you have a Firebase service account JSON. Prefer using environment variables to avoid committing secrets.
     - Option A (recommended): set SERVICE_ACCOUNT_JSON to the raw JSON (or base64 of the JSON).
     - Option B: set SERVICE_ACCOUNT to a local path (e.g. ./serviceAccountKey.json) which is ignored by git.
 - Optional: set FIREBASE_DATABASE_URL to your Realtime Database URL.
  - Dry run (no writes):
      npm run migrate:matches -- --dry
  - Real run:
      npm run migrate:matches

Environment examples (PowerShell):

# load a local JSON file into SERVICE_ACCOUNT_JSON (raw JSON)
$env:SERVICE_ACCOUNT_JSON = Get-Content -Raw .\serviceAccountKey.json
# or load as base64
$env:SERVICE_ACCOUNT_JSON = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content -Raw .\serviceAccountKey.json)))
# set DB URL (if needed)
$env:FIREBASE_DATABASE_URL = 'https://your-project-id-default-rtdb.firebaseio.com'

The script will move flat entries under `/matches/{id}` into `/matches/{courtKey}/{YYYY-MM-DD}/{id}` and remove the original key.
Be careful and test with --dry first.
