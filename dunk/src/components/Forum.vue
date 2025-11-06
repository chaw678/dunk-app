<template>
  <div class="page-bg">
    <div class="glass-card">
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

    <!-- Upload modal (themed) -->
    <div v-if="showUploadModal" class="modal-backdrop">
      <div class="themed-modal upload-modal" role="dialog" aria-modal="true" aria-label="Create a new post">
        <button class="modal-close" aria-label="Close" @click="cancelUploadModal">×</button>
        <h3 class="modal-title">Create a New Post</h3>
        <p class="modal-sub">Share something about the match you just played.</p>

        <div class="form-group">
          <label class="form-label">Your Message</label>
          <textarea v-model="uploadCaption" class="modal-textarea" rows="6" placeholder="What's on your mind?"></textarea>
        </div>

        <div class="modal-row">
          <div class="modal-col">
            <label class="form-label">Tag</label>
            <select class="modal-select" v-model="selectedTag">
              <option v-for="t in tags" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="modal-col">
            <label class="form-label">Attach Media</label>
            <div class="file-row">
              <input ref="uploadFileInput" type="file" class="modal-file" @change="handleModalFileSelect" accept="image/*" />
              <span class="file-note">{{ selectedUploadPreviews.length ? selectedUploadPreviews.length + ' file(s) selected' : 'No file chosen' }}</span>
            </div>
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

        <div class="modal-actions">
          <button class="btn btn-cancel" @click="cancelUploadModal">Cancel</button>
          <button class="btn btn-create" :title="currentUserId ? 'Create Post' : 'Sign in to create posts'" @click="submitUpload">Create Post</button>
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
                  <router-link :to="profilePathForFile(file)"><img :src="avatarForFile(file) || '/src/assets/vue.svg'" alt="user"/></router-link>
                </template>
                <template v-else>
                  <img :src="avatarForFile(file) || '/src/assets/vue.svg'" alt="user"/>
                </template>
              </div>
              <div class="flex-grow-1" style="margin-top: 8px;">
                <div class="fw-bold">
                    <template v-if="profilePathForFile(file)">
                    <router-link :to="profilePathForFile(file)" class="text-reset text-decoration-none">{{ displayNameForFile(file) }}</router-link>
                  </template>
                  <template v-else>
                    {{ displayNameForFile(file) }}
                  </template>
                </div>
                <div class="small text-muted">{{ displayDate(file.createdAt) }}</div>
              </div>
              <div class="ms-auto align-self-start">
                <span v-if="file.tag" class="badge bg-secondary">{{ file.tag }}</span>
              </div>
            </div>
            <p class="mb-2">{{ file.caption || file.title || '' }}</p>
            <div v-if="file.matchId" class="mb-2 small">
              <a href="#" @click.prevent="openMatchSummary(file.matchId, file.matchTitle)" class="text-warning">View related match{{ file.matchTitle ? `: ${file.matchTitle}` : '' }}</a>
              <span class="text-muted ms-2">(may be removed by host)</span>
            </div>
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
                        <!-- When a profile path exists prefer the canonical avatar resolution
                             (usersMap/profile photo) so comments reflect the user's current pfp -->
                        <router-link :to="profilePathForComment(c)"><img :src="avatarForComment(c)" alt="avatar" /></router-link>
                      </template>
                      <template v-else>
                        <img :src="avatarForComment(c)" alt="avatar" />
                      </template>
                    </div>
                    <div>
                      <div>
                        <strong>
                          <template v-if="profilePathForComment(c)">
                            <router-link :to="profilePathForComment(c)" class="text-reset text-decoration-none">{{ displayNameForComment(c) }}</router-link>
                          </template>
                          <template v-else>
                            {{ displayNameForComment(c) }}
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
                <!-- show only when replying directly to the comment (no target reply id) -->
                <div v-if="file._replyTarget === cid && !file._replyTargetRid" class="reply-input mt-2 d-flex gap-2 align-items-start">
                  <div class="reply-avatar"><img :src="avatarForUid()" alt="you"/></div>
                  <input type="text" class="form-control" v-model="file._replyTexts['c_' + cid]" :placeholder="`Replying to ${displayNameForComment(c)}...`" @keydown.enter.prevent="submitReply(file, cid)" />
                  <button class="btn btn-create" @click="submitReply(file, cid)">Reply</button>
                </div>

                <!-- replies list rendered as a two-level tree (roots + children). -->
                <div class="comment-replies mt-3" v-if="c.replies && Object.keys(c.replies).length">
                  <div v-for="node in replyRoots(c)" :key="node.rid" class="reply-node">
                    <div class="reply-item d-flex align-items-start mb-2">
                      <div class="reply-avatar">
                        <template v-if="profilePathForReply(node.r)">
                          <router-link :to="profilePathForReply(node.r)"><img :src="avatarForComment(node.r)" alt="avatar"/></router-link>
                        </template>
                        <template v-else>
                          <img :src="avatarForComment(node.r)" alt="avatar"/>
                        </template>
                      </div>
                      <div class="reply-bubble" style="flex:1; position:relative">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>
                              <template v-if="profilePathForReply(node.r)">
                                <router-link :to="profilePathForReply(node.r)" class="text-reset text-decoration-none">{{ displayNameForComment(node.r) }}</router-link>
                              </template>
                              <template v-else>
                                {{ displayNameForComment(node.r) }}
                              </template>
                            </strong>
                            <span class="text-muted">• {{ displayDate(node.r.createdAt) }}</span>
                          </div>
                          <div>
                            <div v-if="isReplyOwner(node.r)" class="dropdown dropend">
                              <button class="btn btn-sm btn-link comment-menu-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More">
                                <i class="bi bi-three-dots-vertical"></i>
                              </button>
                              <ul class="dropdown-menu dropdown-menu-end">
                                <li><button class="dropdown-item" @click.stop.prevent="startEditReply(file, cid, node.rid)">Edit</button></li>
                                <li><button class="dropdown-item text-danger" @click.stop.prevent="deleteReply(file, cid, node.rid)">Delete</button></li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div class="mt-1" v-if="!(file._editingReply === node.rid)">{{ node.r.text }}</div>
                        <div v-else class="mt-1">
                          <input class="form-control comment-edit-input" v-model="file._editingReplyText" />
                          <div class="mt-1"><button class="btn btn-primary btn-sm" @click="saveEditReply(file, cid, node.rid)">Save</button> <button class="btn btn-secondary btn-sm" @click="cancelEditReply(file)">Cancel</button></div>
                        </div>

                        <div class="mt-2"><a href="#" class="reply-link" @click.prevent="startReply(file, cid, node.rid)">Reply</a></div>

                        <!-- if replying to this root reply, show nested input here -->
                        <div v-if="file._replyTarget === cid && file._replyTargetRid === node.rid" class="reply-input mt-2 d-flex gap-2 align-items-start nested-reply-input">
                          <div class="reply-avatar"><img :src="avatarForUid()" alt="you"/></div>
                          <input type="text" class="form-control" v-model="file._replyTexts[node.rid]" :placeholder="`Replying to ${displayNameForComment(node.r)}...`" @keydown.enter.prevent="submitReply(file, cid)" />
                          <button class="btn btn-create" @click="submitReply(file, cid)">Reply</button>
                        </div>
                      </div>
                    </div>

                    <!-- render children of this root reply (one level deeper) -->
                    <div class="child-list" v-if="replyChildren(c, node.rid) && replyChildren(c, node.rid).length">
                      <div v-for="child in replyChildren(c, node.rid)" :key="child.rid" class="reply-item d-flex align-items-start mb-2 child">
                        <div class="reply-avatar">
                          <template v-if="profilePathForReply(child.r)">
                            <router-link :to="profilePathForReply(child.r)"><img :src="avatarForComment(child.r)" alt="avatar"/></router-link>
                          </template>
                          <template v-else>
                            <img :src="avatarForComment(child.r)" alt="avatar"/>
                          </template>
                        </div>
                        <div class="reply-bubble" style="flex:1; position:relative">
                          <div class="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>
                                <template v-if="profilePathForReply(child.r)">
                                  <router-link :to="profilePathForReply(child.r)" class="text-reset text-decoration-none">{{ displayNameForComment(child.r) }}</router-link>
                                </template>
                                <template v-else>
                                  {{ displayNameForComment(child.r) }}
                                </template>
                              </strong>
                              <span class="text-muted">• {{ displayDate(child.r.createdAt) }}</span>
                            </div>
                            <div>
                              <div v-if="isReplyOwner(child.r)" class="dropdown dropend">
                                <button class="btn btn-sm btn-link comment-menu-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More">
                                  <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                  <li><button class="dropdown-item" @click.stop.prevent="startEditReply(file, cid, child.rid)">Edit</button></li>
                                  <li><button class="dropdown-item text-danger" @click.stop.prevent="deleteReply(file, cid, child.rid)">Delete</button></li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <div class="mt-1" v-if="!(file._editingReply === child.rid)">{{ child.r.text }}</div>
                          <div v-else class="mt-1">
                            <input class="form-control comment-edit-input" v-model="file._editingReplyText" />
                            <div class="mt-1"><button class="btn btn-primary btn-sm" @click="saveEditReply(file, cid, child.rid)">Save</button> <button class="btn btn-secondary btn-sm" @click="cancelEditReply(file)">Cancel</button></div>
                          </div>

                          <div class="mt-2"><a href="#" class="reply-link" @click.prevent="startReply(file, cid, child.rid)">Reply</a></div>

                          <!-- nested reply input for replies to this child -->
                              <div v-if="file._replyTarget === cid && file._replyTargetRid === child.rid" class="reply-input mt-2 d-flex gap-2 align-items-start nested-reply-input child-input">
                            <div class="reply-avatar"><img :src="avatarForUid()" alt="you"/></div>
                            <input type="text" class="form-control" v-model="file._replyTexts[child.rid]" :placeholder="`Replying to ${displayNameForComment(child.r)}...`" @keydown.enter.prevent="submitReply(file, cid)" />
                            <button class="btn btn-create" @click="submitReply(file, cid)">Reply</button>
                          </div>
                        </div>

                        <!-- grandchildren rendered as separate boxes outside the parent's bubble -->
                        <div v-if="replyChildren(c, child.rid) && replyChildren(c, child.rid).length" class="grandchild-list mt-2">
                          <div v-for="g in replyChildren(c, child.rid)" :key="g.rid" class="reply-item d-flex align-items-start mb-2 grandchild">
                            <div class="reply-avatar">
                              <template v-if="profilePathForReply(g.r)">
                                <router-link :to="profilePathForReply(g.r)"><img :src="avatarForComment(g.r)" alt="avatar"/></router-link>
                              </template>
                              <template v-else>
                                <img :src="avatarForComment(g.r)" alt="avatar"/>
                              </template>
                            </div>
                            <div class="reply-bubble" style="flex:1; position:relative">
                              <div class="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong>
                                    <template v-if="profilePathForReply(g.r)">
                                      <router-link :to="profilePathForReply(g.r)" class="text-reset text-decoration-none">{{ displayNameForComment(g.r) }}</router-link>
                                    </template>
                                    <template v-else>
                                      {{ displayNameForComment(g.r) }}
                                    </template>
                                  </strong>
                                  <span class="text-muted">• {{ displayDate(g.r.createdAt) }}</span>
                                </div>
                                <div>
                                  <div v-if="isReplyOwner(g.r)" class="dropdown dropend">
                                    <button class="btn btn-sm btn-link comment-menu-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" title="More">
                                      <i class="bi bi-three-dots-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                      <li><button class="dropdown-item" @click.stop.prevent="startEditReply(file, cid, g.rid)">Edit</button></li>
                                      <li><button class="dropdown-item text-danger" @click.stop.prevent="deleteReply(file, cid, g.rid)">Delete</button></li>
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div class="mt-1" v-if="!(file._editingReply === g.rid)">{{ g.r.text }}</div>
                              <div v-else class="mt-1">
                                <input class="form-control comment-edit-input" v-model="file._editingReplyText" />
                                <div class="mt-1"><button class="btn btn-primary btn-sm" @click="saveEditReply(file, cid, g.rid)">Save</button> <button class="btn btn-secondary btn-sm" @click="cancelEditReply(file)">Cancel</button></div>
                              </div>

                              <div class="mt-2"><a href="#" class="reply-link" @click.prevent="startReply(file, cid, g.rid)">Reply</a></div>

                              <!-- nested reply input for replies to this grandchild -->
                              <div v-if="file._replyTarget === cid && file._replyTargetRid === g.rid" class="reply-input mt-2 d-flex gap-2 align-items-start nested-reply-input grandchild-input">
                                <div class="reply-avatar"><img :src="avatarForUid()" alt="you"/></div>
                                <input type="text" class="form-control" v-model="file._replyTexts[g.rid]" :placeholder="`Replying to ${displayNameForComment(g.r)}...`" @keydown.enter.prevent="submitReply(file, cid)" />
                                <button class="btn btn-create" @click="submitReply(file, cid)">Reply</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
        <h5>Delete post</h5>
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
  </div>

  <!-- Match Summary Modal -->
  <EndMatchSummary 
    v-if="showMatchSummary" 
    :dbPath="summaryMatchPath" 
    compact 
    :hideActions="true"
    @close="closeMatchSummary"
  />
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Eye } from 'lucide-vue-next'
import uploadFile from '../upload'
import { getDataFromFirebase, pushDataToFirebase, deleteDataFromFirebase, overwriteDataToFirebase, storage, getUserName, onDataChange } from '../firebase/firebase'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import EndMatchSummary from './EndMatchSummary.vue'
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
const route = useRoute()
const prefillMatchId = ref(null)
const prefillMatchTitle = ref(null)

// Match summary modal state
const showMatchSummary = ref(false)
const summaryMatchPath = ref(null)
const prefillMatchPath = ref(null)

// live users map so display names and avatars update immediately when a profile changes
const usersMap = ref({})
let usersUnsub = null
function subscribeUsersRealtime() {
  if (usersUnsub) {
    try { usersUnsub() } catch (e) {}
    usersUnsub = null
  }
  try {
    usersUnsub = onDataChange('users', (v) => { usersMap.value = v || {} })
  } catch (e) {
    console.warn('subscribeUsersRealtime failed', e)
  }
}

function displayNameForId(uid) {
  if (!uid) return null
  const u = usersMap.value && usersMap.value[uid]
  if (!u) return null
  return u.name || u.username || u.displayName || (u.email && u.email.split('@')[0]) || null
}

function displayNameForFile(f) {
  const uid = f.createdByUid || f.createdBy || f.createdById
  return displayNameForId(uid) || f.createdByName || f.author || f.username || 'Anonymous'
}

function displayNameForComment(c) {
  const uid = c.authorId || c.author || c.uid
  return displayNameForId(uid) || c.authorName || c.author || 'Anon'
}

function avatarForFile(f) {
  const uid = f.createdByUid || f.createdBy || f.createdById
  const u = uid && usersMap.value && usersMap.value[uid]
  if (u) return u.photoURL || u.avatar || avatarForName(u.name || u.username)
  return f.avatar || avatarForName(f.createdByName || f.author || 'anon')
}

function avatarForComment(c) {
  const uid = c.authorId || c.author || c.uid
  const u = uid && usersMap.value && usersMap.value[uid]
  if (u) return u.photoURL || u.avatar || avatarForName(u.name || u.username)
  return c.avatar || avatarForName(c.authorName || c.author || 'anon')
}


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
  // subscribe to users map so profile edits reflect immediately across posts/comments
  subscribeUsersRealtime()
  onUserStateChanged((user) => {
    currentUser.value = user
    if (user) showPopup.value = false
  })
  // load forum posts
  loadUploads()
  // If navigated with ?openCreate=1, open the upload modal and optionally prefill caption
  try {
    const q = route && route.query ? route.query : {}
    if (q && (q.openCreate === '1' || q.openCreate === 'true')) {
      // prefill caption with court name if provided
      const court = q.court ? decodeURIComponent(q.court) : ''
      if (court) uploadCaption.value = `Just finished a match at ${court}.`
      // preselect tag if provided
      if (q.tag) selectedTag.value = q.tag
      // store match metadata if provided so submitUpload can attach it
      if (q.matchId) prefillMatchId.value = q.matchId
      if (q.matchTitle) prefillMatchTitle.value = q.matchTitle ? decodeURIComponent(q.matchTitle) : ''
      if (q.matchPath) prefillMatchPath.value = q.matchPath ? decodeURIComponent(q.matchPath) : ''
      // open modal after a tick so DOM is ready
      setTimeout(() => { showUploadModal.value = true }, 40)
      // remove the query param so reloading doesn't reopen it repeatedly
      try { router.replace({ path: route.path, query: {} }) } catch (e) {}
    }
  } catch (e) {
    // ignore
  }
})

onUnmounted(() => {
  if (usersUnsub) {
    try { usersUnsub() } catch (e) {}
    usersUnsub = null
  }
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
        // avatar from createdByUid/createdBy or fallback -> prefer canonical resolution
          f.avatar = avatarForFile(f)
        // read like/comment objects directly from post (favored schema to keep metadata together)
        f.likedBy = f.likedBy || f.likedBy || {}
        f.comments = f.comments || f.comments || {}
  // initialize UI state for replies
  f._replyTarget = f._replyTarget || null
  f._replyTargetRid = f._replyTargetRid || null
  f._replyTexts = f._replyTexts || {}
        // ensure each comment has an avatar and authorName fallback
        try {
          for (const [cid, c] of Object.entries(f.comments || {})) {
            if (!c) continue
            c.authorName = c.authorName || c.author || 'Anon'
            // prefer canonical avatar resolution for comments (consults usersMap)
            c.avatar = c.avatar || avatarForComment(c)
            // ensure replies object exists
            c.replies = c.replies || {}
          }
        } catch (e) {}
        f.likes = Object.keys(f.likedBy || {}).length
        f.liked = Boolean(currentUserId.value && f.likedBy && f.likedBy[currentUserId.value])
        // combined count of comments + replies for display
        f.commentsCount = computeTotalComments(f)
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

// Return avatar URL for a given user id, falling back to current user name or seeded avatar
function avatarForUid(uid) {
  const id = uid || currentUserId.value
  if (!id) return avatarForName(currentUserName.value || 'You')
  const u = usersMap.value && usersMap.value[id]
  if (u) return u.photoURL || u.avatar || avatarForName(u.name || u.username || currentUserName.value || 'You')
  return avatarForName(currentUserName.value || 'You')
}

// Compute total comment count for a post: top-level comments + all replies
function computeTotalComments(file) {
  if (!file || !file.comments) return 0
  try {
    let total = 0
    for (const [cid, c] of Object.entries(file.comments || {})) {
      if (!c) continue
      total += 1 
      const replies = c.replies || {}
      total += Object.keys(replies).length
    }
    return total
  } catch (e) {
    return Object.keys(file.comments || {}).length
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
    // attach canonical avatar (consults usersMap) for immediate UI so the comment
    // reflects the user's profile picture rather than a static seeded fallback
    comment.avatar = avatarForComment(comment)
    file.comments[key] = comment
  // update combined comments+replies count
  file.commentsCount = computeTotalComments(file)
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
  // Show reply box for this comment (cid). If rid provided, we're replying to that reply.
  file._replyTarget = cid
  file._replyTargetRid = rid || null
  // ensure per-target reply text container exists and initialize key
  file._replyTexts = file._replyTexts || {}
  const key = rid ? rid : `c_${cid}`
  if (!Object.prototype.hasOwnProperty.call(file._replyTexts, key)) file._replyTexts[key] = ''
  // ensure comments panel visible
  file._showComments = true
}

async function submitReply(file, cid) {
  if (!file || !file.id || !file.comments || !file.comments[cid]) return
  file._replyTexts = file._replyTexts || {}
  const key = file._replyTargetRid ? file._replyTargetRid : `c_${cid}`
  const text = (file._replyTexts[key] || '').trim()
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
  // if replying to an existing reply, include parentRid so we can thread
  if (file._replyTargetRid) {
    // If the target reply already has a parent (i.e. it's a child/grandchild),
    // attach the new reply to the same parent so we don't indent further.
    try {
      const targetRid = file._replyTargetRid
      const replies = file.comments[cid] && file.comments[cid].replies
      if (replies && replies[targetRid] && replies[targetRid].parentRid) {
        // target is already nested; attach new reply to its parent (sibling level)
        reply.parentRid = replies[targetRid].parentRid
      } else {
        // target is a root reply — nest under it as normal
        reply.parentRid = file._replyTargetRid
      }
    } catch (e) {
      // defensive fallback: if anything goes wrong, fall back to attaching to target
      reply.parentRid = file._replyTargetRid
    }
  }
  try {
    // push reply under forumUploads/{postId}/comments/{cid}/replies
    await pushDataToFirebase(`forumUploads/${file.id}/comments/${cid}/replies`, reply)
    // update local
    if (!file.comments[cid].replies) file.comments[cid].replies = {}
  const rk = 'r_' + Date.now()
  // prefer canonical avatar resolution so replies show the user's current profile image
  reply.avatar = avatarForComment(reply)
    // ensure parentRid persisted locally for rendering
    file.comments[cid].replies[rk] = reply
    // clear reply UI state for this target
    file._replyTexts[key] = ''
    file._replyTarget = null
    file._replyTargetRid = null
    // update visible comments count (include this new reply)
    file.commentsCount = computeTotalComments(file)
  } catch (err) {
    console.error('Failed to submit reply', err)
    alert('Failed to submit reply')
  }
}

// Helpers to build a two-level reply tree from flat replies object
function replyRoots(c) {
  if (!c || !c.replies) return []
  try {
    return Object.entries(c.replies)
      .filter(([rid, r]) => !r || !r.parentRid)
      .map(([rid, r]) => ({ rid, r }))
  } catch (e) {
    return []
  }
}

function replyChildren(c, parentRid) {
  if (!c || !c.replies || !parentRid) return []
  try {
    return Object.entries(c.replies)
      .filter(([rid, r]) => r && r.parentRid === parentRid)
      .map(([rid, r]) => ({ rid, r }))
  } catch (e) {
    return []
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
    // recompute since deleting a comment also removes its nested replies
    file.commentsCount = computeTotalComments(file)
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
    // removed a reply — recompute totals
    try { file.commentsCount = computeTotalComments(file) } catch(e){}
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
          // attach match metadata when present (so post keeps a reference even if match is later deleted)
          matchId: prefillMatchId.value || null,
          matchTitle: prefillMatchTitle.value || null,
          matchPath: prefillMatchPath.value || null,
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
        matchId: prefillMatchId.value || null,
        matchTitle: prefillMatchTitle.value || null,
        matchPath: prefillMatchPath.value || null,
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

function openMatchSummary(matchId, matchTitle) {
  if (!matchId) return
  // matchId is already in the format "matches/xxx"
  summaryMatchPath.value = matchId
  showMatchSummary.value = true
}

function closeMatchSummary() {
  showMatchSummary.value = false
  summaryMatchPath.value = null
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

// View match - shows summary for past matches, navigates to match room for active matches
async function viewMatch(post) {
  if (!post) return
  
  // If no matchPath, fall back to old behavior with matchId
  if (!post.matchPath) {
    if (post.matchId) {
      try {
        router.push(`/match/${post.matchId}`)
      } catch (e) {
        console.error('Failed to navigate to match:', e)
      }
    }
    return
  }
  
  try {
    // Check if match is past by fetching match data
    const matchData = await getDataFromFirebase(post.matchPath)
    if (!matchData) {
      alert('Match not found - it may have been deleted by the host')
      return
    }
    
    // Check if match has ended
    const isPast = matchData.matchEnded || matchData.endedAt || matchData.endedAtISO
    
    if (isPast) {
      // Show match summary modal for past matches
      summaryMatchPath.value = post.matchPath
      showMatchSummary.value = true
    } else {
      // Navigate to match room for active matches
      if (post.matchId) {
        try {
          router.push(`/match/${post.matchId}`)
        } catch (e) {
          console.error('Failed to navigate to match room:', e)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load match:', error)
    // Fallback: try to navigate to match room if we have matchId
    if (post.matchId) {
      try {
        router.push(`/match/${post.matchId}`)
      } catch (e) {
        alert('Failed to load match details')
      }
    } else {
      alert('Failed to load match details')
    }
  }
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
/* Page background with fixed image */
.page-bg {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  padding-left: 16px;
  padding-right: 16px;
  /* fixed column reserved for avatar + gap; used to align right edges of reply bubbles */
  --reply-avatar-col: 72px;
  --reply-indent-base: 12px;
  --reply-indent-step: 36px;
}

@media (min-width: 768px) {
  .page-bg { 
    padding-left: 20px; 
    padding-right: 20px; 
  }
}

@media (min-width: 900px) {
  .page-bg {
    display: flex;
    justify-content: center;
  }
}

.page-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)),
    url('https://images.pexels.com/photos/8693808/pexels-photo-8693808.jpeg?auto=compress&cs=tinysrgb&w=1920') center / cover no-repeat;
  z-index: 0;
  pointer-events: none;
}

.page-bg > * {
  position: relative;
  z-index: 1;
}

/* Glass card container */
.glass-card {
  padding: 32px;
  border-radius: 16px;
  /* glass effect: subtle translucent gradient */
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008));
  border: 1px solid rgba(255,255,255,0.04);
  box-shadow: 0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
  color: #e6eef8;
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
  margin: 0 auto;
  max-width: 1400px;
  width: 100%;
  box-sizing: border-box;
}

/* Card and message containers */
.forum-item .card {
  background: rgba(35, 40, 48, 0.95) !important;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(18,24,34,0.11);
  padding: 18px;
  margin-bottom: 22px;
  border: 1px solid rgba(255,255,255,0.05);
  transition: box-shadow 0.18s;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
}
.forum-item .card.bg-dark {
  background: rgba(35, 40, 48, 0.95) !important;
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
  color: #ffa733;
  font-weight: 800;
  font-size: 48px;
  margin: 0;
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
}
.forum-sub {
  color: #9fb0bf;
  font-size: 18px;
  margin-top: 8px;
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
}

/* Tabs container */
.forum-tabs .tabs-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: rgba(18,22,27,0.95);
  padding: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
}


/* User row */
.forum-message-row, .comment-item {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 18px;
}

.tab-btn {
  flex: 1;
  background: rgba(28,34,41,0.9);
  color: #cbd5e1;
  border: 1px solid transparent;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn:hover {
  background: rgba(28,34,41,1);
}
.tab-btn.active {
  background: rgba(15,19,24,1);
  color: #ffd27a;
  border-color: #ffad1d;
  box-shadow: 0 0 0 2px rgba(255,173,29,0.15) inset;
}
.tab-btn:focus { outline: none }

/* Dropdown menu styling */
.dropdown-menu {
  background: rgba(25, 30, 35, 0.98);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  min-width: 160px;
}
.dropdown-item {
  color: #e6eef8;
  padding: 10px 14px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
}
.dropdown-item:hover {
  background: rgba(255,167,51,0.15);
  color: #ffa733;
}
.dropdown-item:active {
  background: rgba(255,167,51,0.25);
  color: #ffa733;
}

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
  background: rgba(35, 40, 48, 0.95) !important;
  border: 1px solid rgba(255,255,255,0.05);
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
  background: rgba(35, 40, 48, 0.95) !important;
  border: 1px solid rgba(255,255,255,0.05);
}

.forum-uploads .col {
  display: flex;
  overflow: visible;
}

/* Ensure card's content doesn't overflow */
.forum-uploads .card-body {
  overflow: hidden;
}

.forum-item .card-body {
  overflow: hidden;
  max-width: 100%;
}

.forum-item .card-body p,
.forum-item .card-body .mb-2 {
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.forum-item .fw-bold,
.forum-item .text-reset {
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  display: inline-block;
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
  background: linear-gradient(135deg, rgba(20, 25, 30, 0.98), rgba(15, 18, 22, 0.98));
  padding: 32px;
  border-radius: 16px;
  color: #fff;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.7);
  border: 1px solid rgba(255,255,255,0.08);
}

.delete-modal h5 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #ffa733;
}

.delete-modal .form-label {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.delete-modal .form-control {
  background: rgba(30, 35, 40, 0.8);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 15px;
  transition: all 0.2s ease;
}

.delete-modal .form-control:focus {
  background: rgba(35, 40, 45, 0.9);
  border-color: #ffa733;
  box-shadow: 0 0 0 3px rgba(255,167,51,0.1);
  outline: none;
}

.delete-modal .form-control::placeholder {
  color: rgba(255,255,255,0.4);
}

.delete-modal textarea.form-control {
  resize: vertical;
  min-height: 120px;
}

.delete-modal .btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s ease;
}

.delete-modal .btn-secondary {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #cbd5e1;
}

.delete-modal .btn-secondary:hover {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.25);
  transform: translateY(-1px);
}

.delete-modal .btn-primary {
  background: #ffa733;
  border: none;
  color: #000;
}

.delete-modal .btn-primary:hover {
  background: #ffb84d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255,167,51,0.3);
}

.delete-modal .btn-primary:disabled {
  background: rgba(255,167,51,0.5);
  cursor: not-allowed;
  transform: none;
}

.delete-modal .mb-2 {
  margin-bottom: 20px;
}

.upload-modal {
  max-width: 680px;
}

/* Themed upload modal styles (match screenshot) */
.themed-modal {
  background: linear-gradient(180deg, #0f1418 0%, #0c0f12 100%);
  padding: 28px 32px;
  border-radius: 16px;
  color: #fff;
  width: 92%;
  max-width: 720px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.6);
  position: relative;
  border: 3px solid rgba(255,154,60,0.95);
}
.themed-modal .modal-close {
  position: absolute;
  right: 18px;
  top: 14px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
}
.themed-modal .modal-close:hover {
  color: #ff9a3c;
}
.themed-modal .modal-title { 
  font-size: 32px; 
  margin: 6px 0 6px; 
  font-weight: 800;
  color: #ff9a3c;
}
.themed-modal .modal-sub { 
  color: rgba(120, 115, 115, 0.92); 
  margin-bottom: 20px;
  font-size: 0.95rem;
}
.themed-modal .form-label {
  color: #fff;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
  font-size: 1rem;
}
.themed-modal .modal-textarea {
  width: 100%;
  min-height: 160px;
  background: #141617;
  border-radius: 10px;
  padding: 14px 16px;
  color: #fff;
  border: 1px solid rgba(255,154,60,0.2);
  resize: vertical;
  font-size: 15px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.themed-modal .modal-textarea::placeholder {
  color: rgba(91, 91, 91, 0.65);
}
.themed-modal .modal-textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255,154,60,0.15);
  border-color: #ff9a3c;
}
.themed-modal .modal-row { display:flex; gap:16px; margin-top:16px }
.themed-modal .modal-col { flex:1 }
.themed-modal .modal-select, .themed-modal .modal-file {
  width: 100%;
  border-radius: 10px;
  padding: 12px 14px;
  background: #141617;
  border: 1px solid rgba(255,255,255,0.06);
  color: #fff;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}
.themed-modal .modal-select:focus, .themed-modal .modal-file:focus {
  outline: none;
  border-color: #ff9a3c;
}
.themed-modal .file-row { display:flex; align-items:center; gap:12px }
.themed-modal .file-note { color: rgba(91, 91, 91, 0.92); font-size:13px }
.themed-modal .preview-grid { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px }
.themed-modal .preview-item { 
  display:flex; 
  gap:8px; 
  align-items:center; 
  background: rgba(18,20,22,0.85); 
  padding:10px; 
  border-radius:10px;
  border: 1px solid rgba(255,255,255,0.03);
}
.themed-modal .preview-thumb { width:72px; height:54px; object-fit:cover; border-radius:6px }
.themed-modal .preview-meta .small { color: rgba(255,255,255,0.85) }
.themed-modal .modal-actions { display:flex; justify-content:flex-end; gap:12px; margin-top:24px }
.themed-modal .btn-cancel { 
  background: transparent; 
  color: #cfd9e3; 
  border: 1px solid rgba(255,255,255,0.06); 
  padding: 12px 20px; 
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.themed-modal .btn-cancel:hover {
  background: rgba(255,255,255,0.02);
  border-color: rgba(255,255,255,0.1);
}
.themed-modal .btn-create { 
  background: #ff9a3c; 
  color: #111; 
  padding: 12px 24px; 
  border-radius: 10px; 
  border: none; 
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 6px 18px rgba(255,154,60,0.12);
}
.themed-modal .btn-create:hover {
  background: #ffb369;
  box-shadow: 0 8px 24px rgba(255,154,60,0.2);
}

@media (max-width: 640px) {
  .themed-modal { padding: 18px; width: 95%; }
  .themed-modal .modal-row { flex-direction:column }
  
  .forum-item .card {
    padding: 12px;
    overflow: visible;
  }
  
  .forum-item .card-body {
    padding: 0;
    overflow-x: hidden;
  }
  
  .forum-item .d-flex {
    flex-wrap: wrap;
  }
  
  .post-image {
    max-width: 100%;
    height: auto;
  }
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

.reply-item {
  display: grid;
  grid-template-columns: var(--reply-avatar-col) 1fr;
  gap: 12px;
  align-items: start;
}
.reply-bubble {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  padding: 8px 12px;
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
  background: rgba(35, 40, 48, 0.95) !important;
  border: 1px solid rgba(255,255,255,0.05);
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
/* avatar-centered connector segment removed to avoid drawing a line through the profile pictures */
.comment-left { align-items: flex-start }
.comment-body {
  margin-top: 6px;
  color: #e6eef8;
}
.reply-link {
  color: #ffb84d; /* brighter orange for better visibility */
  font-weight: 700;
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
  margin-left: 0;
  border-left: none; /* container-level border removed; connectors drawn from avatars */
  padding-left: var(--reply-indent-base);
}
.reply-bubble {
  background: #2b3238;
  padding: 12px 14px;
  border-radius: 8px;
  color: #e6eef8;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-right: 0;
}
.reply-avatar {
  margin-right: 10px;
  position: relative;
  z-index: 2; /* keep avatar above the bubble background */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

/* Nested reply visuals */
.comment-replies {
  /* base indent for first-level replies; further levels add the step value */
  margin-left: 0;
  border-left: none; /* removed to avoid duplicate/continuous line */
  padding-left: var(--reply-indent-base);
}

/* vertical connector lines for reply levels: draw a thin line inside each replies container
   so nested replies visually show the thread. The line sits behind avatars/bubbles. */
.comment-replies,
.child-list,
.grandchild-list {
  position: relative;
}

/* ensure replies containers don't clip avatar connectors */
.comment-replies,
.child-list,
.grandchild-list,
.reply-item {
  overflow: visible;
}

/* per-level padding so each nested replies container shifts by a fixed step */
.comment-replies {
  padding-left: calc(var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 0);
}
.child-list {
  padding-left: calc(var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 1);
}
.grandchild-list {
  padding-left: calc(var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 2);
}

/* vertical connector lines for each level — positioned under avatar centers for that level */
/* Container-level vertical guide lines (Reddit-like): draw a continuous thin line
   for each nesting level. Lines sit behind content; avatars are drawn above them. */
.comment-replies::before,
.child-list::before,
.grandchild-list::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.03);
  border-radius: 2px;
  z-index: 0;
}
.comment-replies::before { left: calc((var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 0) + 22px - 1px); }
.child-list::before     { left: calc((var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 1) + 22px - 1px); }
.grandchild-list::before { left: calc((var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 2) + 22px - 1px); }

/* Avatar-anchored connector: draw a thin vertical segment centered on each avatar.
   This guarantees the line aligns exactly with the avatar even when responsive
   math or zoom changes the layout. The pseudo-element sits behind avatars and
   bubbles. */
.reply-avatar {
  position: relative;
  z-index: 2; /* ensure avatar sits above the container guide */
}

/* also draw connector from comment avatars (top-level comment avatars) */
.comment-avatar {
  position: relative;
}
.comment-avatar {
  position: relative;
  z-index: 2; /* ensure comment avatar sits above the container guide */
}
.reply-avatar,
.reply-bubble {
  position: relative; /* ensure they sit above the connector line */
  z-index: 1;
}
.child { margin-left: 0; }
.grandchild { margin-left: 0; }
.nested-reply-input { margin-left: 0; }
.child-input { margin-left: 0; }
.grandchild-input { margin-left: 0; }

/* ensure grandchild lists occupy their own row and span the content column inside a grid reply-item */
.child-list {
  /* include avatar column in each level's padding so avatar centers line up with the guide */
  padding-left: calc(var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 1);
}
.grandchild-list {
  padding-left: calc(var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 2);
}

.reply-item > .grandchild-list {
  grid-column: 2 / -1; /* occupy the content column row */
  display: block;
  margin-left: 0;
  /* include avatar column so grandchild aligns with avatar-centered guides */
  padding-left: calc(var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 2); /* consistent 3rd-level indent */
  margin-top: 8px;
  width: 100%;
}
.reply-item > .grandchild-list .reply-item { width: 100%; }

/* Ensure child/grandchild reply bubbles use the same max-width so their right edges align */
.reply-item .reply-bubble,
.child .reply-bubble,
.grandchild .reply-bubble {
  max-width: none;
  width: 100%;
  margin-right: 0;
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
  margin-top: 0;
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

/* Reply-avatar ring: keep consistent sizing/positioning with main avatar */
.reply-avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  border: 3px solid #FFAD1D;
  border-radius: 50%;
  pointer-events: none;
}

/* Center avatar inside reply inputs and ensure the ring lines up */
.reply-input {
  align-items: center; /* override inline align-items-start in markup */
}
.reply-input .reply-avatar {
  margin-top: 0;
}
.reply-input .reply-avatar img {
  width: 40px;
  height: 40px;
  display: block;
  border-radius: 50%;
}

/* Style the first-level reply input's button so it matches nested reply buttons
   and sits directly to the right of the textbox. This targets `.reply-input`
   blocks used inside comments (not the top-level comment composer). */
.reply-input input.form-control {
  flex: 1 1 auto;
  min-width: 0;
}
.reply-input .btn-create {
  flex: 0 0 auto;
  margin-left: 8px;
  white-space: nowrap;
  align-self: center;
  background: #FFAD1D;
  color: #111;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(255,173,29,0.18);
}
.reply-input .btn-create:hover { background: #ffa733 }

/* Make the top-level comment composer button match the nested/first-level reply buttons.
   This targets the `.btn-create` that lives inside the collapsed comments panel's composer
   (the row with the "Add a comment..." input). */
.comments-panel .d-flex input.form-control {
  flex: 1 1 auto;
  min-width: 0;
}
.comments-panel .d-flex > .btn-create {
  flex: 0 0 auto;
  margin-left: 8px;
  white-space: nowrap;
  align-self: center;
  background: #FFAD1D;
  color: #111;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(255,173,29,0.18);
}
.comments-panel .d-flex > .btn-create:hover { background: #ffa733 }

/* Interactive states for comment/reply action buttons */
.reply-input .btn-create,
.nested-reply-input .btn-create,
.child-input .btn-create,
.grandchild-input .btn-create,
.comments-panel .d-flex > .btn-create {
  transition: transform 120ms cubic-bezier(.2,.9,.2,1), box-shadow 120ms ease, background-color 120ms ease;
  will-change: transform, box-shadow;
}

.reply-input .btn-create:hover,
.nested-reply-input .btn-create:hover,
.child-input .btn-create:hover,
.grandchild-input .btn-create:hover,
.comments-panel .d-flex > .btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.28), 0 2px 6px rgba(255,173,29,0.12);
}

.reply-input .btn-create:active,
.nested-reply-input .btn-create:active,
.child-input .btn-create:active,
.grandchild-input .btn-create:active,
.comments-panel .d-flex > .btn-create:active {
  transform: translateY(0) scale(0.995);
  box-shadow: 0 4px 10px rgba(0,0,0,0.22);
}

.reply-input .btn-create:focus-visible,
.nested-reply-input .btn-create:focus-visible,
.child-input .btn-create:focus-visible,
.grandchild-input .btn-create:focus-visible,
.comments-panel .d-flex > .btn-create:focus-visible {
  outline: 3px solid rgba(255,167,51,0.18);
  outline-offset: 3px;
  border-radius: 8px;
}

/* Place the nested reply submit button directly to the right of the input field
   without affecting the top-level comment reply area. We target only the
   nested reply input variants so the top-level `.reply-input` stays as-is. */
.nested-reply-input input.form-control,
.child-input input.form-control,
.grandchild-input input.form-control {
  flex: 1 1 auto; /* allow input to grow and take available space */
  min-width: 0;   /* prevent overflowing the flex container */
}

.nested-reply-input .btn-create,
.child-input .btn-create,
.grandchild-input .btn-create {
  flex: 0 0 auto;      /* keep button its natural size */
  margin-left: 8px;    /* small gap between input and button */
  white-space: nowrap;  /* prevent the button text from wrapping */
  align-self: center;   /* vertically center relative to the input */
}

/* Responsive fallback: stack input and button on very small viewports */
@media (max-width: 480px) {
  .nested-reply-input,
  .child-input,
  .grandchild-input {
    flex-direction: column;
    align-items: stretch;
  }
  .nested-reply-input .btn-create,
  .child-input .btn-create,
  .grandchild-input .btn-create {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
  }
}

/* Improve contrast for timestamps and reply action */
.reply-bubble .text-muted,
.reply-item .text-muted,
.comment-item .text-muted {
  color: rgba(255,255,255,0.62) !important;
}
.reply-link {
  color: #ffb84d; /* unify reply-link color across component */
  font-weight: 700;
}
.reply-link:hover { color: #ffe0aa }

/* Make nested reply buttons more visible (bright orange with dark text).
   We intentionally target nested reply buttons so we don't alter other global
   .btn-create instances elsewhere unless they live inside reply inputs. */
.nested-reply-input .btn-create,
.child-input .btn-create,
.grandchild-input .btn-create {
  background: #FFAD1D; /* primary orange */
  color: #111; /* high contrast on the orange */
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(255,173,29,0.18);
}
.nested-reply-input .btn-create:hover,
.child-input .btn-create:hover,
.grandchild-input .btn-create:hover {
  background: #ffa733;
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
  background: rgba(35, 40, 48, 0.95) !important;
  border: 1px solid rgba(255,255,255,0.05);
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
  flex-direction: row;
  gap: 8px;
  z-index: 20;
}
.forum-uploads .icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  cursor: pointer;
}
.forum-uploads .icon-btn:hover {
  background: rgba(0,0,0,0.7);
  border-color: rgba(255,255,255,0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.forum-uploads .icon-btn.btn-danger {
  background: rgba(220, 53, 69, 0.2);
  border-color: rgba(220, 53, 69, 0.3);
}
.forum-uploads .icon-btn.btn-danger:hover {
  background: rgba(220, 53, 69, 0.4);
  border-color: rgba(220, 53, 69, 0.5);
}
.forum-uploads .icon-btn.btn-primary {
  background: rgba(13, 110, 253, 0.2);
  border-color: rgba(13, 110, 253, 0.3);
}
.forum-uploads .icon-btn.btn-primary:hover {
  background: rgba(13, 110, 253, 0.4);
  border-color: rgba(13, 110, 253, 0.5);
}
.forum-uploads .icon-btn .bi {
  font-size: 1.1rem;
  color: #fff;
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

/* Stronger, specific rules to ensure nested reply items and bubbles occupy the content column
   and don't collapse into the avatar column. These rules are intentionally specific and
   placed at the end of the stylesheet so they win against earlier overrides. */
.comment-replies .reply-item,
.comment-replies .child-list .reply-item,
.comment-replies .grandchild-list .reply-item {
  display: grid !important;
  grid-template-columns: var(--reply-avatar-col) 1fr !important;
  gap: 12px !important;
  align-items: start !important;
}

.comment-replies .reply-bubble,
.comment-replies .child-list .reply-bubble,
.comment-replies .grandchild-list .reply-bubble {
  width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box !important;
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
}

.reply-item > .grandchild-list {
  grid-column: 2 / -1 !important; /* force grandchild list into content column */
  /* Keep the grandchild list aligned using the same CSS variables (no hardcoded px) */
  padding-left: calc(var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 2) !important;
  margin-left: 0 !important;
  width: 100% !important;
}

/* Normalize comment/reply typography for visual consistency */
.comment-item,
.comment-body,
.reply-bubble,
.reply-item .reply-bubble,
.child .reply-bubble,
.grandchild .reply-bubble,
.comment-left strong,
.reply-bubble strong,
.comment-item .text-muted,
.reply-item .text-muted {
  font-size: 1rem; /* consistent base size */
  line-height: 1.45;
}

/* Slightly reduce meta text (timestamps) but keep consistent sizing overall */
.comment-item .text-muted,
.reply-item .text-muted { font-size: 0.9rem; opacity: 0.9 }

.grandchild-list::before { left: calc((var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 2) + 22px - 1px) !important; }
/* top-level comments panel guide (leftmost) to match avatar centers for the root comment */
.comments-panel { position: relative; }
.comments-panel::before {
  content: '';
  position: absolute;
  /* start lower so the leftmost guide doesn't run from the very top of the card
    — increased offset to make the visible line shorter as requested */
  top: 80px;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,0.03);
  border-radius: 2px;
  z-index: 0;
  left: calc(22px - 1px); /* half of 44px avatar minus 1px */
}

/* Responsive tweaks: ensure the timeline / reply grid doesn't break on narrow viewports */
@media (max-width: 900px) {
  .forum-tabs .tabs-container {
    gap: 6px;
    padding: 5px;
  }
  
  .tab-btn {
    flex: 1 1 auto;
    min-width: calc(50% - 3px);
    padding: 10px 12px;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  
  .forum-header-inner {
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
  }
  .forum-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  .forum-title { font-size: 1.35rem; }
}

@media (max-width: 720px) {
  .page { padding: 16px; --reply-avatar-col: 56px; }
  /* slightly smaller avatars to save horizontal space */
  .avatar, .comment-avatar, .reply-avatar { width: 36px; height: 36px; }
  .avatar img, .comment-avatar img, .reply-avatar img { width: 36px; height: 36px; }
  .reply-input .reply-avatar img { width: 36px; height: 36px; }
  /* shift connector lines inward to match reduced avatar size */
  .comment-replies::before { left: calc((var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 0) + 18px - 1px); }
  .child-list::before { left: calc((var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 1) + 18px - 1px); }
  .grandchild-list::before { left: calc((var(--reply-avatar-col) + var(--reply-indent-base) + var(--reply-indent-step) * 2) + 18px - 1px); }

  /* Prevent connectors from overlapping by hiding them on medium-small screens if needed */
  .comment-replies::before,
  .child-list::before,
  .grandchild-list::before { display: none !important; }

  /* Ensure reply bubbles sit above any remaining visuals and can shrink to viewport */
  .reply-bubble { position: relative; z-index: 2; max-width: calc(100vw - var(--reply-avatar-col) - 96px); word-break: break-word; }
  .reply-item .reply-bubble, .child .reply-bubble, .grandchild .reply-bubble { min-width: 0; }

  /* allow horizontal panning on smaller tablets/small phones */
  .comments-panel { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .comments-panel .comments-list,
  .comments-panel .comment-replies,
  .comments-panel .child-list,
  .comments-panel .grandchild-list { min-width: 420px; }
}

@media (max-width: 420px) {
  /* compact layout: remove complex grid for replies and use simple flex rows to avoid overflow */
  .page { padding: 12px; --reply-avatar-col: 48px; --reply-indent-base: 8px; --reply-indent-step: 28px; }
  .forum-header-inner { flex-direction: column; align-items: flex-start; gap: 8px; }
  /* collapse reply grid into a simple horizontal layout: avatar + bubble */
  .reply-item,
  .comment-replies .reply-item,
  .child-list .reply-item,
  .grandchild-list .reply-item {
    display: flex !important;
    flex-direction: row !important;
    gap: 8px !important;
    align-items: flex-start !important;
  }
  .reply-item .reply-bubble,
  .child .reply-bubble,
  .grandchild .reply-bubble { margin-left: 0; }
  /* hide long vertical connector lines on very small screens to avoid layout overlap */
  .comment-replies::before,
  .child-list::before,
  .grandchild-list::before { display: none !important; }
  /* thin avatar rings on tiny screens */
  .reply-avatar::before, .comment-avatar::before, .avatar::before { border-width: 2px !important; }
  /* ensure reply inputs stack nicely */
  .nested-reply-input, .child-input, .grandchild-input { flex-direction: column !important; }
  .nested-reply-input .btn-create, .child-input .btn-create, .grandchild-input .btn-create { width: 100% !important; margin-left: 0 !important; margin-top: 8px !important; }
  /* reduce floating FAB size slightly */
  .fab-pencil { right: 12px; bottom: 12px; width: 48px; height: 48px; }
  /* cap post images to avoid very tall/small images pushing layout */
  .post-image { max-height: 280px; object-fit: cover; }
}

/* Alternative small-screen behavior: if the layout still doesn't fit, allow horizontal scroll
   for the comments panel and reduce the left gutter further so content can be nudged left.
   This prevents overlap by letting the user pan horizontally rather than wrap the grid. */
@media (max-width: 480px) {
  .comments-panel {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  /* Force inner comments grid to a minimum width so it can be scrolled horizontally */
  .comments-panel .comments-list,
  .comments-panel .comment-replies,
  .comments-panel .child-list,
  .comments-panel .grandchild-list {
    min-width: 560px;
  }
  /* Reduce the avatar column further to nudge content left */
  .page { --reply-avatar-col: 40px; }
  .avatar, .comment-avatar, .reply-avatar { width: 32px; height: 32px; }
  .avatar img, .comment-avatar img, .reply-avatar img { width: 32px; height: 32px; }
  /* make sure reply bubbles can shrink within the scroller */
  .reply-item .reply-bubble,
  .child .reply-bubble,
  .grandchild .reply-bubble { min-width: 220px; max-width: none; word-break: break-word; }
}
</style>