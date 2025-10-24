<template>
  <Sidebar />
  <router-view />
</template>

<script setup>
import Sidebar from './Sidebar.vue'
</script>

<style scoped>
#app {
  background-color: black;
  height: 100vh; /* Ensure it covers the whole viewport height */
}
</style>