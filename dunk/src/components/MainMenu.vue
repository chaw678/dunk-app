<template>
  <div class="main-menu page">
    <h1>Welcome to Dunk</h1>
    <p>This is the main landing page. Use the sidebar to navigate.</p>
    <div class="mt-4">
      <!-- <button @click="addTestCourt" :disabled="loading" class="btn btn-warning"> -->
        <!-- {{ loading ? 'Saving...' : 'Add test court' }}
      </button> -->
      <div v-if="result" class="mt-2 text-success">Saved court: {{ result.key }}</div>
      <div v-if="error" class="mt-2 text-danger">Error: {{ error }}</div>
    </div>
  </div>
</template>



<style scoped>
.page { padding: 24px; color: #fff }
</style>

