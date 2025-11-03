<template>
  <div class="top-logo" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
      <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
      <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
    </svg>
  </div>
</template>

<script setup>
// simple, stateless logo component
</script>

<style scoped>
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
</style>
