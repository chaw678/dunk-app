<template>
  <div class="page-bg">
    <div class="card">
      <h1 class="card-title">Teams</h1>
      <p class="card-desc">Browse user teams, rosters, and stats.</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.page-bg {
  min-height: 100vh;
  padding: 40px 0;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.card {
  background: #181c23;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.22), 0 1.5px 3px rgba(36,45,55,0.16);
  padding: 32px 38px 44px 38px;
  color: #dde3ea;
  max-width: 900px;
  width: 90vw;
}

.card-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: orange;
  margin-bottom: 2px;
  letter-spacing: -1px;
}

.card-desc {
  font-size: 1.18rem;
  color: #a2aec3;
  margin-bottom: 36px;
  margin-top: 4px;
  letter-spacing: 0.1px;
}
</style>
