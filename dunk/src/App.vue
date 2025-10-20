<template>
  <div id="app">
    <!-- Sidebar receives v-model:collapsed so App controls layout -->
    <Sidebar v-model:collapsed="collapsed" />

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
      </div>
    </header>

    <!-- Main content shifts/expands depending on sidebar collapsed state -->
    <div :class="['main-content', {'collapsed': collapsed}]" 
         :style="{ '--sidebar-current-width': collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }">
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
  color: #fff;
}
@font-face {
  font-family: SuperShiny;
  src: url(./assets/SuperShiny.ttf); 
}

.main-content {
  min-width: 0;
  transition: margin-left 0.25s ease, padding 0.25s ease;
  padding: 40px 24px; 
  margin-left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  background: #000;
  overflow-x: hidden;
  padding-top: 112px; /* Add space for topbar */
}

.main-content.collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

/* Ensure the router-view content stacks properly */
main {
  box-sizing: border-box;
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
  padding: 0 32px;
  background: linear-gradient(90deg, rgba(11, 11, 11, 0.9) 70%, rgba(0,0,0,0.4) 100%);
  box-shadow: 0 2px 16px 0 rgba(12, 18, 28, 0.14);
  backdrop-filter: blur(8px);
  transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.topbar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.topbar .top-title{
  margin-top: 3px;
  margin-left: -5px;
  transform: scale(1.6); /* makes text appear 30% larger */
  transform-origin: left center; /* so it doesn’t shift weirdly */
  font-family: SuperShiny;
}

.brand-left {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: -8px;
}

.top-logo {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffb14d;
}

.top-logo svg {
  width: 28px;
  height: 28px;
}

.top-title {
  color: orange;
  font-size: 1.6rem;
  font-weight: 800;
}

.create-btn {
  background: #ff9a3c;
  color: #111;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
}

/* Mobile styles - Keep sidebar visible but adjust layout */
@media (max-width: 720px) {
  /* Topbar stays aligned with sidebar */
  .topbar {
    left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  }
  
  /* Main content still respects sidebar width */
  .main-content {
    margin-left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  }
  
  .main-content.collapsed {
    margin-left: var(--sidebar-collapsed-width);
  }
  
  /* Optional: reduce padding on mobile */
  .main-content {
    padding: 24px 16px;
    padding-top: 96px;
  }
}
</style>