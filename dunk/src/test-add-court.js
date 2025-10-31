import { saveCourtToDatabase } from './firebase/courts.js'

window.__testAddCourt = async function (payload) {
  try {
    const res = await saveCourtToDatabase(payload)
    console.log('Saved court:', res)
    return res
  } catch (e) {
    console.error('Failed to save court:', e)
    throw e
  }
}

// Usage in browser console:
// __testAddCourt({ courtname: 'X', courtaddress: 'Y', coordinates: [lat,lng], region: 'Z' })
