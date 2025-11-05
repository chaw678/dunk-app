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
          <router-link
            class="nav-item"
            to="/court-finder"
            active-class="router-link-active"
            :aria-label="'Court Finder'"
            :aria-describedby="props.collapsed && tooltipVisible ? tooltipId : null"
            @mouseenter="showTooltip($event, 'Court Finder')"
            @mousemove="updateTooltip($event)"
            @mouseleave="hideTooltip"
            @focusin="focusTooltip($event, 'Court Finder')"
            @focusout="hideTooltip"
          >
            <span class="icon" aria-hidden="true"><Grid2x2 /></span>
            <span class="label" v-show="!collapsed">Court Finder</span>
          </router-link>

          <router-link
            class="nav-item"
            to="/matches"
            active-class="router-link-active"
            :aria-label="'Matches'"
            :aria-describedby="props.collapsed && tooltipVisible ? tooltipId : null"
            @mouseenter="showTooltip($event, 'Matches')"
            @mousemove="updateTooltip($event)"
            @mouseleave="hideTooltip"
            @focusin="focusTooltip($event, 'Matches')"
            @focusout="hideTooltip"
          >
            <span class="icon" aria-hidden="true"><Trophy /></span>
            <span class="label" v-show="!collapsed">Matches</span>
          </router-link>

          <router-link
            class="nav-item"
            to="/leaderboard"
            active-class="router-link-active"
            :aria-label="'Leaderboard'"
            :aria-describedby="props.collapsed && tooltipVisible ? tooltipId : null"
            @mouseenter="showTooltip($event, 'Leaderboard')"
            @mousemove="updateTooltip($event)"
            @mouseleave="hideTooltip"
            @focusin="focusTooltip($event, 'Leaderboard')"
            @focusout="hideTooltip"
          >
            <span class="icon" aria-hidden="true"><Award /></span>
            <span class="label" v-show="!collapsed">Leaderboard</span>
          </router-link>

          <router-link
            class="nav-item"
            to="/forum"
            active-class="router-link-active"
            :aria-label="'Forum'"
            :aria-describedby="props.collapsed && tooltipVisible ? tooltipId : null"
            @mouseenter="showTooltip($event, 'Forum')"
            @mousemove="updateTooltip($event)"
            @mouseleave="hideTooltip"
            @focusin="focusTooltip($event, 'Forum')"
            @focusout="hideTooltip"
          >
            <span class="icon" aria-hidden="true"><MessageCircle /></span>
            <span class="label" v-show="!collapsed">Forum</span>
          </router-link>
        </nav>

        <div class="spacer"></div>

        <div class="bottom">
          <router-link
            class="nav-item"
            to="/login"
            active-class="router-link-active"
            :aria-label="'Profile'"
            :aria-describedby="props.collapsed && tooltipVisible ? tooltipId : null"
            @mouseenter="showTooltip($event, 'Profile')"
            @mousemove="updateTooltip($event)"
            @mouseleave="hideTooltip"
            @focusin="focusTooltip($event, 'Profile')"
            @focusout="hideTooltip"
          >
            <span class="icon" aria-hidden="true"><Users /></span>
            <span class="label" v-show="!collapsed">Profile</span>
          </router-link>
        </div>
      </div>
    </aside>
    <!-- floating tooltip that follows the mouse / keyboard focus -->
    <div
      v-if="tooltipVisible"
      :id="tooltipId"
      class="floating-tooltip"
      :class="{ flip: tooltipFlip }"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
      role="tooltip"
      aria-hidden="false"
    >
      {{ tooltipText }}
    </div>
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
import { Grid2x2, Trophy, Users, MessageCircle, Award } from 'lucide-vue-next'

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
import { ref } from 'vue'

const tooltipX = ref(0)
const tooltipY = ref(0)
const tooltipVisible = ref(false)
const tooltipText = ref('')
const tooltipFlip = ref(false)
const tooltipId = 'sidebar-tooltip'

function showTooltip(e, text) {
  // only show tooltips when the sidebar is collapsed
  if (!props.collapsed) return
  tooltipText.value = text
  tooltipVisible.value = true
  updateTooltip(e)
}

function updateTooltip(e) {
  if (!e) return
  // small offset so tooltip doesn't sit directly under the cursor
  const offset = 14
  // when moving via keyboard focus event, e.clientX/Y may be undefined
  if (e.clientX != null && e.clientY != null) {
    // prefer placing to the right; flip to left if near viewport edge
    const estWidth = 180 // estimated tooltip width in px
    const spaceRight = window.innerWidth - (e.clientX + offset)
    if (spaceRight < estWidth) {
      tooltipFlip.value = true
      tooltipX.value = e.clientX - offset
    } else {
      tooltipFlip.value = false
      tooltipX.value = e.clientX + offset
    }
    tooltipY.value = e.clientY
  } else if (e.currentTarget) {
    // fallback to element rect for focus events
    const rect = e.currentTarget.getBoundingClientRect()
    const offset = 12
    const estWidth = 180
    const spaceRight = window.innerWidth - (rect.right + offset)
    if (spaceRight < estWidth) {
      tooltipFlip.value = true
      tooltipX.value = rect.left - offset
    } else {
      tooltipFlip.value = false
      tooltipX.value = rect.right + offset
    }
    tooltipY.value = rect.top + rect.height / 2
  }
}

function focusTooltip(e, text) {
  if (!props.collapsed) return
  tooltipText.value = text
  tooltipVisible.value = true
  updateTooltip(e)
}

function hideTooltip() {
  tooltipVisible.value = false
}

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
  /* Make sidebar sit above glass cards and ensure opaque background */
  z-index: 220;
  display: flex;
  align-items: stretch;
  transition: width 0.3s ease;
  /* Match match-card background so sidebar feels cohesive with the matches UI */
  background: linear-gradient(180deg,#0f1418 0%, #0d1114 100%);
  background-color: #0f1418; /* solid fallback */
  border-right: 2px solid rgba(255, 255, 255, 0.07);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

/* sidebar interior */
.sidebar-inner {
  width: 100%;
  /* Match match-card background gradient inside the sidebar container too */
  background: linear-gradient(180deg,#0f1418 0%, #0d1114 100%);
  background-color: #0f1418;
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
  position: relative;
  padding: 12px 10px;
  color: #e6eef8;
  text-decoration: none;
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.2s, color 0.2s;
}

/* tooltip that appears when sidebar is collapsed and icon is hovered or focused */
.tooltip {
  /* start hidden but positioned for animation */
  display: block; /* allow layout but keep invisible via opacity */
  opacity: 0;
  pointer-events: none;
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%) translateX(-6px);
  background: linear-gradient(180deg, rgba(17,21,25,0.98), rgba(19,21,23,0.98));
  color: #fff; /* high contrast white for readability */
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 6px 20px rgba(3,7,14,0.6);
  white-space: nowrap;
  z-index: 999;
  border: 1px solid rgba(255,255,255,0.06);
  transition: opacity 160ms ease, transform 160ms ease;
}
.tooltip::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid rgba(19,21,23,0.98);
}

/* show tooltip on hover or keyboard focus (both collapsed & expanded) */
.nav-item:hover .tooltip,
.nav-item:focus-within .tooltip {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
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

/* floating tooltip that follows the mouse */
.floating-tooltip {
  position: fixed;
  left: 0;
  top: 0;
  transform: translateY(-50%) translateX(0);
  background: linear-gradient(180deg, rgba(17,21,25,0.98), rgba(19,21,23,0.98));
  color: var(--main-yellow);
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 8px 30px rgba(3,7,14,0.6);
  z-index: 9999;
  border: 1px solid rgba(255,255,255,0.06);
  pointer-events: none; /* don't block hover events */
  white-space: nowrap;
  transition: opacity 120ms ease, transform 120ms ease;
}

.floating-tooltip.flip {
  /* move the tooltip to the left of the cursor/element when flipped */
  transform: translateY(-50%) translateX(-100%);
}

</style>