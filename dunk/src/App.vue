<template>
  <div id="app" 
  
  >
    <!-- Sidebar receives v-model:collapsed so App controls layout -->
    <Sidebar v-model:collapsed="collapsed" />

    <!-- Backdrop for mobile overlay -->
    <div v-if="!collapsed" class="mobile-backdrop" @click="collapsed = true" />

    <!-- Topbar (logo + title + actions) aligned with main content -->
    <header class="topbar" :class="{ collapsed }"
      :style="{ '--sidebar-current-width': collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }">
      <div class="topbar-inner">
        <div class="brand-left">
          <div class="top-logo" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
              <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
              <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
            </svg>
          </div>
          <div class="top-title">Dunk+</div>
        </div>
        <div class="top-actions">
          <button class="create-btn">＋ Create Match</button>
        </div>
      </div>
    </header>

    <!-- Main content shifts/expands depending on sidebar collapsed state -->
    <!-- <main :class="['main-content', { 'collapsed': collapsed }]"
      :style="{ '--sidebar-current-width': collapsed ? '0px' : 'var(--sidebar-width)', '--topbar-height': '72px' }"> -->
    <div :class="[ 'main-content', {'collapsed': collapsed}]" :style="{ '--sidebar-current-width': collapsed ? '0px' : 'var(--sidebar-width)' }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'


const collapsed = ref(false)
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background: black;
  /* app background */
  color: #fff;
}

.main-content {
  min-width: 0;
  transition: margin-left 0.25s ease, padding 0.25s ease;
  padding: 40px 24px; 
  margin-left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  background: #000;
  overflow-x: hidden;
}

.main-content.collapsed {
  /* fallback for older browsers */
  margin-left: calc(var(--sidebar-collapsed-width));
}

/* Ensure the router-view content stacks properly */
main {
  box-sizing: border-box
}

.mobile-backdrop {
  display: none;
}

@media (max-width: 720px) {
  .mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 85;
  }
}

/* Topbar styling */
.topbar {
  position: fixed;
  left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  right: 0;
  height: 72px;
  display: flex;
  align-items: center;
  z-index: 70;
  padding: 0 24px;
  background: transparent;
  transition: left 0.25s ease;
}

.topbar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%
}

.brand-left {
  display: flex;
  gap: 10px;
  align-items: center
}

.top-logo {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffb14d
}

.top-logo svg {
  width: 28px;
  height: 28px
}

.top-title {
  color: orange;
  font-size: 1.6rem;
  font-weight: 800
}

.create-btn {
  background: #ff9a3c;
  color: #111;
  padding: 10px 16px;
  border-radius: 8px;
  border: none
}

@media (max-width:720px) {
  .topbar {
    left: 0
  }
}
</style>
