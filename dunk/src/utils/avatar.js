// Centralized avatar helper to produce a stable seeded avatar URL and prefer
// explicit photoURL/avatar fields when available.
export function seededAvatar(seed, gender) {
  const s = (seed || 'anon')
  const g = (gender || '').toString().toLowerCase()
  const kind = g === 'female' || g === 'f' ? 'girl' : 'boy'
  return `https://avatar.iran.liara.run/public/${kind}?username=${encodeURIComponent(s)}`
}

// Accepts either a user-like object or a string seed. Returns the best avatar URL
// available in this precedence: photoURL -> avatar -> seededAvatar(uid|emailLocal|name)
export function avatarForUser(user) {
  if (!user) return seededAvatar('anon')
  if (typeof user === 'string') return seededAvatar(user)
  // prefer explicit photoURL, but ignore common provider-hosted profile images
  // (Google account photos, Gravatar, Facebook CDN, etc.) unless the
  // photo is clearly hosted in a storage bucket (user-uploaded), e.g.
  // firebasestorage.googleapis.com or storage.googleapis.com.
  if (user.photoURL && typeof user.photoURL === 'string') {
    try {
      const s = String(user.photoURL)
      const lower = s.toLowerCase()
      const providerHostPattern = /googleusercontent\.com|lh3\.googleusercontent\.com|google\.com|gravatar\.com|facebook\.com|fbcdn\.net|twimg\.com|avatars\.githubusercontent\.com/i
      const storagePattern = /firebasestorage\.googleapis\.com|storage\.googleapis\.com/i
      // If it's hosted on storage (uploaded by user) keep it. Otherwise
      // treat known provider-hosted photos as "not custom" and fall through
      // to the stored avatar or seeded avatar so the app shows the same
      // generated avatar everywhere.
      if (storagePattern.test(lower) || !providerHostPattern.test(lower)) {
        return s
      }
    } catch (e) {
      // fall through
    }
  }
  // prefer stored avatar field if present
  if (user.avatar) return user.avatar

  // derive a stable seed: prefer uid, then email local-part, then name/displayName/username
  const seed = user.uid || (user.email ? String(user.email).split('@')[0] : null) || user.name || user.displayName || user.username || 'anon'
  return seededAvatar(seed, user.gender)
}

export default { seededAvatar, avatarForUser }
