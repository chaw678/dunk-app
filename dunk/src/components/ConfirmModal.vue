<template>
  <div v-if="modelValue" class="confirm-overlay" @click.self="close">
    <div class="confirm-panel">
      <div class="confirm-icon" :class="destructive ? 'destructive' : ''" aria-hidden>
        <span v-if="!destructive" class="check">✓</span>
        <span v-else class="warn">!</span>
      </div>
      <h2 class="confirm-title">{{ title }}</h2>
      <p class="confirm-sub" v-if="message">{{ message }}</p>
      <div class="confirm-actions">
        <template v-if="primaryFirst">
          <button class="btn-confirm" :class="destructive ? 'destructive' : ''" @click="confirmAction">{{ confirmLabel }}</button>
          <button class="btn-cancel" @click="close">{{ cancelLabel }}</button>
        </template>
        <template v-else>
          <button class="btn-cancel" @click="close">{{ cancelLabel }}</button>
          <button class="btn-confirm" :class="destructive ? 'destructive' : ''" @click="confirmAction">{{ confirmLabel }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'OK' },
  cancelLabel: { type: String, default: 'Cancel' },
  destructive: { type: Boolean, default: false }
  ,
  // When true, render the primary (confirm) button before the cancel button
  primaryFirst: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function close() {
  emit('update:modelValue', false)
}

function confirmAction() {
  emit('confirm')
  emit('update:modelValue', false)
}

const icon = computed(() => (props.destructive ? '!' : '✓'))
</script>

<style scoped>
.confirm-overlay { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.6); z-index:1200 }
.confirm-panel { background: #071021; padding: 36px 44px; border-radius: 12px; width: 720px; max-width: 94%; box-shadow: 0 12px 40px rgba(2,6,23,0.7); text-align: center; color: #fff }
.confirm-icon { width:86px; height:86px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin: 0 auto 12px; font-weight:700; font-size:36px }
.confirm-icon .check { background: transparent; color: #10b981; width:86px; height:86px; display:flex; align-items:center; justify-content:center; border: 4px solid rgba(16,185,129,0.12); border-radius:50%; font-size:42px }
.confirm-icon.destructive .warn { background: transparent; color: #f97373; width:86px; height:86px; display:flex; align-items:center; justify-content:center; border: 4px solid rgba(249,115,115,0.12); border-radius:50%; font-size:42px }
.confirm-title { font-size:28px; margin: 8px 0; font-weight:700 }
.confirm-sub { color: rgba(255,255,255,0.75); margin: 6px 0 18px; font-size:16px }
.confirm-actions { display:flex; gap:16px; justify-content:center; margin-top:16px }
.btn-cancel { background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.06); padding: 12px 22px; border-radius:10px; min-width:120px }
.btn-confirm { background: #10b981; color:#062018; border: none; padding: 12px 22px; border-radius:10px; min-width:120px; font-weight:600 }
.btn-confirm.destructive { background: #ef4444; color: #fff }
@media (max-width:640px) {
  .confirm-panel { padding: 22px; width: 92% }
  .confirm-icon, .confirm-icon .check, .confirm-icon .warn { width:68px; height:68px; font-size:32px }
  .confirm-title { font-size:20px }
}
</style>
