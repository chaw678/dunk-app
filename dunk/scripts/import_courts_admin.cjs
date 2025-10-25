/*
Node script (CommonJS) to import local courts JSON into Firebase Realtime Database using Firebase Admin SDK.

Usage:
1. Install dependencies: npm install firebase-admin
2. Create a Firebase service account JSON and set the path in the environment variable SERVICE_ACCOUNT, or place it as ./serviceAccountKey.json
   - Service account: Firebase Console -> Project Settings -> Service accounts -> Generate new private key
3. Run: node .\scripts\import_courts_admin.cjs

This script reads public/courts.json (or public/BasketballCourtsAddresses.json if courts.json missing)
and writes each court into /courts/{key} where key is either the `id` field or a slugified name.
*/

const fs = require('fs')
const path = require('path')

function slugify(s) {
  return (s || '').toString().trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
}

async function main() {
  const serviceAccountPath = process.env.SERVICE_ACCOUNT || path.resolve(__dirname, '..', 'serviceAccountKey.json')
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Service account JSON not found at', serviceAccountPath)
    console.error('Set SERVICE_ACCOUNT env var or place service account JSON at', serviceAccountPath)
    process.exit(1)
  }

  const admin = require('firebase-admin')
  const serviceAccount = require(serviceAccountPath)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL || null
  })

  if (!admin.apps.length) {
    console.error('Failed to initialize firebase-admin')
    process.exit(1)
  }

  const db = admin.database()

  // try common paths for local courts file
  const candidates = [
    path.resolve(__dirname, '..', 'public', 'courts.json'),
    path.resolve(__dirname, '..', 'public', 'BasketballCourtsAddresses.json')
  ]

  let courtsFile = null
  for (const c of candidates) {
    if (fs.existsSync(c)) { courtsFile = c; break }
  }
  if (!courtsFile) {
    console.error('No local courts JSON found. Expected one of:', candidates.join(', '))
    process.exit(1)
  }

  console.log('Loading courts from', courtsFile)
  const raw = fs.readFileSync(courtsFile, 'utf8')
  let data = null
  try { data = JSON.parse(raw) } catch (e) { console.error('Failed to parse JSON:', e); process.exit(1) }

  if (!Array.isArray(data)) {
    console.error('Expected JSON array of courts, found:', typeof data)
    process.exit(1)
  }

  const uploaded = []
  for (const c of data) {
    if (!c || !c.name) continue
    const rawKey = (c.id || c.key || slugify(c.name))
    const idKey = rawKey.toString()
    const payload = Object.assign({}, c, {
      id: idKey,
      region: ((c.region || '') + '').toString().toLowerCase()
    })
    const ref = db.ref('courts').child(idKey)
    await ref.set(payload)
    uploaded.push(idKey)
    console.log('Wrote court', idKey)
  }

  console.log(`Uploaded ${uploaded.length} courts.`)
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
