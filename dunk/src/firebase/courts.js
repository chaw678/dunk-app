import { getDatabase, ref, push, set, update, remove, get, child } from 'firebase/database'
import { getUserName } from './firebase'

export async function saveCourtToDatabase(court) {

  if (!court || typeof court !== 'object') {
    throw new Error('Invalid court object')
  }

  const db = getDatabase()


  let courtRef
  if (court.id) {
    courtRef = ref(db, 'courts/' + court.id)
  } else {
    courtRef = push(ref(db, 'courts'))
  }


  let coords = null
  if (court.coordinates != null) {
    const c = court.coordinates
    if (Array.isArray(c) && c.length >= 2) {
      coords = { lat: Number(c[0]), lng: Number(c[1]) }
    } else if (typeof c === 'object' && c.lat != null && c.lng != null) {
      coords = { lat: Number(c.lat), lng: Number(c.lng) }
    } else {
  
      coords = null
    }
  }

  const data = {
    courtname: court.courtname || '',
    courtaddress: court.courtaddress || '',
    coordinates: {lat: court.coordinates?.lat || (Array.isArray(court.coordinates) ? Number(court.coordinates[0]) : 0), lng: court.coordinates?.lng || (Array.isArray(court.coordinates) ? Number(court.coordinates[1]) : 0)},
    region: court.region || '',
    indoor: court.indoor || false,
    outdoor: court.outdoor || false,
    createdBy: court.createdBy || '',
    createdByName: '',
    matches: court.matches || '',
  }

  // If createdBy is a uid, resolve the user's name via the central helper
  if (court.createdBy) {
    try {
      const name = await getUserName(court.createdBy)
      data.createdByName = name || ''
    } catch (err) {
      console.warn('Failed to resolve createdBy name for uid', court.createdBy, err)
    }
  }

  await set(courtRef, data)

  return { key: courtRef.key || court.id, data }
}
