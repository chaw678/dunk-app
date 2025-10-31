import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase/firebase'

/**
 * Upload a File object to Firebase Storage using a resumable upload.
 * Returns an object { url, storagePath } on success.
 * Optionally accepts an onProgress callback which receives percent (0-100).
 *
 * @param {File} file
 * @param {(pct:number) => void} [onProgress]
 * @returns {Promise<{url:string, storagePath:string}>}
 */
export async function uploadFile(file, onProgress) {
  if (!file) throw new Error('No file provided')
  // create a semi-unique name to avoid collisions
  const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  const storagePath = `uploads/${id}_${file.name}`
  const sRef = storageRef(storage, storagePath)

  const uploadTask = uploadBytesResumable(sRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      snapshot => {
        if (onProgress && typeof onProgress === 'function') {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress(Math.round(pct))
        }
      },
      err => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          resolve({ url, storagePath })
        } catch (e) {
          reject(e)
        }
      }
    )
  })
}

export default uploadFile