#!/usr/bin/env node
/**
 * scripts/fix-skills.cjs
 *
 * Usage:
 * 1) Create a Firebase service account JSON and save as ./serviceAccountKey.json
 * 2) Install dependency: npm install firebase-admin
 * 3) Run to set missing/empty skills to 'Beginner':
 *    node scripts/fix-skills.cjs
 * 4) To ALSO convert existing 'Professional' -> 'Beginner' (use with caution):
 *    node scripts/fix-skills.cjs --fix-professional
 *
 * The script updates only the `skill` field under /users/<uid>.
 * It will not overwrite other fields.
 */

const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

const servicePath = path.resolve(process.cwd(), 'serviceAccountKey.json')
if (!fs.existsSync(servicePath)) {
  console.error('Missing serviceAccountKey.json in project root. Create one from Firebase Console and place it at:', servicePath)
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(require(servicePath)),
  databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://<YOUR_DATABASE_NAME>.firebaseio.com'
})

const db = admin.database()

const args = process.argv.slice(2)
const fixProfessional = args.includes('--fix-professional')
const dryRun = args.includes('--dry-run')
const uidArg = args.find(a => a.startsWith('--uid='))
const targetUid = uidArg ? uidArg.split('=')[1] : null

async function run() {
  console.log('Starting skill-fix script. fixProfessional=', fixProfessional)
  const ref = db.ref('users')
  const snap = await ref.once('value')
  const users = snap.val() || {}
  const updates = {}
  let changed = 0

  for (const uid of Object.keys(users)) {
    if (targetUid && uid !== targetUid) continue
    const u = users[uid] || {}
    const skill = (u.skill || '').toString().trim()
    const ranking = (u.ranking || '').toString().trim()
    // If ranking is missing, but skill exists, copy skill -> ranking. If both missing, set ranking -> Beginner
    if (!ranking) {
      if (skill) {
        updates[`${uid}/ranking`] = skill
        changed++
        console.log(`Will set ranking from existing skill for: ${uid} -> ${skill}`)
      } else {
        updates[`${uid}/ranking`] = 'Beginner'
        changed++
        console.log(`Will set missing ranking -> Beginner for: ${uid}`)
      }
    }
    // optional: convert existing professional skill to Beginner (legacy fix for a specific case)
    if (!ranking && fixProfessional && skill.toLowerCase() === 'professional') {
      updates[`${uid}/ranking`] = 'Beginner'
      changed++
      console.log(`Will convert Professional -> Beginner for: ${uid}`)
    }
  }

  if (changed === 0) {
    console.log('No updates necessary.')
    process.exit(0)
  }

  if (dryRun) {
    console.log('\nDry-run mode enabled. The following updates WOULD be applied:')
    Object.keys(updates).forEach(k => console.log(`${k} => ${updates[k]}`))
    console.log(`\nTotal updates (dry-run): ${changed}`)
    process.exit(0)
  }

  try {
    await ref.update(updates)
    console.log(`Applied ${changed} updates successfully.`)
  } catch (err) {
    console.error('Failed to apply updates', err)
    process.exit(2)
  }
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(3) })
