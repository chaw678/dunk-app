<template>
  <Teleport to="body">
    <div class="modal-portal-overlay" @click.self="$emit('overlay')">
      <div class="modal-portal-content">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineEmits(['overlay'])
</script>

<style scoped>
.modal-portal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8,10,12,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 12000;
  padding: 20px;
}
.modal-portal-content {
  width: 100%;
  max-width: 920px;
  max-height: calc(100vh - 40px);
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
