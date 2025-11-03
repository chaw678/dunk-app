<script setup>
// change 15: added "watch" import for profile edit modal
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { Trophy, Star, Users, Cake, ChartColumn } from 'lucide-vue-next'
import { loginWithGoogle, logout, onUserStateChanged, saveUserToDatabase } from '../firebase/auth.js'
import { onDataChange, getDataFromFirebase } from '../firebase/firebase'
import { getDatabase, ref as dbRef, set, update } from 'firebase/database'


//change 6: import dunk logo from assets
import dunkLogo from '../assets/dunk-ball.svg'





const user = ref(null)
const error = ref('')
const followingCount = ref(0)
const followersCount = ref(0)
let userListenerUnsub = null
// Change 1: controls the basketball login popup visibility
const showLoginPopup = ref(false)

//change 7: controls the basketball logout popup visibility
const showLogoutPopup = ref(false)

function onLocalFollowChanged(e) {
  try {
    const d = e && e.detail
    if (!d || !d.action) return
    if (d.action === 'follow') {
      followingCount.value = (followingCount.value || 0) + 1
    } else if (d.action === 'unfollow') {
      followingCount.value = Math.max(0, (followingCount.value || 0) - 1)
    }
  } catch (err) {
    // ignore
  }
}

const photoSrc = computed(() => {
  // Use the seeded avatar API (same used in Forum) so avatars are consistent across the app.
  // Derive a username from the email local-part when available.
  const u = user.value
  const username = (u && (u.email ? u.email.split('@')[0] : (u.displayName || u.uid))) || 'anon'
  if (u?.gender?.toLowerCase() === 'female') {
    return `https://avatar.iran.liara.run/public/girl?username=${encodeURIComponent(username)}`;
  } else {
    // Default male avatar
    return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
  }
});

const imgErrored = ref(false)

// change 12: Edit Profile Modal State & Fields
const showEditProfile = ref(false)
// const editName = ref(user.value?.displayName || '')
// const editGender = ref(user.value?.gender || '')
// const dobYear = ref(user.value?.dobYear || '')
// const dobMonth = ref(user.value?.dobMonth || '')
// const dobDay = ref(user.value?.dobDay || '')

const editName = ref('');
const editGender = ref('');
const dobYear = ref('');
const dobMonth = ref('');
const dobDay = ref('');
const editBio = ref(''); 
const editSkill = ref('');



// Step 1: Followers / Following Popup States
const showFollowers = ref(false);
const showFollowing = ref(false);
const searchQuery = ref('');
const followersList = ref([]);
const followingList = ref([]);
const filteredFollowers = ref([]);
const filteredFollowing = ref([]);
const showConfirmPopup = ref(false);
const confirmAction = ref(null);
const confirmMessage = ref('');

// helper to execute confirmed action safely
function runConfirmAction() {
  if (confirmAction.value && typeof confirmAction.value === 'function') {
    confirmAction.value();  // execute the stored action
  }
}


// Functions to open / close popups
function openFollowers() {
  showFollowers.value = true;
  loadFollowers();
}
function openFollowing() {
  showFollowing.value = true;
  loadFollowing();
}
function closePopup() {
  showFollowers.value = false;
  showFollowing.value = false;
  searchQuery.value = '';
}

// Step 2: Load lists from Firebase and hydrate UI
async function loadFollowers() {
  try {
    const dbUsers = await getDataFromFirebase('users');
    const current = dbUsers[user.value.uid];
    if (current && current.followers) {
      followersList.value = Object.keys(current.followers)
        .map(uid => dbUsers[uid])
        .filter(u => u != null); // <-- avoids undefined
      filteredFollowers.value = followersList.value;
    } else {
      followersList.value = [];
      filteredFollowers.value = [];
    }
  } catch (e) {
    console.error('Error loading followers', e);
  }
}

async function loadFollowing() {
  try {
    const dbUsers = await getDataFromFirebase('users');
    const current = dbUsers[user.value.uid];
    if (current && current.following) {
      followingList.value = Object.keys(current.following)
        .map(uid => dbUsers[uid])
        .filter(u => u != null); // <-- avoids undefined
      filteredFollowing.value = followingList.value;
    } else {
      followingList.value = [];
      filteredFollowing.value = [];
    }
  } catch (e) {
    console.error('Error loading following', e);
  }
}

// Step 3: Real-time search filter
watch(searchQuery, (val) => {
  const q = val.trim().toLowerCase();
  if (showFollowers.value) {
    filteredFollowers.value = followersList.value.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  } else if (showFollowing.value) {
    filteredFollowing.value = followingList.value.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }
});

// Step 4: Remove a follower with confirmation
// async function removeFollower(uidToRemove) {
//   if (!confirm('Are you sure you want to remove this follower?')) return;
//   try {
//     const db = getDatabase();
//     const followerRef = ref(db, `users/${user.value.uid}/followers/${uidToRemove}`);
//     await set(followerRef, null);
//     await loadFollowers();
//   } catch (e) {
//     console.error('Error removing follower', e);
//   }
// }

// Step 6: Show aesthetic confirmation for “Remove” or “Unfollow”
function confirmRemoveFollower(uidToRemove) {
  confirmMessage.value = 'Are you sure you want to remove this follower?';
  confirmAction.value = async () => {
    await performRemoveFollower(uidToRemove);
  };
  showConfirmPopup.value = true;
}

function confirmUnfollow(uidToRemove) {
  confirmMessage.value = 'Are you sure you want to unfollow this user?';
  confirmAction.value = async () => {
    await performUnfollow(uidToRemove);
  };
  showConfirmPopup.value = true;
}

// Step 7: Execute removal actions after confirmation
// async function performRemoveFollower(uidToRemove) {
//   try {
//     const db = getDatabase();
//     const followerRef = ref(db, `users/${user.value.uid}/followers/${uidToRemove}`);
//     await set(followerRef, null);
//     showConfirmPopup.value = false;
//     await loadFollowers();
//   } catch (e) {
//     console.error('Error removing follower', e);
//   }
// }

async function performRemoveFollower(uidToRemove) {
  try {
    const db = getDatabase()

    if (!uidToRemove) {
      console.error('performRemoveFollower(): uidToRemove is undefined!')
      alert('Error: follower UID missing — cannot remove.')
      return
    }
    if (!user.value || !user.value.uid) {
      console.error('performRemoveFollower(): current user.uid is undefined!')
      alert('Error: current user not detected — please log in again.')
      return
    }

    console.log('Current User ID:', user.value.uid)
    console.log('Removing Follower UID:', uidToRemove)

    const followerRef = dbRef(db, `users/${user.value.uid}/followers/${uidToRemove}`)
    const theirFollowingRef = dbRef(db, `users/${uidToRemove}/following/${user.value.uid}`)


    console.log('Deleting node:', `users/${user.value.uid}/followers/${uidToRemove}`)
    console.log('Deleting node:', `users/${uidToRemove}/following/${user.value.uid}`)

    await set(followerRef, null)
    await set(theirFollowingRef, null)

    console.log(`Follower ${uidToRemove} removed.`)
    showConfirmPopup.value = false
    await loadFollowers()
  } catch (e) {
    console.error('Error removing follower:', e)
  }
}





// Step 8: Execute Unfollow action (removes record on both users)
async function performUnfollow(uidToRemove) {
  try {
    const db = getDatabase();

    // Validate both UIDs
    if (!uidToRemove) {
      console.error("performUnfollow(): uidToRemove is undefined!");
      alert("Error: user to unfollow not found.");
      return;
    }
    if (!user.value || !user.value.uid) {
      console.error("performUnfollow(): current user.uid is undefined!");
      alert("Error: current user not detected — please log in again.");
      return;
    }

    console.log("You:", user.value.uid);
    console.log("Unfollowing:", uidToRemove);

    // Step 2: Build references correctly
    const myFollowingRef = dbRef(db, `users/${user.value.uid}/following/${uidToRemove}`);
    const theirFollowersRef = dbRef(db, `users/${uidToRemove}/followers/${user.value.uid}`);

    console.log("Deleting node:", `users/${user.value.uid}/following/${uidToRemove}`);
    console.log("Deleting node:", `users/${uidToRemove}/followers/${user.value.uid}`);

    // Step 3: Delete both records
    await set(myFollowingRef, null);
    await set(theirFollowersRef, null);

    console.log(`Successfully unfollowed ${uidToRemove}`);
    showConfirmPopup.value = false;
    await loadFollowing();
  } catch (error) {
    console.error("Error unfollowing user:", error);
  }
}

// Step 9: Close confirmation popup manually
function closeConfirmPopup() {
  showConfirmPopup.value = false;
  confirmAction.value = null;
  confirmMessage.value = '';
}





// const dobYear = ref(user.value?.dobYear || 2000)
// const dobMonth = ref(user.value?.dobMonth || 1)
// const dobDay = ref(user.value?.dobDay || 1)
// DOB fields are blank (''), so the selects show only the placeholder unless a value exists


const months = [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i );
const daysInMonth = computed(() => (new Date(dobYear.value, dobMonth.value, 0)).getDate());

// const computedAge = computed(() => {
//   const today = new Date();
//   let age = today.getFullYear() - dobYear.value;
//   if (
//     today.getMonth() + 1 < dobMonth.value ||
//     (today.getMonth() + 1 === dobMonth.value && today.getDate() < dobDay.value)
//   ) {
//     age--;
//   }
//   return age;
// });

const computedAge = computed(() => {
  // Guard: Only calculate if all DOB fields are provided
  if (!dobYear.value || !dobMonth.value || !dobDay.value) return null;
  const today = new Date();
  let age = today.getFullYear() - Number(dobYear.value);
  if (
    today.getMonth() + 1 < Number(dobMonth.value) ||
    (today.getMonth() + 1 === Number(dobMonth.value) && today.getDate() < Number(dobDay.value))
  ) {
    age--;
  }
  return age;
});
// Age shows 'Not Set' unless all DOB values are filled.


watch(user, () => {
  // editName.value = user.value?.name || user.value?.displayName || '';
  // editName.value = user.value?.name || ''; 
  // editGender.value = user.value?.gender || '';
  // // dobYear.value = user.value?.dobYear || 2000;
  // // dobMonth.value = user.value?.dobMonth || 1;
  // // dobDay.value = user.value?.dobDay || 1;

  // // If values exist, use them; otherwise, keep as empty string for blank selects
  // dobYear.value = user.value?.dobYear !== undefined ? user.value.dobYear : '';
  // dobMonth.value = user.value?.dobMonth !== undefined ? user.value.dobMonth : '';
  // dobDay.value = user.value?.dobDay !== undefined ? user.value.dobDay : '';
  editName.value = user.value?.name    ?? '';
  editGender.value  = user.value?.gender  ?? '';
  dobYear.value = user.value?.dobYear ?? '';
  dobMonth.value = user.value?.dobMonth ?? '';
  dobDay.value = user.value?.dobDay  ?? '';

});

async function saveProfileEdits() {
  // if (!user.value) return;
  // const updates = {
  //   displayName: editName.value,
  //   gender: editGender.value,
  //   dobYear: dobYear.value,
  //   dobMonth: dobMonth.value,
  //   dobDay: dobDay.value

  if (!user.value) return;
  // Calculate age right here for DB
  let age = '';
  if (dobYear.value && dobMonth.value && dobDay.value) {
    const today = new Date();
    age = today.getFullYear() - Number(dobYear.value);
    if (
      today.getMonth() + 1 < Number(dobMonth.value) ||
      (today.getMonth() + 1 === Number(dobMonth.value) && today.getDate() < Number(dobDay.value))
    ) {
      age--;
    }
  }

  const updates = {
    // displayName: editName.value,
    name: editName.value,  
    gender: editGender.value,
    dobYear: dobYear.value,
    dobMonth: dobMonth.value,
    dobDay: dobDay.value,
    // <-- change 27: adds age, bio and skill as  profile property
    age: age,
    bio: editBio.value,     
    skill: editSkill.value,
    // also write canonical `ranking` field so DB uses the authoritative attribute
    ranking: editSkill.value
  }

  // ensure ranking is derived from wins and not editable
  const derivedRanking = computeRankingFromWins(totalWins.value)
  updates.ranking = derivedRanking

  // change 21: Only send fields to save, including uid for path reference
    const userDbUpdate = {
      uid: user.value.uid,
      // displayName: updates.displayName,
      name: updates.name,   
      gender: updates.gender,
      dobYear: updates.dobYear,
      dobMonth: updates.dobMonth,
      dobDay: updates.dobDay,
      age: updates.age, // <-- Actually push age data to DB
      bio: updates.bio,      
      skill: updates.skill,
      ranking: updates.ranking,
      skill: updates.skill,
      ranking: updates.ranking
    };

    await saveUserToDatabase(userDbUpdate);

    // change 22: Update the reactive user.value fields manually
    Object.assign(user.value, updates);
    showEditProfile.value = false;

  // console.log('Saving gender:', editGender.value)
  // console.log('Full user object sent to DB:', { ...user.value, ...updates });
  // await saveUserToDatabase({ ...user.value, ...updates });
  // Object.assign(user.value, updates); // Update reactive profile
  // showEditProfile.value = false;
}



function initials(name) {
  if (!name) return 'A'
  return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
}

function onImgError(e) {
  // If the image fails (eg 429), try the seeded avatar API first, then fall back to initials
  try {
  const u = user.value
  const username = (u && (u.email ? u.email.split('@')[0] : (u.displayName || u.uid))) || 'anon'
  const fallback = `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`
    const img = e && e.target
    if (!img) return
    // avoid infinite loop: if already set to fallback, show initials
    if (img.src && img.src.includes('avatar.iran.liara.run')) {
      imgErrored.value = true
    } else {
      img.src = fallback
    }
  } catch (err) {
    imgErrored.value = true
  }
}

onMounted(() => {
  onUserStateChanged(async (currentUser) => {
    try {
      user.value = currentUser
      //change 20: removed saving user to database here to avoid overwriting profile edits
      // if (currentUser && currentUser.uid) await saveUserToDatabase(currentUser)
      // subscribe to live user record so followers/following counts update in real-time
      if (userListenerUnsub) { try { userListenerUnsub() } catch(e){} }
      if (currentUser && currentUser.uid) {
        // realtime subscription
        userListenerUnsub = onDataChange(`users/${currentUser.uid}`, (val) => {
          if (!val) { followingCount.value = 0; followersCount.value = 0; return }

          // //change 25: Update all user profile fields from DB
          // Object.assign(user.value, val); // <-- Loads gender, displayName etc. instantly!

          // IMPORTANT: Set the complete Firebase user profile into user.value
          user.value = { ...user.value, ...val };

          // Immediately hydrate the edit fields after loading Firebase data
          editName.value   = val.name    ?? '';
          editGender.value = val.gender  ?? '';
          dobYear.value    = val.dobYear ?? '';
          dobMonth.value   = val.dobMonth ?? '';
          dobDay.value     = val.dobDay  ?? '';
          editBio.value    = val.bio ?? '';      
          // prefer `ranking` field if present, fall back to legacy `skill`
          editSkill.value  = val.ranking ?? val.skill ?? '';

          
          followingCount.value = val.following ? Object.keys(val.following).length : 0
          followersCount.value = val.followers ? Object.keys(val.followers).length : 0
          // If the DB record is missing a ranking, compute it from wins and persist it
              try {
                // Normalize rankings for all users periodically (idempotent). This updates any missing
                // or stale `ranking` fields based on the flat win counters. To avoid running on every
                // page load, we throttle this to once per day using localStorage.
                ;(async () => {
                  try {
                    await normalizeAllUserRankingsOncePerDay()
                  } catch (e) {
                    console.error('Failed to normalize rankings across users', e)
                  }
                })()
              } catch (e) {
                console.error('Error while scheduling ranking normalization', e)
              }
        })
        // immediate fetch in case the realtime listener hasn't fired yet
        try {
          const users = await getDataFromFirebase('users')
          const me = users && users[currentUser.uid]
          if (me) {
            followingCount.value = me.following ? Object.keys(me.following).length : 0
            followersCount.value = me.followers ? Object.keys(me.followers).length : 0
          }
        } catch (e) {
          // ignore fetch error; realtime listener is still authoritative
        }
      }
    } catch (e) {
      console.error('Error in onUserStateChanged handler', e)
    }
  })
  // listen for local follow/unfollow events coming from Profile.vue
  window.addEventListener('user-follow-changed', onLocalFollowChanged)
})

// Normalize all users' ranking fields to the computed value derived from flat win fields.
// Throttled to once per day via localStorage to avoid excessive writes.
async function normalizeAllUserRankingsOncePerDay() {
  try {
    const last = Number(localStorage.getItem('rankNormalizeLastRun') || '0')
    const MS_PER_DAY = 24 * 60 * 60 * 1000
    if (Date.now() - last < MS_PER_DAY) return

    const users = await getDataFromFirebase('users')
    if (!users) return

    const updates = {}
    Object.entries(users).forEach(([uid, u]) => {
      const o = Number(u.openWins ?? 0)
      const i = Number(u.intermediateWins ?? 0)
      const p = Number(u.professionalWins ?? 0)
      const total = o + i + p
      let computed = 'Beginner'
      if (total > 40) computed = 'Professional'
      else if (total > 20) computed = 'Intermediate'
      const stored = u && u.ranking
      if (!stored || stored !== computed) {
        updates[`users/${uid}/ranking`] = computed
      }
    })

    if (Object.keys(updates).length > 0) {
      const db = getDatabase()
      await update(dbRef(db, '/'), updates)
    }

    localStorage.setItem('rankNormalizeLastRun', String(Date.now()))
  } catch (e) {
    console.error('normalizeAllUserRankingsOncePerDay error', e)
  }
}

onUnmounted(() => {
  try { window.removeEventListener('user-follow-changed', onLocalFollowChanged) } catch(e){}
  if (userListenerUnsub) { try { userListenerUnsub(); } catch(e){}; userListenerUnsub = null }
})

let popupTimer = null;

async function handleGoogleSignIn() {
  error.value = ''
  try {
    const result = await loginWithGoogle()
    user.value = result.user
    // Fetch DB record and only create if it doesn't exist
      const users = await getDataFromFirebase('users');
      const existingUser = users && users[result.user.uid];
      if (!existingUser) {
        await saveUserToDatabase(result.user); // Only create new record if NOT exists
      }
    //change 2: Show basketball popup on login
    // alert('Signed in with Google!')
    // Show basketball popup for 2.5 seconds
    showLoginPopup.value = true;
    // setTimeout(() => { showLoginPopup.value = false; }, 2500);
    popupTimer = setTimeout(() => {
      showLoginPopup.value = false;
    }, 2500);

  } catch (e) {
    error.value = 'Google sign-in failed'
    console.error(e)
  }
}
async function handleLogout() {
  try {
    await logout()
    user.value = null
    // cleanup listener
    if (userListenerUnsub) { try { userListenerUnsub(); } catch(e){}; userListenerUnsub = null }

    //change 8: Show logout animation popup
    // alert('Logged out.')
    // Show logout animation popup for 2.3 seconds
    showLogoutPopup.value = true;
    setTimeout(() => { showLogoutPopup.value = false; }, 2000);

  } catch (e) {
    error.value = 'Logout failed'
    console.error(e)
  }
}

// change 28: handle popup close on click
function handleClosePopup() {
  showLoginPopup.value = false;
  showLogoutPopup.value = false;
  // Optional: clear the auto timer if still active
  if (popupTimer) clearTimeout(popupTimer);
}

// Match statistics helpers (use flat camelCase win fields only)
const statsFromProfile = computed(() => {
  const u = user.value || {}
  const o = Number(u.openWins ?? 0)
  const i = Number(u.intermediateWins ?? 0)
  const p = Number(u.professionalWins ?? 0)
  return {
    // the chart code expects snake_case keys; keep those names but source from camelCase fields
    open_wins: o,
    intermediate_wins: i,
    professional_wins: p
  }
})

const totalWins = computed(() => {
  const s = statsFromProfile.value
  return s.open_wins + s.intermediate_wins + s.professional_wins
})

// Ranking rules (system-controlled):
// - >40 wins => Professional
// - >20 wins => Intermediate
// - otherwise => Beginner
function computeRankingFromWins(wins) {
  const n = Number(wins || 0)
  if (n > 40) return 'Professional'
  if (n > 20) return 'Intermediate'
  return 'Beginner'
}

const computedRanking = computed(() => computeRankingFromWins(totalWins.value))

// Keep stored ranking in sync: when totalWins crosses a threshold, update the DB so every uid has `ranking`.
// Avoid spamming writes by only saving when value actually changes.
let rankingWriteInProgress = false
watch(totalWins, async (newVal, oldVal) => {
  try {
    if (!user.value || !user.value.uid) return
    const newRank = computeRankingFromWins(newVal)
    const currentRank = user.value && user.value.ranking
    if (newRank !== currentRank && !rankingWriteInProgress) {
      rankingWriteInProgress = true
      // optimistic local update
      user.value = { ...(user.value || {}), ranking: newRank }
      // persist ranking to DB (saveUserToDatabase expects an object with uid)
      try {
        await saveUserToDatabase({ uid: user.value.uid, ranking: newRank })
      } catch (e) {
        console.error('Failed to persist ranking change', e)
      }
      rankingWriteInProgress = false
    }
  } catch (e) {
    rankingWriteInProgress = false
    console.error('Error computing/saving ranking', e)
  }
})

function barHeight(value) {
  // Compute proportional bar heights but cap them to the chart's available height
  // to avoid visual overflow when one value dominates.
  // Base padding for small bars, and maximum visible bar height inside the chart.
  const basePx = 30
  // Lower the max visible height to ensure bars never touch header or labels
  const maxVisiblePx = 160 // leave extra breathing room above/below bars

  const maxVal = Math.max(1, statsFromProfile.value.open_wins, statsFromProfile.value.intermediate_wins, statsFromProfile.value.professional_wins)
  const ratio = value / maxVal
  // soft-scale using square-root to reduce dominance of extremely large values while keeping proportions
  const scaled = Math.sqrt(ratio) // 0..1
  const px = Math.round(basePx + scaled * (maxVisiblePx - basePx))
  return `${px}px`
}

// animate bars on mount
const animateBars = ref(false)

// animated numeric displays for login page
const displayOpen = ref(0)
const displayIntermediate = ref(0)
const displayProfessional = ref(0)
let countsStarted = false
function animateCounts(duration = 700) {
  if (countsStarted) return
  countsStarted = true
  const start = performance.now()
  const targets = {
    o: statsFromProfile.value.open_wins,
    i: statsFromProfile.value.intermediate_wins,
    p: statsFromProfile.value.professional_wins
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }
  function step(now) {
    const t = Math.min(1, (now - start) / duration)
    const e = easeOutCubic(t)
    displayOpen.value = Math.round(targets.o * e)
    displayIntermediate.value = Math.round(targets.i * e)
    displayProfessional.value = Math.round(targets.p * e)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

onMounted(() => {
  setTimeout(() => { animateBars.value = true; }, 90)
})

watch(animateBars, (v) => { if (v) animateCounts() })
</script>

<template>
  <div class="container-fluid min-vh-100 bg-transparent d-flex align-items-center justify-content-center px-2" style="background: transparent;">


    <!-- change 3: Login success popup -->
    <!-- Login Success Popup Overlay -->
    <div v-if="showLoginPopup" class="login-popup-overlay"
    @click="handleClosePopup">
      <div class="login-popup-content">
        <!-- change 6: use dunk logo          -->
        <!-- <img :src="dunkLogo" alt="Dunk+ Logo" class="basketball-anim" /> -->

       <!-- Basketball shooting into hoop animation -->
      <div class="basketball-hoop-animation">
        <svg viewBox="0 0 200 110" width="500" height="150">
        <!-- Hoop (orange rim), now central -->
        <ellipse cx="100" cy="40" rx="40" ry="10" fill="#e67e22" stroke="#b3541a" stroke-width="6" />
        <!-- Backboard, now central -->
        <rect x="70" y="20" width="60" height="20" fill="#eee" stroke="#b3541a" stroke-width="4" />
        <!-- Net (centered under hoop) -->
        <line x1="90" y1="50" x2="90" y2="80" stroke="#fff" stroke-width="4" />
        <line x1="110" y1="50" x2="110" y2="80" stroke="#fff" stroke-width="4" />
        <line x1="100" y1="50" x2="100" y2="80" stroke="#fff" stroke-width="4" />
        <!-- Ball, centered and below hoop -->
        <circle id="basketball-ball" cx="100" cy="102" r="16" fill="#ffad1d" stroke="#b3541a" stroke-width="6" />
      </svg>

      </div>

        <h2 class="popup-title">Welcome, Champion!</h2>
        <p class="popup-text">You've signed in with Google</p>
      </div>
    </div>
    
    <!-- change 9: Logout success popup -->
    <!-- Logout Success Popup Overlay -->
    <div v-if="showLogoutPopup" class="login-popup-overlay" @click.self="handleClosePopup">
      <div class="login-popup-content">
        <img :src="dunkLogo" alt="Dunk+ Logo" class="basketball-anim" />
        <h2 class="popup-title">See You Next Time!</h2>
        <p class="popup-text">You have logged out.</p>
      </div>
    </div>


    <!-- Login UI -->
    <div v-if="!user" class="mx-auto" style="max-width:350px;">
      <button @click="handleGoogleSignIn" type="button"
        class="btn btn-outline-warning w-100 py-3 d-flex align-items-center justify-content-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
          <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
          <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
        </svg>
        <span class="fs-5 fw-semibold">Sign in with Google</span>
      </button>
      <p v-if="error" class="mt-2 text-danger small text-center">{{ error }}</p>
    </div>

    <!-- Profile screen -->
    <div v-else class="w-100 mx-auto text-white" style="max-width:700px;">
      <!-- Header -->
      <div class="mb-3">
        <h2 class="fw-bold text-warning mb-0" style="font-size:2.25rem;">My Profile</h2>
        <div class="mb-1 text-secondary" style="font-size:1.1rem;">View and manage your personal information.</div>
      </div>
      <!-- Avatar, name, email -->
      <div class="d-flex flex-column align-items-center mb-3">
        <div style="width:100px;height:100px;border-radius:50%;border:5px solid #FFAD1D;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          <img v-if="!imgErrored" :src="photoSrc" @error="onImgError" style="width:100%;height:100%;object-fit:cover;" alt="Profile"/>
          <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1f262b;color:#fff;font-weight:700;border-radius:50%;">
            {{ initials(user && user.displayName) }}
          </div>
        </div>

        <!-- change 19: enable username edit display -->
        <h3 class="fw-bold mb-0 mt-2" style="font-size:1.7rem;">{{ user.name || user.value?.displayName || 'Anonymous' }}</h3>

        <div style="color:#9CA3AF;font-size:1.1rem;">{{ user.email }}</div>
      </div>

      <!-- change 13: Edit Profile Button -->
      <div class="w-100 d-flex justify-content-center mb-3">
        <button
          class="btn btn-outline-warning px-4 py-2 rounded-pill fw-semibold"
          style="font-size:1.14rem; letter-spacing:0.5px;"
          @click="showEditProfile = true">
          Edit Profile
        </button>
      </div>
          <!-- Following & Followers -->
          <div class="row gx-3 justify-content-center mb-3">
            <div class="col-6 col-md-4">

              <!-- Step 2: Open Following Popup -->
              <button
                type="button"
                class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3"
                style="background:#181A20;"
                @click="openFollowing"
              >
                <Users :color="'#FFAD1D'" :size="22" class="me-2"/>
                Following ({{ followingCount }})
              </button>

            </div>
            <div class="col-6 col-md-4">
              <!-- Step 2: Open Followers Popup -->
              <button
                type="button"
                class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3"
                style="background:#181A20;"
                @click="openFollowers"
              >
                <Users :color="'#FFAD1D'" :size="22" class="me-2"/>
                Followers ({{ followersCount }})
              </button>

            </div>
          </div>

          <!-- Stats grid using flexbox for equal height cards with border -->
          <div class="row gx-3 gy-3 text-center mb-4">
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <!-- Icon (Ranking) -->
      <Trophy :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Ranking</span>
          <span class="badge bg-purple text-white mt-1" style="font-size:0.92rem;">{{ user.ranking || computedRanking }}</span>
    </div>
  </div>
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <Star :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Total Wins</span>
      <div class="fs-4 fw-semibold text-warning mt-1">{{totalWins}}</div>
    </div>
  </div>
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <Users :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Gender</span>
       <!-- change 16: enable gender updates -->
        <!-- <span class="fw-semibold text-warning mt-1">Male</span> -->
        <!-- <span class="fw-semibold text-warning mt-1">{{ user.gender || 'Not set' }}</span> -->
        <!-- <span class="fw-semibold text-warning mt-1">{{ user.value?.gender}}</span> -->
         <span class="fw-semibold text-warning mt-1">
            {{ (user.gender && user.gender !== '') ? user.gender : 'Not Set' }}
        </span>
    </div>

  </div>
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <Cake :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Age</span>
      <span class="fs-4 fw-semibold text-warning mt-1">
        <!-- {{ computedAge !== null ? computedAge : 'Not Set' }} -->
        {{ computedAge !== null ? computedAge : (user.age ?? 'Not Set') }}

      </span>
      <!-- change 17: enable age updates -->
      <!-- <span class="fs-4 fw-semibold text-warning mt-1">28</span> -->
      <!-- <span class="fs-4 fw-semibold text-warning mt-1">{{ computedAge }}</span> -->

      <!-- <span class="fs-4 fw-semibold text-warning mt-1"> -->
        <!-- Calculate age from DOB if available -->
        <!-- <template v-if="user.dobYear && user.dobMonth && user.dobDay">
          {{
            new Date().getFullYear() - user.dobYear -
            (new Date().getMonth() + 1 < user.dobMonth || 
            (new Date().getMonth() + 1 === user.dobMonth && new Date().getDate() < user.dobDay) ? 1 : 0)
          }}
        </template>
        <template v-else>
          Not Set
        </template>
      </span> -->

    </div>
  </div>
</div>

      <!-- Match Statistics -->
      <div class="mb-4 px-3">

    <div class="col-12 d-flex">
      <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
        <span class="fw-medium">Bio</span>
        <span class="fs-6 text-warning mt-1 text-center">{{ user.bio || 'No bio yet.' }}</span>
      </div>
    </div>

    <div class="col-12 d-flex">
      <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
        <span class="fw-medium">Skill / Badge</span>
      </div>
    </div>


    <div class="match-stats-card border rounded-3 p-3 mt-2">
          <div class="match-stats-header d-flex align-items-center mb-2">
            <ChartColumn :size="18" class="me-2 text-warning" />
            <h5 class="mb-0">Match Statistics</h5>
          </div>
          <p class="lead-text">You have a total of <span class="text-warning fw-semibold">{{ totalWins }}</span> wins across all skill levels. Here's the breakdown:</p>
          <div class="chart-grid-lines" aria-hidden="true"></div>
          <div class="stats-chart d-flex align-items-end justify-content-between">
            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: (statsFromProfile.open_wins > 0 ? (animateBars ? barHeight(statsFromProfile.open_wins) : '8px') : '4px'), background: (statsFromProfile.open_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (statsFromProfile.open_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '0ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.open_wins > 0 ? displayOpen : '' }}</div>
              <div class="bar-label">Open</div>
            </div>

            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: (statsFromProfile.intermediate_wins > 0 ? (animateBars ? barHeight(statsFromProfile.intermediate_wins) : '8px') : '4px'), background: (statsFromProfile.intermediate_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (statsFromProfile.intermediate_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '90ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.intermediate_wins > 0 ? displayIntermediate : '' }}</div>
              <div class="bar-label">Intermediate</div>
            </div>

            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: (statsFromProfile.professional_wins > 0 ? (animateBars ? barHeight(statsFromProfile.professional_wins) : '8px') : '4px'), background: (statsFromProfile.professional_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (statsFromProfile.professional_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '180ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.professional_wins > 0 ? displayProfessional : '' }}</div>
              <div class="bar-label">Professional</div>
            </div>
          </div>
        </div>

    <!-- add here -->
   

      </div>

      
      <!-- Logout button -->
      <div class="mt-4 px-3 mb-2">
        <button @click="handleLogout" type="button" class="btn btn-danger w-100 rounded-pill fs-5">
          Log Out
        </button>
        <p v-if="error" class="mt-2 text-danger small text-center">{{ error }}</p>
      </div>
    </div>


    <!-- change 13: Edit Profile Popup Modal -->
    <div v-if="showEditProfile" class="edit-profile-modal-overlay">
      <div class="edit-profile-modal-content">
        <h3 class="mb-3 text-warning">Edit Profile</h3>
        <!-- Username -->
        <div class="mb-2">
          <label class="form-label text-white mb-1">Username</label>
          <input v-model="editName" type="text" class="form-control" placeholder="Enter your name" />
        </div>
        <!-- Gender -->
        <div class="mb-2">
          <label class="form-label text-white mb-1">Gender</label>
          <select v-model="editGender" class="form-select" style="padding-right: 2.5rem;">
            <option disabled value="">Select gender...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <!-- <option value="Other">Other</option> -->
          </select>
        </div>
        <!-- DOB -->
        <div class="mb-2">
          <label class="form-label text-white mb-1">Date of Birth</label>
          <div class="d-flex gap-1">

            <select v-model="dobMonth" class="form-select">
            <option disabled value="">Month</option>
            <option v-for="(m, idx) in months" :key="idx" :value="idx+1">{{ m }}</option>
          </select>

          <select v-model="dobDay" class="form-select">
            <option disabled value="">Day</option>
            <option v-for="d in daysInMonth" :key="d" :value="d">{{ d }}</option>
          </select>

          <select v-model="dobYear" class="form-select">
            <option disabled value="">Year</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>

          </div>
        </div>
        <!-- Age (auto-calculated, shown for feedback) -->
        <div class="mt-2 text-warning small mb-2">Current Age: {{ computedAge }}</div>

        <!-- User Bio -->
        <div class="mb-2">
          <label class="form-label text-white mb-1">Bio</label>
          <textarea v-model="editBio" rows="2" class="form-control" placeholder="Write something about yourself..."></textarea>
        </div>

        <!-- Skill Badge -->
        <div class="mb-2">
          <label class="form-label text-white mb-1">Skill / Badge</label>
          <input v-model="editSkill" type="text" class="form-control" placeholder="Enter your skill or badge (e.g., Shooter, Defender)" />
        </div>


        <!-- Action Buttons -->
        <div class="d-flex gap-2 justify-content-center mt-3">
          <button class="btn btn-warning px-4" @click="saveProfileEdits">Save</button>
          <button class="btn btn-secondary px-4" @click="showEditProfile = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Followers Popup -->
    <div v-if="showFollowers" class="follow-popup-overlay" @click.self="closePopup">
      <div class="follow-popup-content">
        <div class="follow-popup-header">
          <h3>Followers</h3>
          <button class="close-btn" @click="closePopup">✕</button>
        </div>

        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search followers..."
          class="search-input"
        />

        <!-- <div class="follow-list">
          <div class="follow-item" v-for="f in filteredFollowers" :key="f.uid">
            <img
              :src="f.photoURL || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(f.email.split('@')[0])}`"
              class="avatar"
            />
            <div class="info">
              <div class="username">{{ f?.name || f?.email || 'Unknown User' }}</div>
              <div class="sub">{{ f.gender || 'User' }}</div>
            </div> -->

        <div class="follow-list">
          <div
            class="follow-item"
            v-for="f in filteredFollowers"
            :key="f.uid"
          >
            <!-- Make each box clickable using router-link -->
            <router-link
            :to="{ name: 'PublicProfile', params: { uid: f.uid } }"
            class="d-flex align-items-center w-100 text-decoration-none text-reset"
          >
            <img
              :src="f.photoURL || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(f.email.split('@')[0])}`"
              class="avatar"
            />
            <div class="info ms-2">
          <div class="username">{{ f.name || f.email }}</div>
          <div class="sub">{{ (f.ranking || f.skill || f.level || 'Beginner') + (f.gender ? (' ' + f.gender) : '') }}</div>
            </div>
          </router-link>
            <!-- <button class="remove-btn" @click="removeFollower(f.uid)">Remove</button> -->
             <button class="remove-btn" @click="confirmRemoveFollower(f.uid)">Remove</button>

          </div>
        </div>
      </div>
    </div>

    <!-- Step 4: Following Popup -->
    <div v-if="showFollowing" class="follow-popup-overlay" @click.self="closePopup">
      <div class="follow-popup-content">
        <div class="follow-popup-header">
          <h3>Following</h3>
          <button class="close-btn" @click="closePopup">✕</button>
        </div>

        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search following..."
          class="search-input"
        />

        <div class="follow-list">
          <div class="follow-item" v-for="f in filteredFollowing" :key="f.uid">
            <!-- Step 2: Clickable router-link to public profile -->
            <router-link
            :to="{ name: 'PublicProfile', params: { uid: f.uid } }"
            class="d-flex align-items-center w-100 text-decoration-none text-reset"
          >
            <img
              :src="f.photoURL || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(f.email.split('@')[0])}`"
              class="avatar"
            />
            <div class="info ms-2">
              <div class="username">{{ f.name || f.email }}</div>
              <div class="sub">{{ (f.ranking || f.skill || f.level || 'Beginner') + (f.gender ? (' ' + f.gender) : '') }}</div>
            </div>
          </router-link>

    <!-- Keep existing Unfollow button -->
    <button class="unfollow-btn" @click="confirmUnfollow(f.uid)">Unfollow</button>
  </div>
        </div>

      </div>
    </div>

    </div>

    <!-- Step 10: Aesthetic Confirmation Modal -->
<div v-if="showConfirmPopup" class="confirm-popup-overlay" @click.self="closeConfirmPopup">
  <div class="confirm-popup-content">
    <h2 class="popup-title">Confirm Action</h2>
    <p class="popup-text">{{ confirmMessage }}</p>
    <div class="popup-buttons">
      <button class="btn-confirm" @click="runConfirmAction()">Confirm</button>
      <button class="btn-cancel" @click="closeConfirmPopup">Cancel</button>
    </div>
  </div>
</div>
  
</template>

<style>
.bg-purple { background-color: #7133e2 !important; }
/* Rank badge colors */
.bg-beginner { background-color: #15803d !important; } /* slightly darker green */
.bg-intermediate { background-color: #ffb020 !important; } /* orange/yellow */
.skill-badge { display:inline-block; padding:0.18rem 0.6rem; border-radius:0.6rem; font-size:0.92rem; font-weight:600; }
.border-gray-600 { border-color: #50575e !important; }
.profile-stat-card {
  min-height: 140px;
  background: transparent !important;
}

    /* change 4: login success popup style */
    /* --- Login Success Animated Popup Styles --- */
    .login-popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(20,20,20,0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: pointer;
    }
    .login-popup-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #181a20;
      border-radius: 1.2rem;
      padding: 32px 46px;
      box-shadow: 0 8px 32px rgba(70, 40, 16, 0.18);
      text-align: center;
      color: #ffad1d;
      position: relative;
      animation: popup-fade-in 0.5s cubic-bezier(.68,-0.55,.27,1.55) both;
      cursor: default;
    }

    /* Step 11: Aesthetic Confirm Popup Styling */
    .confirm-popup-overlay {
      position: fixed;
      inset: 0;
      background: rgba(20, 20, 20, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 99999;
    }
    .confirm-popup-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #181a20;
      border-radius: 1.2rem;
      padding: 32px 48px;
      border: 2px solid #FFAD1D;
      text-align: center;
      color: #ffad1d;
      max-width: 340px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      animation: popup-fade-in 0.5s cubic-bezier(.68,-0.55,.27,1.55) both;
    }
    .popup-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 20px;
    }
    .btn-confirm {
      background: #FFAD1D;
      color: #181A20;
      padding: 8px 18px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }
    .btn-confirm:hover {
      background: #faca50;
    }
    .btn-cancel {
      background: #323B46;
      color: #FFD75C;
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      border: none;
    }
    .btn-cancel:hover {
      background: #3A4350;
    }
    .unfollow-btn {
      background: #3a3f47;
      color: #FFD75C;
      border: none;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    .unfollow-btn:hover {
      background: #4d5660;
    }


    @keyframes popup-fade-in {
      from { transform: scale(0.7); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .basketball-anim {
      width: 74px;
      height: 74px;
      margin-bottom: 16px;
      animation: bounce 1.2s cubic-bezier(.17,.67,.83,.67) infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      30% { transform: translateY(-20px); }
    }
    .popup-title {
      /* change 11: to decrease height between animation and title */
      margin-top: 0px;
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 8px;
      color: orange;
    }
    .popup-text {
      font-size: 1.15rem;
      color: #ffe6b3;
    }


    /* change 10:Animate ball shooting into hoop for login popup  */
    .basketball-hoop-animation {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 4px; 
        min-height: unset;
        width: 100%;
      }

    .basketball-hoop-animation svg {
      display: block;
      margin: 0 auto;            /* Makes SVG itself centered */
      }

    #basketball-ball {
      animation: shoot-ball 1.2s cubic-bezier(.68,-0.55,.27,1.55) forwards;
      }
    @keyframes shoot-ball {
      0%   { cy: 130; }
      60%  { cy: 60; }
      80%  { cy: 45; }
      100% { cy: 40; }
      }


      /* change 14: Edit Profile Modal Styles */
      .edit-profile-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(20, 20, 30, 0.93);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .edit-profile-modal-content {
        background: #181a20;
        border-radius: 1rem;
        box-shadow: 0 6px 32px rgba(70,40,16,0.20);
        padding: 34px 38px;
        min-width: 320px;
        max-width: 98vw;
        border: 2px solid #FFAD1D;
        text-align: left;
        color: #fff;
        animation: popup-fade-in 0.45s cubic-bezier(.68,-0.55,.27,1.55) both;
      }
      .edit-profile-modal-content label {
        font-weight: 500;
        font-size: 1.1rem;
      }
      .edit-profile-modal-content input, .edit-profile-modal-content select {
        background: #21242a;
        color: #FFD75C;
        border: 1px solid #31353A;
      }
      .edit-profile-modal-content .btn-warning {
        background: #FFAD1D !important;
        color: #181A20 !important;
      }
      .edit-profile-modal-content .btn-secondary {
        background: #323B46;
        color: #FFD75C;
      }


      /* Match statistics chart */
      .match-stats-card {
        background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02));
        border: 1px solid rgba(255,255,255,0.04);
        padding: 18px;
        position: relative;
        overflow: hidden;
      }
      .match-stats-card .lead-text { color: rgba(255,255,255,0.88); margin-bottom: 8px; font-size:0.98rem }

      .match-stats-grid {
        display:flex; gap:18px; align-items:center; justify-content:space-between; margin-top:6px;
      }

      .stats-chart { gap: 28px; align-items:flex-end; height:260px; padding-bottom:12px; display:flex }
      .chart-bar { flex: 1 1 0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; position:relative }

      .chart-grid-lines {
        position:absolute; left:18px; right:18px; top:18px; bottom:56px; pointer-events:none;
        background-image: linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 100% 44px;
        opacity:0.9;
      }

      .bar-fill {
        width: 60%;
        background: linear-gradient(180deg,#ffca6a,#ffad1d);
        border-radius: 8px 8px 4px 4px;
        transition: height 360ms cubic-bezier(.2,.9,.3,1);
        display:flex; align-items:flex-start; justify-content:center; padding-top:8px; box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      }

      .bar-value { color: #081017; font-weight:800; font-size:0.98rem; margin-bottom:6px }
      .bar-label { color:#9CA3AF; margin-top:10px; font-size:0.95rem }

      @media (max-width: 540px) {
        .stats-chart { height: 180px }
        .bar-fill { width: 72% }
      }
      /* Step 4: Followers/Following Popup Styling */
      .follow-popup-overlay {
        position: fixed;
        inset: 0;
        background: rgba(20,20,30,0.93);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
      }
      .follow-popup-content {
        width: 420px;
        max-height: 85vh;
        overflow-y: auto;
        background: #181a20;
        border-radius: 12px;
        border: 2px solid #FFAD1D;
        padding: 20px;
      }
      .follow-popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #FFAD1D;
        margin-bottom: 10px;
      }
      .search-input {
        width: 100%;
        background: #21242a;
        color: #FFD75C;
        border: 1px solid #30373d;
        padding: 6px 10px;
        border-radius: 6px;
        margin-bottom: 12px;
      }
      .follow-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .follow-item {
        display: flex;
        align-items: center;
        padding: 6px 8px;
        border-radius: 6px;
        background: #22272d;
      }
      .avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3px solid #FFAD1D;
        object-fit: cover;
      }
      .info { flex-grow: 1; margin-left: 10px; }
      .username { color: #fff; font-weight: 600; }
      .sub { color: #9ca3af; font-size: 0.85rem; }
      .remove-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
      }
      .remove-btn:hover { background: #c0392b; }
      .close-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 1.25rem;
        cursor: pointer;
      }



</style>
