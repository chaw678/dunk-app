

<template>
  <div>
    <!-- Toggle Button: always visible -->
    <button
      class="toggle-btn"
      @click="toggle"
      aria-controls="app-sidebar"
      :aria-expanded="String(!props.collapsed)"
    >
      {{ props.collapsed ? '☰' : '✕' }}
    </button>

    <!-- Sidebar -->
    <aside
      id="app-sidebar"
      class="sidebar"
      :class="{ collapsed }"
      :aria-hidden="false"
    >
      <div class="sidebar-inner">
        <!-- brand removed: logo and app name are shown in the topbar (App.vue) -->

        <nav class="nav-list" role="navigation" aria-label="Main">
          <router-link class="nav-item" to="/court-finder">
            <span class="icon" aria-hidden="true"><Grid2x2 /></span>
            <span class="label" v-show="!collapsed">Court Finder</span>
          </router-link>

          <router-link class="nav-item" to="/matches">
            <span class="icon" aria-hidden="true"><Trophy /></span>
            <span class="label" v-show="!collapsed">Matches</span>
          </router-link>

          <router-link class="nav-item" to="/teams">
            <span class="icon" aria-hidden="true"><Users /></span>
            <span class="label" v-show="!collapsed">Users</span>
          </router-link>

          <router-link class="nav-item" to="/news">
            <span class="icon" aria-hidden="true"><Globe /></span>
            <span class="label" v-show="!collapsed">Global News</span>
          </router-link>

          <router-link class="nav-item" to="/skills">
            <span class="icon" aria-hidden="true"><ChartLine /></span>
            <span class="label" v-show="!collapsed">Skills Challenge</span>
          </router-link>
        </nav>

        <div class="spacer"></div>

        <div class="bottom">
          <button class="login-btn" @click="goLogin">
            <span class="login-icon"></span>
            <span class="login-label" v-show="!collapsed">Login  <LogIn />
</span>
          </button>

 
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { Grid2x2, Trophy, Users, Globe, ChartLine, LogIn } from 'lucide-vue-next'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  collapsed: { type: Boolean, default: false }
})
const emit = defineEmits(['update:collapsed'])

const router = useRouter()
const goLogin = () => router.push('/login')

function toggle() {
  emit('update:collapsed', !props.collapsed)
}
</script>

<style scoped>
:root {
  --sidebar-width: 300px;
  --sidebar-collapsed-width: 72px;
}

.toggle-btn {
  position: fixed;
  left: 12px;
  top: 12px;
  z-index: 90;
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  backdrop-filter: blur(4px);
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: var(--sidebar-width);
  max-width: 92vw;
  z-index: 80;
  display: flex;
  align-items: stretch;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-inner {
  width: 100%;
  background: linear-gradient(180deg, #071022 0%, #0b1118 100%);
  color: #e6eef8;
  display: flex;
  flex-direction: column;
  padding: 20px 18px;
  transition: padding 0.3s ease;
}

.sidebar.collapsed .sidebar-inner {
  padding: 20px 8px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  justify-content: flex-start; /* default left align */

  /* Add this to reverse logo and text order */
  flex-direction: row-reverse;
}

.logo {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
}

.brand-text {
  font-weight: 700;
  font-size: 18px;
  color: #ffd59a;
  white-space: nowrap;
  overflow: hidden;
}

.brand-text .plus {
  color: #ff9a3c;
  margin-left: 4px;
}

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
  color: #d7e3f6;
  text-decoration: none;
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item .icon {
  width: 28px;
  text-align: center;
  font-size: 16px;
  opacity: 0.95;
  flex-shrink: 0;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.02);
}

.router-link-active {
  background: linear-gradient(
    90deg,
    rgba(255, 154, 60, 0.12),
    rgba(255, 154, 60, 0.06)
  );
  color: #fff;
}

.spacer {
  flex: 1 1 auto;
}

.bottom {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-btn {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  background: transparent;
  border: none;
  color: #d7e3f6;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 8px;
  white-space: nowrap;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.02);
}

.issue-badge {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 74, 74, 0.12);
  color: #fff;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 13px;
}

.badge-letter {
  background: #ff4a4a;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
}
</style>
