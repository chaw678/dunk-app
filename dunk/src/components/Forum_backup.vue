<template>
  <div class="page">
    <div class="forum-header mb-4">
      <div class="forum-header-inner">
        <div>
          <h1 class="forum-title">Community Forum</h1>
          <div class="forum-sub">Discuss all things basketball with fellow enthusiasts.</div>
        </div>
        <div class="forum-actions d-flex align-items-center gap-2">
          <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              {{ selectedFilter }}
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="filterDropdown">
              <li><a class="dropdown-item" href="#" @click.prevent="setFilter('All')">All</a></li>
              <li v-for="t in tags" :key="t"><a class="dropdown-item" href="#" @click.prevent="setFilter(t)">{{ t }}</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div class="forum-tabs mt-3">
        <div class="tabs-container">
          <button :class="['tab-btn', activeTab === 'all' ? 'active' : '']" @click="activeTab = 'all'">All Posts</button>
          <button :class="['tab-btn', activeTab === 'mine' ? 'active' : '']" @click="activeTab = 'mine'">My Posts</button>
          <button :class="['tab-btn', activeTab === 'liked' ? 'active' : '']" @click="activeTab = 'liked'">Liked Posts</button>
        </div>
      </div>
    </div>

    <!-- Upload modal -->
    <div v-if="showUploadModal" class="modal-backdrop">
      <div class="delete-modal upload-modal">
        <h5>Create a New Post</h5>
        <div class="mb-2">
          <label class="form-label">Your Message</label>
          <textarea v-model="uploadCaption" class="form-control" rows="6" placeholder="What's on your mind?"></textarea>
        </div>
        <div class="row g-2 align-items-center">
          <div class="col">
            <label class="form-label">Tag</label>
            <select class="form-select" v-model="selectedTag">
              <option v-for="t in tags" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="col">
            <label class="form-label">Attach Media</label>
            <input ref="uploadFileInput" type="file" class="form-control" @change="handleModalFileSelect" accept="image/*" />
          </div>
        </div>
        <div class="preview-grid mt-2" v-if="selectedUploadPreviews.length">
          <div class="preview-item" v-for="(p, idx) in selectedUploadPreviews" :key="idx">
            <img v-if="isImage(p.file.name)" :src="p.url" class="preview-thumb" />
            <div v-else class="preview-icon"><i class="bi bi-file-earmark-arrow-up"></i></div>
            <div class="preview-meta">
              <div class="fw-bold small">{{ p.file.name }}</div>
              <button class="btn btn-sm btn-link text-danger" @click.prevent="removeSelectedFile(idx)">Remove</button>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <button class="btn btn-secondary" @click="cancelUploadModal">Cancel</button>
          <button class="btn btn-warning" @click="submitUpload">Create Post</button>
        </div>
      </div>
    </div>

    <!-- Floating pencil button to open modal -->
    <button class="btn btn-warning fab-pencil" @click="openUploadModal" aria-label="Create post">
      <i class="bi bi-pencil" style="font-size:20px;color:#111"></i>
    </button>

    <div v-if="uploading" class="mb-3">
      <div class="spinner-border text-warning" role="status"><span class="visually-hidden">Uploading...</span></div>
      <span class="ms-2 text-muted">Uploading...</span>
    </div>

    <div v-if="uploadedFiles.length === 0" class="text-muted">No uploads yet.</div>


    <!-- uploaded files render as bootstrap cards; preserve eye overlay on thumbnail -->
    

    <div class="forum-list">
      <div class="forum-item" v-for="file in filteredFiles" :key="file.id">
        <div class="card bg-dark text-white upload-card position-relative">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-2">
              <div class="avatar"> <img :src="file.avatar || '/src/assets/vue.svg'" alt="user"/></div>
              <div>
                <div class="fw-bold">{{ file.createdByName || file.author || file.username || 'Anonymous' }}</div>
                <div class="small text-muted">{{ displayDate(file.createdAt) }}</div>
              </div>
              <div class="ms-auto">
                <span v-if="file.tag" class="badge bg-secondary">{{ file.tag }}</span>
              </div>
            </div>
            <p class="mb-2">{{ file.caption || file.title || '' }}</p>
            <div class="post-media" v-if="file.url">
              <img v-if="isImage(file.name)" :src="file.url" class="post-image" @click.stop.prevent="openPostModal(file)" />
              <a v-else :href="file.url" target="_blank">Download</a>
            </div>
            <div class="mt-3 d-flex gap-3 align-items-center">
              <div class="text-muted like-area">
                <button :class="['btn btn-sm btn-link p-0 like-btn', file.liked ? 'liked' : 'not-liked']" @click.stop.prevent="toggleLike(file)" :aria-pressed="file.liked">
                  <i :class="['bi', file.liked ? 'bi-heart-fill text-danger' : 'bi-heart', 'like-icon']" aria-hidden="true"></i>
                </button>
                <span class="ms-2">{{ file.likes || 0 }}</span>
              </div>
              <div class="text-muted"><i class="bi bi-chat"></i> {{ file.commentsCount || 0 }}</div>
              <div class="ms-auto d-flex align-items-center gap-2">
                <button v-if="isMine(file)" class="btn btn-sm btn-link text-danger" @click.stop.prevent="confirmDelete(file)" :title="`Delete ${file.name || file.title}`" aria-label="Delete post">
                  <i class="bi bi-trash"></i>
                  <span v-if="isDeleting(file.id)" class="spinner-border spinner-border-sm text-white ms-1" role="status" aria-hidden="true"></span>
                </button>
                <button v-if="isMine(file)" class="btn btn-sm btn-link text-primary" @click.stop.prevent="openEdit(file)"><i class="bi bi-pencil"></i></button>
              </div>
            </div>
            <!-- inline comments panel -->
            <div class="comments-panel mt-2">
              <div v-for="(c, cid) in file.comments" :key="cid" class="comment-item mb-2">
                <div class="d-flex align-items-start justify-content-between small gap-2">
                  <div class="comment-left d-flex align-items-start gap-2">
                    <div class="comment-avatar"><img :src="c.avatar || avatarForName(c.authorName)" alt="avatar" /></div>
                    <div>
                      <div><strong>{{ c.authorName || c.author || 'Anon' }}</strong> <span class="text-muted">• {{ displayDate(c.createdAt) }}</span></div>
                    </div>
                  </div>
                  <div>
                    <div v-if="isCommentOwner(c)" class="dropdown dropend">
                      <button class="btn btn-sm btn-link comment-menu-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More">
                        <i class="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul class="dropdown-menu dropdown-menu-end">
                        <li><button class="dropdown-item" @click.stop.prevent="startEditComment(file, cid)">Edit</button></li>
                        <li><button class="dropdown-item text-danger" @click.stop.prevent="deleteComment(file, cid)">Delete</button></li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div v-if="file._editingComment === cid" class="comment-body">
                  <input class="form-control comment-edit-input" v-model="file._editingText" />
                  <div class="mt-1"><button class="btn btn-primary btn-sm" @click="saveEditComment(file, cid)">Save</button> <button class="btn btn-secondary btn-sm" @click="cancelEditComment(file)">Cancel</button></div>
                </div>
                <div v-else class="comment-body">{{ c.text }}</div>
              </div>
              <div class="d-flex gap-2 mt-2">
                <input type="text" class="form-control" v-model="file._newComment" placeholder="Write a comment..." @keydown.enter.prevent="submitComment(file)" />
                <button class="btn btn-primary" @click="submitComment(file)">Comment</button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="modal-backdrop">
      <div class="delete-modal">
        <h5>Delete file</h5>
        <p>Are you sure you want to delete <strong class="delete-label" :title="deleteLabel(deleteTarget)">{{ truncate(deleteLabel(deleteTarget), 70) }}</strong>? This action cannot be undone.</p>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-cancel" @click="cancelDelete">Cancel</button>
          <button class="btn btn-danger btn-delete" @click="performDelete">Delete</button>
        </div>
      </div>
    </div>
    <!-- Edit post modal -->
    <div v-if="showEditModal" class="modal-backdrop">
      <div class="delete-modal">
        <h5>Edit post</h5>
        <div class="mb-2">
          <label class="form-label">Title</label>
          <input v-model="editTitle" class="form-control" placeholder="Post title (optional)" />
        </div>
        <div class="mb-2">
          <label class="form-label">Caption</label>
          <textarea v-model="editCaption" class="form-control" rows="4" placeholder="Caption"></textarea>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
          <button class="btn btn-primary" :disabled="editSaving" @click="saveEdit">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, computed } from 'vue'
import { Eye } from 'lucide-vue-next'
import uploadFile from '../upload'
import { getDataFromFirebase, pushDataToFirebase, deleteDataFromFirebase, overwriteDataToFirebase, storage, getUserName, auth } from '../firebase/firebase'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'

const fileInput = ref(null)
const uploading = ref(false)
const uploadedFiles = ref([])
const deletingIds = ref([])
const showUploadModal = ref(false)
const uploadTitle = ref('')
const uploadCaption = ref('')
const uploadFileInput = ref(null)
const selectedUploadFiles = ref([]) // support multiple files
const selectedUploadPreviews = ref([]) // { file, url }
const activeTab = ref('all') // 'all' | 'mine' | 'liked'
const currentUserId = ref(null)
const currentUserName = ref(null)
const tags = ref(['General','Advice','Matches','Highlights'])
const selectedTag = ref('General')
const selectedFilter = ref('All')

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
      // for each file generate avatar and fetch like counts
      for (const f of uploadedFiles.value) {
        // avatar from createdByName or fallback
        const name = f.createdByName || f.author || f.username || f.name || ''
        f.avatar = avatarForName(name)
        // read like/comment objects directly from post (favored schema to keep metadata together)
        f.likedBy = f.likedBy || f.likedBy || {}
        f.comments = f.comments || f.comments || {}
        // ensure each comment has an avatar and authorName fallback
        try {
          for (const [cid, c] of Object.entries(f.comments || {})) {
            if (!c) continue
            c.authorName = c.authorName || c.author || 'Anon'
            c.avatar = c.avatar || avatarForName(c.authorName)
          }
        } catch (e) {}
        f.likes = Object.keys(f.likedBy || {}).length
        f.liked = Boolean(currentUserId.value && f.likedBy && f.likedBy[currentUserId.value])
        f.commentsCount = Object.keys(f.comments || {}).length
      }
    } else {
      uploadedFiles.value = []
    }
  } catch (err) {
    console.error('Failed to load uploads', err)
  }
    // after uploads are loaded and DOM updates, mark caption elements that overflow
    await nextTick()
    // attempt to resolve creator display names when available
    for (const f of uploadedFiles.value) {
      if ((f.createdByUid || f.createdBy) && !f.createdByName) {
        try {
          const name = await getUserName(f.createdByUid || f.createdBy)
          if (name) f.createdByName = name
        } catch (e) {}
      }
      // fallback: if uploader name present use it
      if (!f.createdByName && f.uploaderName) f.createdByName = f.uploaderName
    }
    updateCaptionClamps()
}

function avatarForName(name) {
  const s = (name || 'anon').trim() || 'anon'
  try {
    return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(s)}`
  } catch (e) {
    return '/src/assets/vue.svg'
  }
}

async function toggleLike(file) {
  if (!file || !file.id) return
  if (!currentUserId.value) {
    alert('Please sign in to like posts')
    return
  }
  const uid = currentUserId.value
  try {
    if (file.liked) {
      // remove like under the post's likedBy
      await deleteDataFromFirebase(`forumUploads/${file.id}/likedBy/${uid}`)
      file.liked = false
      file.likes = Math.max(0, (file.likes || 0) - 1)
      if (file.likedBy) delete file.likedBy[uid]
    } else {
      // add like entry under the post
      await overwriteDataToFirebase(uid, `forumUploads/${file.id}/likedBy`, { uid, createdAt: Date.now() })
      file.liked = true
      file.likes = (file.likes || 0) + 1
      if (!file.likedBy) file.likedBy = {}
      file.likedBy[uid] = { uid, createdAt: Date.now() }
    }
  } catch (err) {
    console.error('Like toggle failed', err)
  }
}

async function submitComment(file) {
  if (!file || !file.id) return
  const text = (file._newComment || '').trim()
  if (!text) return
  if (!currentUserId.value) {
    alert('Please sign in to comment')
    return
  }
  const comment = {
    author: currentUserId.value,
    authorName: currentUserName.value || 'Anon',
    text,
    createdAt: Date.now()
  }
  try {
    await pushDataToFirebase(`forumUploads/${file.id}/comments`, comment)
    // update local
    if (!file.comments) file.comments = {}
    // local temporary key
    const key = 'c_' + Date.now()
    // attach avatar for immediate UI
    comment.avatar = avatarForName(comment.authorName)
    file.comments[key] = comment
    file.commentsCount = Object.keys(file.comments).length
    file._newComment = ''
  } catch (err) {
    console.error('Failed to submit comment', err)
    alert('Failed to submit comment')
  }
}

function startEditComment(file, cid) {
  if (!file || !file.comments || !file.comments[cid]) return
  if (!currentUserId.value || file.comments[cid].author !== currentUserId.value) return
  file._editingComment = cid
  file._editingText = file.comments[cid].text
}

function cancelEditComment(file) {
  if (!file) return
  file._editingComment = null
  file._editingText = ''
}

async function saveEditComment(file, cid) {
  if (!file || !file.id || !file.comments || !file.comments[cid]) return
  if (!file._editingText) return
  try {
    // overwrite the comment at forumUploads/{postId}/comments/{cid}
    await overwriteDataToFirebase(cid, `forumUploads/${file.id}/comments`, { ...file.comments[cid], text: file._editingText, editedAt: Date.now() })
    // update local
    file.comments[cid].text = file._editingText
    file.comments[cid].editedAt = Date.now()
    cancelEditComment(file)
  } catch (err) {
    console.error('Failed to save comment edit', err)
    alert('Failed to save comment')
  }
}

async function deleteComment(file, cid) {
  if (!file || !file.id) return
  if (!currentUserId.value || !file.comments || !file.comments[cid]) return
  if (file.comments[cid].author !== currentUserId.value) return
  try {
    await deleteDataFromFirebase(`forumUploads/${file.id}/comments/${cid}`)
    delete file.comments[cid]
    file.commentsCount = Object.keys(file.comments || {}).length
  } catch (err) {
    console.error('Failed to delete comment', err)
    alert('Failed to delete comment')
  }
}

const filteredFiles = computed(() => {
  let list = uploadedFiles.value.slice()

  // tab filtering
  if (activeTab.value === 'mine') {
    list = list.filter(isMine)
  } else if (activeTab.value === 'liked') {
    list = list.filter(f => Boolean(f.liked))
  }

  // tag/filter dropdown (selectedFilter: 'All' or tag name)
  if (selectedFilter.value && selectedFilter.value !== 'All') {
    list = list.filter(f => (f.tag || 'General') === selectedFilter.value)
  }

  return list
})

function isMine(file) {
  if (!file) return false
  const uid = currentUserId.value
  if (!uid) return false
  return Boolean(
    file.createdByUid === uid || file.createdBy === uid || file.uid === uid || file.ownerId === uid
  )
}

function isCommentOwner(c) {
  if (!c) return false
  const uid = currentUserId.value
  if (!uid) return false
  return Boolean(c.author === uid || c.authorId === uid || c.uid === uid || c.createdBy === uid)
}

function updateCaptionClamps() {
  try {
    const nodes = Array.from(document.querySelectorAll('.card-caption'))
    nodes.forEach(n => {
      // if element has no text, clear class
      if (!n || !n.textContent || n.textContent.trim() === '') {
        n.classList.remove('is-clamped')
        return
      }

      // measure natural height by cloning the node off-screen without line-clamp
      const clone = n.cloneNode(true)
      clone.style.position = 'absolute'
      clone.style.visibility = 'hidden'
      clone.style.pointerEvents = 'none'
      clone.style.whiteSpace = 'normal'
      clone.style.display = 'block'
      // remove clamp styles on clone
      clone.style.webkitLineClamp = 'unset'
      clone.style.webkitBoxOrient = 'unset'
      clone.style.overflow = 'visible'
      clone.style.maxHeight = 'none'
      // match computed width to get accurate wrapping
      const computed = window.getComputedStyle(n)
      clone.style.width = computed.width
      clone.style.font = computed.font
      clone.style.lineHeight = computed.lineHeight
      document.body.appendChild(clone)
      const naturalH = clone.getBoundingClientRect().height
      const visibleH = n.getBoundingClientRect().height
      document.body.removeChild(clone)
      if (naturalH > visibleH + 0.5) n.classList.add('is-clamped')
      else n.classList.remove('is-clamped')
    })
  } catch (e) {
    // defensive: ignore DOM errors
  }
}

// re-check captions after images load or window resize
const _observedImages = new WeakSet()
function observeImages() {
  try {
    const imgs = document.querySelectorAll('.thumb-wrap img')
    imgs.forEach(img => {
      if (_observedImages.has(img)) return
      _observedImages.add(img)
      img.addEventListener('load', () => {
        // allow layout to settle
        setTimeout(updateCaptionClamps, 30)
      })
      img.addEventListener('error', () => setTimeout(updateCaptionClamps, 30))
    })
  } catch (e) {}
}

function onResize() {
  // debounce-ish minimal delay
  setTimeout(updateCaptionClamps, 50)
}

async function onFilesSelected(e) {
  const files = e.target.files
  if (!files || files.length === 0) return
  uploading.value = true

  try {
    for (const f of Array.from(files)) {
      const { url, storagePath } = await uploadFile(f, pct => console.log('upload', f.name, pct))
      const meta = { name: f.name, url, storagePath, createdAt: Date.now() }
      await pushDataToFirebase('forumUploads', meta)
    }
    await loadUploads()
  } catch (err) {
    console.error('Upload failed', err)
    alert('Upload failed: ' + (err.message || err))
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = null
  }
}

function openUploadModal() {
  uploadTitle.value = ''
  uploadCaption.value = ''
  selectedUploadFiles.value = []
  // clear any previous previews
  selectedUploadPreviews.value.forEach(p => { try { URL.revokeObjectURL(p.url) } catch(e){} })
  selectedUploadPreviews.value = []
  showUploadModal.value = true
}

function handleModalFileSelect(e) {
  const files = e.target.files
  if (!files) return
  const arr = Array.from(files)
  selectedUploadFiles.value = arr
  // create previews and revoke old ones
  selectedUploadPreviews.value.forEach(p => { try { URL.revokeObjectURL(p.url) } catch(e){} })
  selectedUploadPreviews.value = arr.map(f => ({ file: f, url: URL.createObjectURL(f) }))
}

function removeSelectedFile(idx) {
  const p = selectedUploadPreviews.value[idx]
  if (p && p.url) {
    try { URL.revokeObjectURL(p.url) } catch (e) {}
  }
  selectedUploadPreviews.value.splice(idx, 1)
  selectedUploadFiles.value.splice(idx, 1)
}

function onDropFiles(e) {
  e.preventDefault()
  const files = e.dataTransfer && e.dataTransfer.files
  if (!files) return
  const arr = Array.from(files)
  selectedUploadFiles.value = selectedUploadFiles.value.concat(arr)
  // append previews
  const newPreviews = arr.map(f => ({ file: f, url: URL.createObjectURL(f) }))
  selectedUploadPreviews.value = selectedUploadPreviews.value.concat(newPreviews)
}

function onDragOver(e) {
  e.preventDefault()
}

async function submitUpload() {
  // allow text-only posts; files are optional
  if ((!selectedUploadFiles.value || selectedUploadFiles.value.length === 0) && !(uploadCaption.value && uploadCaption.value.trim())) {
    alert('Please enter a message or attach an image')
    return
  }
  uploading.value = true
  try {
    const files = selectedUploadFiles.value.slice()
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const { url, storagePath } = await uploadFile(f, pct => console.log('upload', f.name, pct))
        const meta = {
          title: files.length > 1 ? `${uploadTitle.value || f.name} (${i+1})` : (uploadTitle.value || f.name),
          caption: uploadCaption.value || '',
          name: f.name,
          url,
          storagePath,
          tag: selectedTag.value || 'General',
          // creator metadata
          createdByUid: currentUserId.value || null,
          createdByName: currentUserName.value || null,
          // initialize likes and comments containers
          likedBy: {},
          comments: {},
          createdAt: Date.now()
        }
        await pushDataToFirebase('forumUploads', meta)
      }
    } else {
      // text-only post
      const meta = {
        title: '',
        caption: uploadCaption.value || '',
        name: '',
        url: null,
        storagePath: null,
        tag: selectedTag.value || 'General',
        createdByUid: currentUserId.value || null,
        createdByName: currentUserName.value || null,
        likedBy: {},
        comments: {},
        createdAt: Date.now()
      }
      await pushDataToFirebase('forumUploads', meta)
    }
    await loadUploads()
    showUploadModal.value = false
    // clear and revoke previews
    selectedUploadPreviews.value.forEach(p => { try { URL.revokeObjectURL(p.url) } catch(e){} })
    selectedUploadPreviews.value = []
    selectedUploadFiles.value = []
  } catch (err) {
    console.error('Upload failed', err)
    alert('Upload failed: ' + (err.message || err))
  } finally {
    uploading.value = false
  }
}

function setFilter(f) {
  selectedFilter.value = f
}

function cancelUploadModal() {
  // revoke and clear previews/files
  selectedUploadPreviews.value.forEach(p => { try { URL.revokeObjectURL(p.url) } catch(e){} })
  selectedUploadPreviews.value = []
  selectedUploadFiles.value = []
  showUploadModal.value = false
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

const showDeleteModal = ref(false)
const deleteTarget = ref(null)

// edit modal state
const showEditModal = ref(false)
const editTarget = ref(null)
const editTitle = ref('')
const editCaption = ref('')
const editSaving = ref(false)

function confirmDelete(file) {
  deleteTarget.value = file
  showDeleteModal.value = true
}

function openEdit(file) {
  // only allow edit if it's the user's post
  if (!isMine(file)) return
  // open modal prefilled with title/caption
  editTarget.value = file
  editTitle.value = file?.title || ''
  editCaption.value = file?.caption || ''
  showEditModal.value = true
}

async function saveEdit() {
  const file = editTarget.value
  if (!file || !file.id) return
  editSaving.value = true
  try {
    const merged = { ...file, title: editTitle.value || '', caption: editCaption.value || '' }
    await overwriteDataToFirebase(file.id, 'forumUploads', merged)
    await loadUploads()
    showEditModal.value = false
    editTarget.value = null
  } catch (err) {
    console.error('Failed to save edit', err)
    alert('Failed to save: ' + (err.message || err))
  } finally {
    editSaving.value = false
  }
}

function cancelEdit() {
  showEditModal.value = false
  editTarget.value = null
}

async function performDelete() {
  const file = deleteTarget.value
  if (!file) return
  const id = file.id
  try {
    markDeleting(id || file.name)
    const pathToDelete = file.storagePath || `uploads/${file.name}`
    const sRef = storageRef(storage, pathToDelete)
    try {
      await deleteObject(sRef)
    } catch (err) {
      if (err && (err.code === 'storage/object-not-found' || (err.message && err.message.includes('does not exist')))) {
        console.warn('Storage object not found, continuing to remove metadata:', file.name)
      } else {
        throw err
      }
    }
    if (id) {
      try {
        await deleteDataFromFirebase(`forumUploads/${id}`)
      } catch (dbErr) {
        console.error('Failed to remove DB metadata:', dbErr)
      }
    }
    await loadUploads()
  } catch (err) {
    console.error('Delete failed', err)
    alert('Delete failed: ' + (err.message || err))
  } finally {
    unmarkDeleting(id || file.name)
    deleteTarget.value = null
    showDeleteModal.value = false
  }
}

function cancelDelete() {
  deleteTarget.value = null
  showDeleteModal.value = false
}

function openFile(file) {
  if (!file || !file.url) return
  window.open(file.url, '_blank')
}

// post detail modal
const showPostModal = ref(false)
const postModalTarget = ref(null)
function openPostModal(file) {
  postModalTarget.value = file
  showPostModal.value = true
}

function deleteLabel(file) {
  if (!file) return ''
  // prefer caption, then title, then name
  return file.caption || file.title || file.name || 'this post'
}

function truncate(str, n = 100) {
  if (!str) return ''
  if (str.length <= n) return str
  return str.slice(0, n - 1) + '…'
}

onMounted(() => {
  loadUploads()
  // run observers and add resize listener
  observeImages()
  window.addEventListener('resize', onResize)
  // also try one delayed re-check in case fonts/images finish after mount
  setTimeout(() => { updateCaptionClamps(); observeImages() }, 120)
  // auth listener to know the current user
  try {
    onAuthStateChanged(auth, async (u) => {
      if (u) {
        currentUserId.value = u.uid
        currentUserName.value = u.displayName || (await getUserName(u.uid)) || null
      } else {
        currentUserId.value = null
        currentUserName.value = null
      }
    })
  } catch (e) {}
})

onUnmounted(() => {
  try { window.removeEventListener('resize', onResize) } catch (e) {}
})
</script>

<style scoped>
.page { padding: 24px; color: black; }

.forum-header { padding: 6px 0 12px 0 }
.forum-header-inner { display:flex; justify-content:space-between; align-items:center }
.forum-title { color: #ff9a3c; font-weight:800; font-size:1.6rem; margin:0 }
.forum-sub { color: #9fb0bf; margin-top:6px }
.forum-tabs .tabs-container { display:inline-flex; gap:8px; background: rgba(255,255,255,0.02); padding:6px; border-radius:12px }
.tab-btn {
  background: transparent;
  border: none;
  color: #9fb0bf;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 200ms cubic-bezier(.2,.8,.2,1), color 200ms ease, box-shadow 220ms ease, transform 180ms ease;
}
.tab-btn:hover {
  background: rgba(255,255,255,0.02);
  color: #dfe9f0;
  transform: translateY(-1px);
}
.tab-btn.active {
  background: #0b1220;
  color: #fff;
  box-shadow: 0 6px 18px rgba(0,0,0,0.24);
  transform: translateY(-2px);
}
.tab-btn:focus { outline: none }
.file-thumb {
  width: auto;
  max-width: 84%;
  height: auto;
  max-height: 220px;
  object-fit: cover;
  object-position: center;
  border-radius: 10px;
  display: block;
  margin: 8px auto 0;
}
.thumb {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.file-icon {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1f262b;
  border-radius: 10px;
  color: #ffb14d;
  font-size: 1.6rem;
}

/* thumbnail overlay */
.thumb-wrap { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer }
.thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  opacity: 0;
  transition: opacity 0.18s ease;
  border-radius: 10px;
}
.thumb-wrap:hover .thumb-overlay { opacity: 1 }
.eye-icon { color: white; width: 36px; height: 36px }

/* Keep a consistent image height on wider screens */
@media (min-width: 768px) {
  .file-thumb { max-height: 260px; }
}

/* Ensure card content is left-aligned and body grows to match card height */
.upload-card {
  display: flex;
  flex-direction: column;
}
.upload-card .card-body {
  align-items: flex-start;
  gap: 0.5rem;
  padding: 16px;
}
.upload-card .card-caption {
  font-size: 0.95rem;
  font-weight: 300;
  color: #bfc9d3;
  margin: 0 0 6px 0;
  /* clamp to 2 lines with ellipsis */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25em;
  max-height: calc(1.25em * 2);
}

.card-divider {
  height: 1px;
  width: 100%;
  background: rgba(255,255,255,0.04);
  margin: 8px 0;
  border-radius: 1px;
}

.forum-list { display: flex; flex-direction: column; gap: 18px; }
.forum-item .card { padding: 14px; border-radius: 10px; }
.post-media { margin-top: 8px }
.post-image { width: 100%; height: auto; border-radius: 10px; display: block }
.avatar img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover }
.avatar { width: 36px; height: 36px; overflow: hidden }
.like-btn { color: inherit }
.like-area { display:inline-flex; align-items:center; gap:6px }

/* Like button visual states: only show the heart icon (no surrounding box) */
.like-btn.not-liked { background: transparent; border: none; padding: 0; color: #fff; }
.like-btn.not-liked .like-icon { font-size: 18px; color: #fff; }
.like-btn.not-liked:hover .like-icon { transform: scale(1.06); }
.like-btn.liked { background: transparent; border: none; padding: 0; }
.like-btn.liked .like-icon { font-size: 18px; color: #e44b5a; }
.like-btn .like-icon { transition: transform 140ms ease, color 140ms ease; display: inline-block; }

/* subtle pulse animation when a heart is liked */
@keyframes like-pulse {
  0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(228,75,90,0)); }
  35% { transform: scale(1.35); filter: drop-shadow(0 10px 16px rgba(228,75,90,0.16)); }
  65% { transform: scale(1.12); filter: drop-shadow(0 6px 10px rgba(228,75,90,0.12)); }
  100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(228,75,90,0)); }
}
.like-btn.liked .like-icon {
  animation: like-pulse 520ms cubic-bezier(.17,.84,.38,1);
  transform-origin: center;
  font-size: 22px; /* slightly larger heart when liked */
}

.comments-panel { margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 8px }
.comment-item { background: transparent }
.comment-item div { color: #c9d1d9 }
.comment-item .form-control { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.03); }

.comment-avatar img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover }
.comment-left { display:flex; align-items:flex-start }

.comment-body { margin-top: 6px; line-height: 1.4; }

.comment-menu-btn { color: rgba(255,255,255,0.65); padding: 6px; }
.comment-menu-btn:hover { color: #fff; background: rgba(255,255,255,0.02); border-radius:6px }
/* remove bootstrap caret added by .dropdown-toggle for the compact comment menu */
.comment-menu-btn.dropdown-toggle::after { display: none !important; }

.comment-edit-input {
  color: #fff;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
}
.comment-edit-input::placeholder { color: rgba(255,255,255,0.5); }

/* Ensure typed text remains white even when focused or autofilled */
input.comment-edit-input.form-control,
input.comment-edit-input.form-control:focus,
input.comment-edit-input.form-control:active {
  color: #fff !important;
  caret-color: #fff !important;
  -webkit-text-fill-color: #fff !important; /* Safari/Chrome */
}

/* Autofill styles (some browsers change text color when autofill active) */
input.comment-edit-input:-webkit-autofill,
input.comment-edit-input:-webkit-autofill:focus {
  -webkit-text-fill-color: #fff !important;
}

/* when JS detects overflow, add subtle fade and an ellipsis indicator */
.card-caption.is-clamped {
  position: relative;
  padding-right: 18px; /* leave room for explicit ellipsis */
}
.card-caption.is-clamped:after {
  content: '…';
  position: absolute;
  right: 8px;
  bottom: 0.1em;
  color: #bfc9d3;
  font-size: 1.05em;
  pointer-events: none;
  background: transparent;
}
.upload-card .flex-grow-1 { display: flex; flex-direction: column; justify-content: flex-start; }

/* Keep action buttons above adjacent cards */
.forum-uploads .btn { position: relative; z-index: 5; }

/* Forum-specific overrides to avoid global .card rules causing overflow */
.forum-uploads .upload-card {
  width: 100% !important;
  max-width: 100% !important;
  padding: 12px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  border-radius: 10px;
  position: relative;
  z-index: 1;
}

.forum-uploads .col { display: flex; }

/* Ensure the card's content doesn't overflow and push outside its column */
.forum-uploads .card-body { overflow: hidden; }

/* Ensure action buttons are visually on top */
.forum-uploads .file-actions { z-index: 10; position: relative; }

/* Allow columns to show overflow so button shadows are visible */
.forum-uploads .col { overflow: visible; }

/* delete modal styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.delete-modal {
  background: #111214;
  padding: 20px;
  border-radius: 8px;
  color: #fff;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
}

.upload-modal { max-width: 680px; }

/* floating pencil button */
.fab-pencil {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(0,0,0,0.45);
  z-index: 1500;
}

.upload-dropzone {
  position: relative;
  border: 2px dashed rgba(255,255,255,0.06);
  padding: 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
}

/* Delete modal button styles to match screenshot */
.btn-cancel {
  background: #6b7379;
  color: #e6eef8;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
}
.btn-delete {
  background: #e44b5a; /* red */
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
}
.delete-label {
  display: inline-block;
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.upload-dropzone input[type="file"] { opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer }
.drop-hint { pointer-events: none; color: #c8d0da; text-align: center }
.preview-grid { display: flex; gap: 8px; flex-wrap: wrap }
.preview-item { display: flex; align-items: center; gap: 8px; background: #0d0f10; padding: 8px; border-radius: 6px }
.preview-thumb { width: 64px; height: 64px; object-fit: cover; border-radius: 6px }
.preview-icon { width: 64px; height: 64px; display:flex; align-items:center; justify-content:center; background:#1f262b; border-radius:6px; color:#ffb14d }
.preview-meta { display:flex; flex-direction:column }

/* Position actions inside the card so they never get occluded */
.forum-uploads .upload-card { padding-right: 80px !important; }
.forum-uploads .file-actions {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 20;
}

/* small square icon-only buttons (prevents pill/radius look) */
.forum-uploads .icon-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.forum-uploads .icon-btn .bi { font-size: 1.05rem; }

/* Reduce filename size to prevent wrapping over actions */
.upload-card .fw-bold { font-size: 1rem; line-height: 1.2; }
</style>
