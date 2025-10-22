Migration scripts

migrate_matches.js

Usage:
  - Ensure you have a Firebase service account JSON and set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT to its path.
  - Optional: set FIREBASE_DATABASE_URL to your Realtime Database URL.
  - Dry run (no writes):
      npm run migrate:matches -- --dry
  - Real run:
      npm run migrate:matches

The script will move flat entries under `/matches/{id}` into `/matches/{courtKey}/{YYYY-MM-DD}/{id}` and remove the original key.
Be careful and test with --dry first.
