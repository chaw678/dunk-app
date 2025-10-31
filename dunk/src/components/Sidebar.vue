<template>
  <div>
    <!-- Sidebar with only toggle button at top -->
    <aside
      id="app-sidebar"
      class="sidebar"
      :class="{ collapsed }"
      :aria-hidden="false"
    >
      <div class="sidebar-inner">
        <!-- Toggle Button: top left, alone -->
        <div class="sidebar-header">
          <button
            class="toggle-btn"
            @click="toggle"
            aria-controls="app-sidebar"
            :aria-expanded="String(!props.collapsed)"
          >
            {{ props.collapsed ? '☰' : '✕' }}
          </button>
        </div>

        <nav class="nav-list" role="navigation" aria-label="Main">
          <router-link class="nav-item" to="/court-finder" active-class="router-link-active">
            <span class="icon" aria-hidden="true"><Grid2x2 /></span>
            <span class="label" v-show="!collapsed">Court Finder</span>
          </router-link>
          <router-link class="nav-item" to="/matches" active-class="router-link-active">
            <span class="icon" aria-hidden="true"><Trophy /></span>
            <span class="label" v-show="!collapsed">Matches</span>
          </router-link>
          <router-link class="nav-item" to="/forum" active-class="router-link-active">
            <span class="icon" aria-hidden="true"><MessageCircle /></span>
            <span class="label" v-show="!collapsed">Forum</span>
          </router-link>
        </nav>

        <div class="spacer"></div>

        <div class="bottom">
          <router-link class="nav-item" to="/login" active-class="router-link-active">
            <span class="icon" aria-hidden="true"><Users /></span>
            <span class="label" v-show="!collapsed">Profile</span>
          </router-link>
        </div>
      </div>
    </aside>
    <!-- Mobile backdrop: shown when sidebar is open (not collapsed) to dim and block background -->
    <div
      v-if="!collapsed"
      class="sidebar-backdrop"
      @click="toggle"
      aria-hidden="true"
    />
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { defineProps, defineEmits, watch, onBeforeUnmount } from 'vue'
import { Grid2x2, Trophy, Users, MessageCircle } from 'lucide-vue-next'

const props = defineProps({
  collapsed: { type: Boolean, default: false }
})
const emit = defineEmits(['update:collapsed'])

const router = useRouter()
const goLogin = () => router.push('/login')

function toggle() {
  emit('update:collapsed', !props.collapsed)
}

// Prevent background scrolling when sidebar overlays on mobile
const toggleBodyScroll = (disable) => {
  const cls = 'no-scroll'
  const root = document.documentElement
  const body = document.body
  if (disable) {
    root.classList.add(cls)
    body.classList.add(cls)
  } else {
    root.classList.remove(cls)
    body.classList.remove(cls)
  }
}

// Watch collapsed and apply no-scroll on small screens when open
const mq = window.matchMedia('(max-width: 720px)')
const syncScrollLock = () => {
  toggleBodyScroll(!props.collapsed && mq.matches)
}
watch(() => props.collapsed, syncScrollLock, { immediate: true })
mq.addEventListener?.('change', syncScrollLock)
onBeforeUnmount(() => {
  toggleBodyScroll(false)
  mq.removeEventListener?.('change', syncScrollLock)
})
</script>

<style scoped>
:root {
  --sidebar-width: 300px;
  --sidebar-collapsed-width: 72px;
  --main-dark: #091a28;
  --main-dark-gradient: linear-gradient(180deg, #071022 0%, #0b1118 100%);
  --main-orange: #ff9a3c;
  --main-yellow: #ffd59a;
}

/* sidebar outer */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: var(--sidebar-width);
  z-index: 80;
  display: flex;
  align-items: stretch;
  transition: width 0.3s ease;
  background: var(--main-dark);
  border-right: 2px solid rgba(255, 255, 255, 0.07);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

/* sidebar interior */
.sidebar-inner {
  width: 100%;
  background: var(--main-dark-gradient);
  color: #e6eef8;
  display: flex;
  flex-direction: column;
  padding: 0 18px 0 18px;
  height: 100%;
}

/* Top: just the toggle button now */
.sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 24px 0 20px 0;
  margin-bottom: 8px;
}

.toggle-btn {
  position: static;
  background: transparent;
  color: var(--main-yellow);
  border: 1px solid rgba(255, 255, 255, 0.10);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  backdrop-filter: blur(4px);
  margin-left: 0;
}

/* nav items */
.nav-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 10px;
  color: #e6eef8;
  text-decoration: none;
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.2s, color 0.2s;
}

.nav-item .icon {
  width: 28px;
  text-align: center;
  font-size: 16px;
  opacity: 0.95;
  flex-shrink: 0;
  margin-left: -6px;
}

.nav-item:hover {
  background: rgba(255, 154, 60, 0.06);
}

.router-link-active {
  background: linear-gradient(90deg, rgba(255,154,60,0.22), rgba(255,154,60,0.11));
  color: var(--main-yellow);
}

.spacer {
  flex: 1 1 auto;
}

.bottom {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  font-size: 16px;
}

/* Responsive: make sidebar act like a drawer on small-to-tablet screens */
@media (max-width: 1024px) {
  .sidebar {
    display: flex !important; /* ensure visible */
    visibility: visible !important;
    opacity: 1 !important;
    width: var(--sidebar-collapsed-width); /* compact by default */
    z-index: 150; /* above content and backdrop */
  }
  .sidebar:not(.collapsed) {
    width: 100vw; /* take full width when opened */
  }
  .sidebar-inner { padding: 0 14px; }
}

@media (max-width: 480px) {
  .sidebar {
    width: var(--sidebar-collapsed-width); /* keep compact */
  }
  .sidebar:not(.collapsed) {
    width: 100vw; /* full-width drawer when opened */
  }
}

/* Backdrop sits behind the sidebar on mobile when open */
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: #000; /* fully opaque so background doesn't show through */
  z-index: 140; /* below sidebar (150) but above content */
  display: none;
}
@media (max-width: 1024px) {
  .sidebar-backdrop { display: block; }
}
</style>