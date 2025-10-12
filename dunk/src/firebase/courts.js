import { getDatabase, ref, push, set, update, remove, get, child } from 'firebase/database'

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
    coordinates: {lat: court.coordinates.lat || 0, lng: court.coordinates.lng || 0},
    region: court.region || '',
    indoor: court.indoor || false,
    outdoor: court.outdoor || false,
    createdBy: court.createdBy || '',
    matches: court.matches || '',
  }

  await set(courtRef, data)

  return { key: courtRef.key || court.id, data }
}
