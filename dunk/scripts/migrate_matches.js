/*
Migration script: move flat matches at /matches/{id} into the new structure
matches/{courtKey}/{YYYY-MM-DD}/{id}

Usage:
  - Install firebase-admin if you don't already have it: npm install firebase-admin
  - Provide credentials via one of these methods:
      * Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file path (recommended), or
      * Set FIREBASE_SERVICE_ACCOUNT to a service account JSON file path (script will require it).
      * Set FIREBASE_DATABASE_URL to your RTDB URL if it's not in your service account
  - Dry run (no writes):
      node scripts/migrate_matches.js --dry
  - Real run:
      node scripts/migrate_matches.js

The script will:
  - Read /matches
  - Detect entries that look like nested (court/date) structures and skip them
  - For flat match entries (objects with .title or .court), write them under
    matches/{encodeURIComponent(court)}/{date}/{id}
  - Skip if the destination already exists
  - Optionally (when not dry) remove the original root entry after successful copy
*/

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

const args = process.argv.slice(2)
const DRY = args.includes('--dry') || args.includes('--dry-run')

function log() { console.log.apply(console, arguments) }

async function main() {
  // init admin
  let saPath = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS
  let credential
  if (saPath && fs.existsSync(saPath)) {
    log('Using service account from', saPath)
    credential = admin.credential.cert(require(path.resolve(saPath)))
  } else {
    log('No explicit service account path provided; attempting application-default credentials')
    credential = admin.credential.applicationDefault()
  }

  const databaseURL = process.env.FIREBASE_DATABASE_URL || (process.env.GCLOUD_PROJECT ? `https://${process.env.GCLOUD_PROJECT}.firebaseio.com` : undefined)
  if (!databaseURL) {
    log('Warning: FIREBASE_DATABASE_URL not set. If admin init fails you should set FIREBASE_DATABASE_URL to your RTDB URL.')
  }

  admin.initializeApp({ credential, databaseURL })
  const db = admin.database()
  const matchesRef = db.ref('matches')

  log('Fetching matches...')
  const snap = await matchesRef.once('value')
  const data = snap.val() || {}

  let moved = 0
  let skipped = 0
  let errors = 0

  // helper
  function looksNested(obj) {
    if (!obj || typeof obj !== 'object') return false
    // quick heuristic: keys are date-like (YYYY-MM-DD) or nested ids
    const keys = Object.keys(obj)
    if (!keys.length) return false
    // if first child's value is an object with other objects inside, it's nested
    for (const k of keys.slice(0, 5)) {
      const v = obj[k]
      if (v && typeof v === 'object') {
        const innerKeys = Object.keys(v)
        if (innerKeys.length && innerKeys.some(ik => typeof v[ik] === 'object')) return true
      }
      // check date-like
      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) return true
    }
    return false
  }

  for (const [key, val] of Object.entries(data)) {
    try {
      if (!val || typeof val !== 'object') { skipped++; continue }
      if (looksNested(val)) {
        // this key is likely a court-key containing dates; skip
        skipped++
        continue
      }

      // treat as flat match object
      const m = val
      // ensure it looks like a match
      if (!m.title && !m.court && !m.date) { skipped++; continue }

      const court = (m.court || 'unknown-court')
      const courtKey = encodeURIComponent(court)
      const date = (m.date || (new Date()).toISOString().slice(0,10))
      const destPath = `matches/${courtKey}/${date}/${key}`

      const destRef = db.ref(destPath)
      const destSnap = await destRef.once('value')
      if (destSnap.exists()) {
        log(`Destination exists for ${key} -> ${destPath}; skipping`)
        skipped++
        continue
      }

      log(`${DRY ? '[DRY] ' : ''}Moving ${key} -> ${destPath}`)
      if (!DRY) {
        await destRef.set({ ...m, migratedFrom: `matches/${key}` })
        // remove original
        await matchesRef.child(key).remove()
      }
      moved++
    } catch (err) {
      console.error('Error migrating key', key, err)
      errors++
    }
  }

  log('Done. moved:', moved, 'skipped:', skipped, 'errors:', errors)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(2) })
