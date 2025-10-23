<template>
  <div v-if="visible" class="popup-overlay" @click="onOverlayClick">
    <div class="popup-content">
      <div class="popup-icon" :style="{background: type === 'success' ? '#4CAF50' : '#e04747'}">{{ type === 'success' ? '✓' : '✕' }}</div>
      <h3>{{ type === 'success' ? 'Success' : 'Error' }}</h3>
      <p class="popup-message">{{ message }}</p>
      <button class="popup-btn" @click="close">Close</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  modelValue: Boolean,
  message: String,
  type: { type: String, default: 'success' }
})
const emit = defineEmits(['update:modelValue'])
const visible = ref(props.modelValue || false)

function close() {
  visible.value = false
  emit('update:modelValue', false)
}

function onOverlayClick(e) {
  if (e.target === e.currentTarget) close()
}
</script>

<style scoped>
.popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(24, 28, 35, 0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200;
}
.popup-content {
  background: #2c323a; color: #dde3ea; padding: 28px; border-radius: 12px; width: 100%; max-width: 420px; text-align:center;
}
.popup-icon { width: 56px; height:56px; border-radius:50%; margin:0 auto 12px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:28px }
.popup-message { margin-bottom:18px }
.popup-btn { background: orange; color:#181c23; border:none; padding:8px 18px; border-radius:6px; font-weight:600 }
</style>
