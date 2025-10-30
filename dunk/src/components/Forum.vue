<template>
  <div class="page">
        <!-- Sign in popup -->
    <div v-if="showPopup" class="success-overlay" @click.self="handlePopupClose">
      <div class="success-popup">
        <div class="success-icon" style="background:#e04747">✕</div>
        <h3>Sign-in Required</h3>
        <p>Please sign in to perform this action.</p>
        <div class="popup-buttons">
          <button class="sign-in-btn" @click.stop="handleSignIn">Sign In with Google</button>
          <button class="close-btn" @click.stop="handlePopupClose">Close</button>
        </div>
      </div>
      </div>
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
          <button class="btn btn-warning" :title="currentUserId ? 'Create Post' : 'Sign in to create posts'" @click="submitUpload">Create Post</button>
        </div>
      </div>
    </div>

    <!-- Floating pencil button to open modal -->
    <button class="btn btn-warning fab-pencil" :title="currentUserId ? 'Create post' : 'Sign in to create posts'" @click="openUploadModal" aria-label="Create post">
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
            <div class="d-flex align-items-start gap-2 mb-2">
              <div class="avatar">
                <template v-if="profilePathForFile(file)">
                  <router-link :to="profilePathForFile(file)"><img :src="file.avatar || '/src/assets/vue.svg'" alt="user"/></router-link>
                </template>
                <template v-else>
                  <img :src="file.avatar || '/src/assets/vue.svg'" alt="user"/>
                </template>
              </div>
              <div class="flex-grow-1" style="margin-top: -2px;">
                <div class="fw-bold">
                  <template v-if="profilePathForFile(file)">
                    <router-link :to="profilePathForFile(file)" class="text-reset text-decoration-none">{{ file.createdByName || file.author || file.username || 'Anonymous' }}</router-link>
                  </template>
                  <template v-else>
                    {{ file.createdByName || file.author || file.username || 'Anonymous' }}
                  </template>
                </div>
                <div class="small text-muted">{{ displayDate(file.createdAt) }}</div>
              </div>
              <div class="ms-auto align-self-start">
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
              <div>
                <button class="btn btn-sm btn-link p-0 comment-toggle" @click.stop.prevent="toggleComments(file)" :aria-expanded="file._showComments">
                  <i class="bi bi-chat"></i>
                  <span class="ms-2">{{ file.commentsCount || 0 }}</span>
                </button>
              </div>
              <div class="ms-auto d-flex align-items-center gap-2">
                <button v-if="isMine(file)" class="btn btn-sm btn-link text-danger" @click.stop.prevent="confirmDelete(file)" :title="`Delete ${file.name || file.title}`" aria-label="Delete post">
                  <i class="bi bi-trash"></i>
                  <span v-if="isDeleting(file.id)" class="spinner-border spinner-border-sm text-white ms-1" role="status" aria-hidden="true"></span>
                </button>
                <button v-if="isMine(file)" class="btn btn-sm btn-link text-primary" @click.stop.prevent="openEdit(file)"><i class="bi bi-pencil"></i></button>
              </div>
            </div>
            <!-- inline comments panel (collapsible) -->
            <div class="comments-panel mt-2" v-if="file._showComments">
              <div class="d-flex gap-2 mb-3">
                <input type="text" class="form-control" v-model="file._newComment" placeholder="Add a comment..." @keydown.enter.prevent="submitComment(file)" />
                <button class="btn btn-create" @click="submitComment(file)">Comment</button>
              </div>

              <div v-for="(c, cid) in file.comments" :key="cid" class="comment-item mb-3">
                <div class="d-flex align-items-start justify-content-between small gap-2">
                    <div class="comment-left d-flex align-items-start gap-2">
                    <div class="comment-avatar">
                      <template v-if="profilePathForComment(c)">
                        <router-link :to="profilePathForComment(c)"><img :src="c.avatar || avatarForName(c.authorName)" alt="avatar" /></router-link>
                      </template>
                      <template v-else>
                        <img :src="c.avatar || avatarForName(c.authorName)" alt="avatar" />
                      </template>
                    </div>
                    <div>
                      <div>
                        <strong>
                          <template v-if="profilePathForComment(c)">
                            <router-link :to="profilePathForComment(c)" class="text-reset text-decoration-none">{{ c.authorName || c.author || 'Anon' }}</router-link>
                          </template>
                          <template v-else>
                            {{ c.authorName || c.author || 'Anon' }}
                          </template>
                        </strong>
                        <span class="text-muted">• {{ displayDate(c.createdAt) }}</span>
                      </div>
                      <div class="mt-2 comment-body">{{ c.text }}</div>
                      <div class="mt-2"><a href="#" class="reply-link" @click.prevent="startReply(file, cid)">Reply</a></div>
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

                <!-- reply input (appears when replying to this comment) -->
                <div v-if="file._replyTarget === cid" class="reply-input mt-2 d-flex gap-2 align-items-start">
                  <div class="reply-avatar"><img :src="avatarForName(currentUserName || 'You')" alt="you"/></div>
                  <input type="text" class="form-control" v-model="file._replyText" placeholder="Replying to {{ c.authorName || c.author || 'Anon' }}..." @keydown.enter.prevent="submitReply(file, cid)" />
                  <button class="btn btn-create" @click="submitReply(file, cid)">Reply</button>
                </div>

                <!-- replies list -->
                <div class="comment-replies mt-3" v-if="c.replies && Object.keys(c.replies).length">
                  <div v-for="(r, rid) in c.replies" :key="rid" class="reply-item d-flex align-items-start mb-2">
                    <div class="reply-avatar">
                      <template v-if="profilePathForReply(r)">
                        <router-link :to="profilePathForReply(r)"><img :src="r.avatar || avatarForName(r.authorName)" alt="avatar"/></router-link>
                      </template>
                      <template v-else>
                        <img :src="r.avatar || avatarForName(r.authorName)" alt="avatar"/>
                      </template>
                    </div>
                    <div class="reply-bubble" style="flex:1; position:relative">
                      <div class="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>
                            <template v-if="profilePathForReply(r)">
                              <router-link :to="profilePathForReply(r)" class="text-reset text-decoration-none">{{ r.authorName || r.author || 'Anon' }}</router-link>
                            </template>
                            <template v-else>
                              {{ r.authorName || r.author || 'Anon' }}
                            </template>
                          </strong>
                          <span class="text-muted">• {{ displayDate(r.createdAt) }}</span>
                        </div>
                        <div>
                          <div v-if="isReplyOwner(r)" class="dropdown dropend">
                            <button class="btn btn-sm btn-link comment-menu-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More">
                              <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                              <li><button class="dropdown-item" @click.stop.prevent="startEditReply(file, cid, rid)">Edit</button></li>
                              <li><button class="dropdown-item text-danger" @click.stop.prevent="deleteReply(file, cid, rid)">Delete</button></li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div class="mt-1" v-if="!(file._editingReply === rid)">{{ r.text }}</div>
                      <div v-else class="mt-1">
                        <input class="form-control comment-edit-input" v-model="file._editingReplyText" />
                        <div class="mt-1"><button class="btn btn-primary btn-sm" @click="saveEditReply(file, cid, rid)">Save</button> <button class="btn btn-secondary btn-sm" @click="cancelEditReply(file)">Cancel</button></div>
                      </div>

                      <div class="mt-2"><a href="#" class="reply-link" @click.prevent="startReply(file, cid, rid)">Reply</a></div>
                    </div>
                  </div>
                </div>
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
import { ref, onMounted, nextTick, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Eye } from 'lucide-vue-next'
import uploadFile from '../upload'
import { getDataFromFirebase, pushDataToFirebase, deleteDataFromFirebase, overwriteDataToFirebase, storage, getUserName} from '../firebase/firebase'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { onUserStateChanged } from '../firebase/auth' // Adjust path as needed

const showPopup = ref(false)
const isSigningIn = ref(false)
const currentUser = ref(null)
const auth = getAuth()

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
const router = useRouter()


async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    currentUser.value = result.user
    showPopup.value = false
    return result.user
  } catch (error) {
    console.error('Google sign-in error:', error)
    showPopup.value = true
    throw error
  }
}


// Handle sign-in
async function handleSignIn() {
  if (isSigningIn.value) return
  isSigningIn.value = true
  try {
    await loginWithGoogle()
  } catch (err) {
    console.error('Google sign-in failed', err)
    showPopup.value = true
  } finally {
    isSigningIn.value = false
  }
}

// Handle popup close
const handlePopupClose = (event) => {
  if (!event) {
    showPopup.value = false
    return
  }

  const el = event.target || event.currentTarget

  if (el.classList && el.classList.contains('success-overlay')) {
    showPopup.value = false
    return
  }

  if (el.classList && el.classList.contains('sign-in-btn')) {
    handleSignIn()
    return
  }

  if (el.classList && (el.classList.contains('close-btn'))) {
    showPopup.value = false
    return
  }

  if (el.closest) {
    if (el.closest('.close-btn') || el.closest('.sign-in-btn')) {
      showPopup.value = false
      return
    }
  }
}

// Watch for auth state changes
watch(currentUser, (newUser) => {
  if (newUser) showPopup.value = false
})

onMounted(() => {
  onUserStateChanged((user) => {
    currentUser.value = user
    if (user) showPopup.value = false
  })
})

function profilePathForFile(file) {
  // prefer explicit uid properties if present
  const uid = file.createdByUid || file.createdBy || file.authorId || file.author
  if (!uid) return null
  return `/profile/${uid}`
}

function profilePathForComment(c) {
  const uid = c.authorId || c.author || c.uid
  if (!uid) return null
  return `/profile/${uid}`
}

function profilePathForReply(r) {
  const uid = r.authorId || r.author || r.uid
  if (!uid) return null
  return `/profile/${uid}`
}

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
            // ensure replies object exists
            c.replies = c.replies || {}
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
    showPopup.value = true
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
    showPopup.value = true
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
      // ensure UI shows comments after posting
      file._showComments = true
  } catch (err) {
    console.error('Failed to submit comment', err)
    alert('Failed to submit comment')
  }
}

function toggleComments(file) {
  if (!file) return
  file._showComments = !file._showComments
}

function startReply(file, cid, rid = null) {
  if (!file) return
  file._replyTarget = cid
  file._replyText = ''
}

async function submitReply(file, cid) {
  if (!file || !file.id || !file.comments || !file.comments[cid]) return
  const text = (file._replyText || '').trim()
  if (!text) return
  if (!currentUserId.value) { 
    showPopup.value = true
    return 
  }
  const reply = {
    author: currentUserId.value,
    authorName: currentUserName.value || 'Anon',
    text,
    createdAt: Date.now()
  }
  try {
    // push reply under forumUploads/{postId}/comments/{cid}/replies
    await pushDataToFirebase(`forumUploads/${file.id}/comments/${cid}/replies`, reply)
    // update local
    if (!file.comments[cid].replies) file.comments[cid].replies = {}
    const rk = 'r_' + Date.now()
    reply.avatar = avatarForName(reply.authorName)
    file.comments[cid].replies[rk] = reply
    file._replyText = ''
    file._replyTarget = null
  } catch (err) {
    console.error('Failed to submit reply', err)
    alert('Failed to submit reply')
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

function isReplyOwner(r) {
  if (!r) return false
  const uid = currentUserId.value
  if (!uid) return false
  return Boolean(r.author === uid || r.authorId === uid || r.uid === uid || r.createdBy === uid)
}

function startEditReply(file, cid, rid) {
  if (!file || !file.comments || !file.comments[cid] || !file.comments[cid].replies || !file.comments[cid].replies[rid]) return
  if (!isReplyOwner(file.comments[cid].replies[rid])) return
  file._editingReply = rid
  file._editingReplyText = file.comments[cid].replies[rid].text
}

function cancelEditReply(file) {
  if (!file) return
  file._editingReply = null
  file._editingReplyText = ''
}

async function saveEditReply(file, cid, rid) {
  if (!file || !file.id || !file.comments || !file.comments[cid] || !file.comments[cid].replies || !file.comments[cid].replies[rid]) return
  if (!file._editingReplyText) return
  try {
    // overwrite the reply object at nested path
    // Build object path: forumUploads/{postId}/comments/{cid}/replies/{rid}
    await overwriteDataToFirebase(rid, `forumUploads/${file.id}/comments/${cid}/replies`, { ...file.comments[cid].replies[rid], text: file._editingReplyText, editedAt: Date.now() })
    file.comments[cid].replies[rid].text = file._editingReplyText
    file.comments[cid].replies[rid].editedAt = Date.now()
    cancelEditReply(file)
  } catch (err) {
    console.error('Failed to save reply edit', err)
    alert('Failed to save reply')
  }
}

async function deleteReply(file, cid, rid) {
  if (!file || !file.id || !file.comments || !file.comments[cid] || !file.comments[cid].replies || !file.comments[cid].replies[rid]) return
  if (!isReplyOwner(file.comments[cid].replies[rid])) return
  try {
    await deleteDataFromFirebase(`forumUploads/${file.id}/comments/${cid}/replies/${rid}`)
    delete file.comments[cid].replies[rid]
  } catch (err) {
    console.error('Failed to delete reply', err)
    alert('Failed to delete reply')
  }
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
  if (!currentUserId.value) { 
    showPopup.value = true
    return 
  }
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
.page {
  padding: 32px;
  background: #181c23;
  color: #eaf0f6;
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
}

/* Card and message containers */
.forum-item .card {
  background: #232830;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(18,24,34,0.11);
  padding: 18px;
  margin-bottom: 22px;
  border: none;
  transition: box-shadow 0.18s;
}
.forum-item .card:hover {
  box-shadow: 0 4px 16px rgba(33, 33, 33, 0.14);
}
/* Header styles */
.forum-header {
  padding: 6px 0 12px 0;
}
.forum-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.forum-title {
  color: #ff9a3c;
  font-weight: 800;
  font-size: 1.6rem;
  margin: 0;
}
.forum-sub {
  color: #9fb0bf;
  margin-top: 6px;
}

/* Tabs container */
.forum-tabs .tabs-container {
  display: inline-flex;
  gap: 8px;
  background: rgba(255,255,255,0.02);
  padding: 6px;
  border-radius: 12px;
}


/* User row */
.forum-message-row, .comment-item, .reply-item {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 18px;
}

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

/* File image styling */
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

/* Thumbnail overlay on hover */
.thumb-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}
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
.eye-icon { color: white; width: 36px; height: 36px; }

/* Responsive image height */
@media (min-width: 768px) {
  .file-thumb { max-height: 260px; }
}

/* Upload card styling */
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

/* Card divider */
.card-divider {
  height: 1px;
  width: 100%;
  background: rgba(255,255,255,0.04);
  margin: 8px 0;
  border-radius: 1px;
}

/* Forum list */
.forum-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.forum-item .card {
  padding: 14px;
  border-radius: 10px;
}
.post-media {
  margin-top: 8px;
}
.post-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
  display: block;
}
/* Post avatar (single source of truth) */
/* Note: consolidated to avoid duplicate rules causing visual double rings */
/* The only orange outline should come from this border below */
.like-btn {
  color: inherit;
}
.like-area {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Like button states and animation */
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
/* Comments panel */
.comments-panel {
  margin-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.03);
  padding-top: 8px;
}
.comment-item {
  background: transparent;
}
.comment-item div {
  color: #c9d1d9;
}

/* Comment avatar styling consolidated below with replies */

/* Layout for comment items */
.comment-left {
  display: flex;
  align-items: flex-start;
}

/* Comment body */
.comment-body {
  margin-top: 6px;
  line-height: 1.4;
}

/* Comment menu button */
.comment-menu-btn {
  color: rgba(255,255,255,0.65);
  padding: 6px;
}
.comment-menu-btn:hover {
  color: #ffa733 !important;
  background: rgba(255,167,51,0.2) !important;
  border-radius: 6px;
}

/* Override the hover state to apply orange only on hover */
.comment-toggle:hover {
  color: #ffa733 !important;
}

/* Reset the active state to default color, so it does not stay orange */
.comment-toggle {
  color: #cfe6ff; /* default icon color */
  transition: color 0.3s ease;
}

/* Prevent the color from staying after click by removing any persistent style changes on active state */
.comment-toggle:active,
.comment-toggle.active {
  color: #cfe6ff !important; /* reset active to default color */
}


.comment-toggle .bi-chat {
  color: inherit !important;
  transition: color 0.3s ease !important;
}
/* Remove dropdown arrow */
.comment-menu-btn.dropdown-toggle::after {
  display: none !important;
}

/* Comment edit input */
.comment-edit-input {
  color: #fff;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
}
.comment-edit-input::placeholder {
  color: rgba(255,255,255,0.5);
}

/* Input text color fixes on focus/autofill */
input.comment-edit-input.form-control,
input.comment-edit-input.form-control:focus,
input.comment-edit-input.form-control:active {
  color: #fff !important;
  caret-color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}
input.comment-edit-input:-webkit-autofill,
input.comment-edit-input:-webkit-autofill:focus {
  -webkit-text-fill-color: #fff !important;
}

/* Text clamp with fade */
.card-caption.is-clamped {
  position: relative;
  padding-right: 18px;
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

.upload-card .flex-grow-1 {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Position action buttons above adjacent cards */
.forum-uploads .btn {
  position: relative;
  z-index: 5;
}

/* Forum-specific overrides */
.forum-uploads .upload-card {
  width: 100% !important;
  max-width: 100% !important;
  padding: 12px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  border-radius: 10px;
  position: relative;
  z-index: 1;
}

.forum-uploads .col {
  display: flex;
  overflow: visible;
}

/* Ensure card's content doesn't overflow */
.forum-uploads .card-body {
  overflow: hidden;
}

/* File action buttons inside card */
.forum-uploads .file-actions {
  z-index: 10;
  position: relative;
}

/* Allow visible overflow for buttons */
.forum-uploads .col {
  overflow: visible;
}

/* Delete modal styling */
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

.upload-modal {
  max-width: 680px;
}

/* Floating pencil button */
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

/* Dropzone */
.upload-dropzone {
  position: relative;
  border: 2px dashed rgba(255,255,255,0.06);
  padding: 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
}

/* Delete modal buttons */
.btn-cancel {
  background: #6b7379;
  color: #e6eef8;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
}

.btn-delete {
  background: #e44b5a;
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

/* File input in dropzone */
.upload-dropzone input[type="file"] {
  opacity: 0;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.drop-hint {
  pointer-events: none;
  color: #c8d0da;
  text-align: center;
}

.preview-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0d0f10;
  padding: 8px;
  border-radius: 6px;
}

.preview-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
}

.preview-icon {
  width: 64px;
  height: 64px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#1f262b;
  border-radius:6px;
  color:#ffb14d;
}

.preview-meta {
  display:flex;
  flex-direction:column;
}

/* Tooltip and z-index fixes */
.forum-uploads .upload-card {
  width: 100% !important;
  max-width: 100% !important;
  padding: 12px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  border-radius: 10px;
  position: relative;
  z-index: 1;
}

.forum-uploads .col {
  display: flex;
  overflow: visible;
}

/* Ensure the card's content doesn't overflow and push outside its column */
.forum-uploads .card-body { overflow: hidden; }

/* Ensure action buttons are visually on top */
.forum-uploads .file-actions { z-index: 10; position: relative; }

/* Allow columns to show overflow so button shadows are visible */
.forum-uploads .col { overflow: visible; }

/* Reduce filename size to prevent wrapping over actions */
.upload-card .fw-bold { font-size: 1rem; line-height: 1.2; }

/* Comments and replies styling */
.comments-panel {
  border-top: 1px solid rgba(255,255,255,0.03);
  padding-top: 12px;
}
.comment-item { display: block }
.comment-avatar img,
.reply-avatar img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 0; /* avoid double orange rings; ring drawn on container */
  display: block;
}
.comment-avatar,
.reply-avatar {
  width: 44px;
  height: 44px;
  position: relative;
  flex-shrink: 0;
}
.comment-avatar::before,
.reply-avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid #FFAD1D; /* single orange ring */
  border-radius: 50%;
  pointer-events: none;
}
.comment-left { align-items: flex-start }
.comment-body {
  margin-top: 6px;
  color: #e6eef8;
}
.reply-link {
  color: #ff9a3c;
  font-weight: 600;
  text-decoration: none;
}
.reply-input .reply-avatar img {
  width: 40px;
  height: 40px;
  border: 0;
  display: block;
}
.reply-input .form-control { border-radius: 8px; }
.comment-replies {
  margin-left: 64px;
  border-left: 2px solid rgba(255,255,255,0.02);
  padding-left: 16px;
}
.reply-item { gap: 10px }
.reply-bubble {
  background: #2b3238;
  padding: 12px 14px;
  border-radius: 8px;
  color: #e6eef8;
  width: 100%;
}
.reply-avatar {
  margin-right: 10px;
}

.comment-toggle {
  background: transparent;
  border: none;
  color: #cfe6ff; /* light blue tint */
  cursor: pointer;
  text-decoration: none; /* remove underline */
  padding: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 4px;
}


/* Popup styles */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(24, 28, 35, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.success-popup {
  background-color: #000000;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
  margin: 0 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* popup styles */ 
.success-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: white;
  background-color: #EF4444;
}

.success-popup h3 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
}

.success-popup p {
  color: #747d89;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.popup-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.sign-in-btn {
  background-color: #FFAD1D;
  color: #181C23;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.sign-in-btn:hover {
  background-color: #FFB751;
}

.close-btn {
  background-color: #374151;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.close-btn:hover {
  background-color: #4B5563;
}

/* Avatar sizes */
.avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
 /* avoid double orange rings */
  display: block;
}
.avatar {
  margin-top: -10px;
  width: 40px;
  border: 0;
  height: 40px;
  overflow: visible;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #232830;
  position: relative; /* for ring pseudo-element */
}
.avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 3px solid #FFAD1D; /* single orange ring */
  border-radius: 50%;
  pointer-events: none;
}

/* Dropdown menu dots styling */
.comment-menu-btn {
  color: rgba(255,255,255,0.65);
  padding: 6px;
}

.comment-menu-btn:hover {
  color: #ffa733 !important;
  background: rgba(255,167,51,0.2) !important;
  border-radius: 6px;
}
.comment-menu-btn.dropdown-toggle::after {
  display: none !important;
}

/* Comment edit input */
.comment-edit-input {
  color: #fff;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
}
.comment-edit-input::placeholder {
  color: rgba(255,255,255,0.5);
}

/* Ensure typed text remains white even when focused or autofilled */
input.form-control {
  background-color: #252b31 !important;
  color: #eaf0f6 !important;
  border: 1.5px solid #393e4a !important;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 1.1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
input.form-control::placeholder {
  color: #c0c8d2 !important;
}

/* Align icon vertically */
.comment-toggle .bi-chat {
  vertical-align: middle;
  font-size: 1.3rem;
}

/* Maintain overall dark theme container if needed */
.page {

  color: #eaf0f6;
  padding: 24px;
  font-family: "Segoe UI", Arial, sans-serif;
}

input.form-control:focus {
  outline: none !important;
  border-color: #ffa733 !important;
  box-shadow: 0 0 0 2px rgba(255, 167, 51, 0.25) !important;
}
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

/* Clamp text overflow visual */
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

/* Floating pencil button */
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

/* Dropzone style */
.upload-dropzone {
  position: relative;
  border: 2px dashed rgba(255,255,255,0.06);
  padding: 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.02);
}

/* Cancel/Delete button styles */
.btn-cancel {
  background: #6b7379;
  color: #e6eef8;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
}
.btn-delete {
  background: #e44b5a;
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

/* File input */
.upload-dropzone input[type="file"] {
  opacity: 0;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

/* Drop hint */
.drop-hint {
  pointer-events: none;
  color: #c8d0da;
  text-align: center;
}

/* Preview grid */
.preview-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0d0f10;
  padding: 8px;
  border-radius: 6px;
}
.preview-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
}
.preview-icon {
  width: 64px;
  height: 64px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#1f262b;
  border-radius:6px;
  color:#ffb14d;
}
.preview-meta {
  display:flex;
  flex-direction:column;
}

/* Forum uploads overrides */
.forum-uploads .upload-card {
  width: 100% !important;
  max-width: 100% !important;
  padding: 12px !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  border-radius: 10px;
  position: relative;
  z-index: 1;
}
.forum-uploads .col {
  display: flex;
  overflow: visible;
}
.forum-uploads .card-body {
  overflow: hidden;
}
.forum-uploads .file-actions {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 20;
}
.forum-uploads .icon-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.forum-uploads .icon-btn .bi {
  font-size: 1.05rem;
}
.upload-card .fw-bold {
  font-size: 1rem;
  line-height: 1.2;
}

/* Light main post stylings */
.main-post-text {
  color: #eaf0f6;
  font-size: 1.19rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-bottom: 10px;
  line-height: 1.7;
  border-left: 3px solid #ffa733;
  padding-left: 18px;
  background-color: rgba(255, 167, 51, 0.025);
  border-radius: 7px;
}
</style>