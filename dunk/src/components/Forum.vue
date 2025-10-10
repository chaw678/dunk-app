<template>
  <div class="page">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h1 class="h3 mb-0">Forum</h1>
  <div class="text-white small">Share files with the community</div>
      </div>

      <div>
        <input ref="fileInput" type="file" class="d-none" @change="onFilesSelected" multiple />
        <button class="btn btn-primary" @click="() => fileInput.click()">
          <i class="bi bi-upload me-2"></i>Upload Files
        </button>
      </div>
    </div>

    <div v-if="uploading" class="mb-3">
      <div class="spinner-border text-warning" role="status"><span class="visually-hidden">Uploading...</span></div>
      <span class="ms-2 text-muted">Uploading...</span>
    </div>

    <div v-if="uploadedFiles.length === 0" class="text-muted">No uploads yet.</div>

    <div class="row g-3 mt-2">
      <div class="col-12 col-md-6 col-lg-4" v-for="file in uploadedFiles" :key="file.id">
        <div class="card h-100 bg-dark text-white">
          <div class="card-body d-flex gap-3 align-items-center">
            <div class="thumb">
              <template v-if="isImage(file.name)">
                <img :src="file.url" :alt="file.name" class="img-thumbnail file-thumb" />
              </template>
              <template v-else>
                <div class="file-icon"><i class="bi bi-file-earmark-arrow-up"></i></div>
              </template>
            </div>
            <div class="flex-grow-1">
              <div class="fw-bold">{{ file.name }}</div>
              <div class="small text-muted">{{ displayDate(file.createdAt) }}</div>
            </div>
            <div class="d-flex flex-column align-items-end">
              <a :href="file.url" target="_blank" class="btn btn-sm btn-outline-light">Open</a>
              <button class="btn btn-sm btn-danger mt-2" @click="deleteFile(file)" :disabled="isDeleting(file.id)">
                <span v-if="isDeleting(file.id)" class="spinner-border spinner-border-sm text-white" role="status" aria-hidden="true"></span>
                <span v-else>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import uploadFile from '../upload'
import { getDataFromFirebase, pushDataToFirebase, deleteDataFromFirebase, storage } from '../firebase/firebase'
import { ref as storageRef, deleteObject } from 'firebase/storage'

const fileInput = ref(null)
const uploading = ref(false)
const uploadedFiles = ref([])
const deletingIds = ref([])

function isImage(name) {
  if (!name) return false
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name)
}

function displayDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString()
}

async function loadUploads() {
  try {
    const data = await getDataFromFirebase('forumUploads')
    if (data) {
      uploadedFiles.value = Object.entries(data).map(([id, v]) => ({ id, ...v }))
      uploadedFiles.value.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    } else {
      uploadedFiles.value = []
    }
  } catch (err) {
    console.error('Failed to load uploads', err)
  }
}

async function onFilesSelected(e) {
  const files = e.target.files
  if (!files || files.length === 0) return
  uploading.value = true

  try {
    for (const f of Array.from(files)) {
      // uploadFile now returns { url, storagePath }
      const { url, storagePath } = await uploadFile(f, pct => console.log('upload', f.name, pct))
      const meta = {
        name: f.name,
        url,
        storagePath,
        createdAt: Date.now()
      }
      await pushDataToFirebase('forumUploads', meta)
    }
    // refresh list to get DB keys
    await loadUploads()
  } catch (err) {
    console.error('Upload failed', err)
    alert('Upload failed: ' + (err.message || err))
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = null
  }
}

function markDeleting(id) {
  if (!id) return
  deletingIds.value.push(id)
}

function unmarkDeleting(id) {
  deletingIds.value = deletingIds.value.filter(i => i !== id)
}

function isDeleting(id) {
  return deletingIds.value.includes(id)
}

async function deleteFile(file) {
  if (!file) return
  const ok = confirm(`Delete ${file.name}? This action cannot be undone.`)
  if (!ok) return

  const id = file.id
  try {
    // mark as deleting to disable button
    markDeleting(id || file.name)

  // delete from storage using stored storagePath (preferred)
  const pathToDelete = file.storagePath || `uploads/${file.name}`
  const sRef = storageRef(storage, pathToDelete)
    try {
      await deleteObject(sRef)
    } catch (err) {
      // If the object is already missing, continue to remove DB metadata and UI entry.
      // Firebase error code for missing object is 'storage/object-not-found'.
      if (err && (err.code === 'storage/object-not-found' || (err.message && err.message.includes('does not exist')))) {
        console.warn('Storage object not found, continuing to remove metadata:', file.name)
      } else {
        throw err
      }
    }

    // delete metadata from realtime db if we have an id
    if (id) {
      try {
        await deleteDataFromFirebase(`forumUploads/${id}`)
      } catch (dbErr) {
        console.error('Failed to remove DB metadata:', dbErr)
        // even if DB deletion fails, attempt to refresh list
      }
    }

    // refresh UI
    await loadUploads()
  } catch (err) {
    console.error('Delete failed', err)
    // If storage object not found we already handled it; otherwise show alert
    alert('Delete failed: ' + (err.message || err))
  } finally {
    unmarkDeleting(id || file.name)
  }
}

onMounted(loadUploads)
</script>

<style scoped>
.page { padding: 24px; color: #fff }
.file-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 8px }
.thumb { width: 64px; height: 64px; display:flex; align-items:center; justify-content:center }
.file-icon { width:64px; height:64px; display:flex; align-items:center; justify-content:center; background:#1f262b; border-radius:8px; color:#ffb14d; font-size:1.6rem }
</style>
