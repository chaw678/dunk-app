<template>
  <ModalPortal v-if="modelValue" @overlay="close">
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
  </ModalPortal>
</template>

<script setup>
import ModalPortal from './ModalPortal.vue'
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
.confirm-overlay { position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(24, 28, 35, 0.9); z-index:1200 }
.confirm-panel { background: linear-gradient(180deg, #0f1418 0%, #0c0f12 100%); padding: 36px 44px; border-radius: 12px; width: 720px; max-width: 94%; box-shadow: 0 12px 40px rgba(0,0,0,0.6); text-align: center; color: #fff; border: 1px solid rgba(255,154,60,0.15) }
.confirm-icon { width:86px; height:86px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin: 0 auto 12px; font-weight:700; font-size:36px }
.confirm-icon .check { background: rgba(255,154,60,0.12); color: #ff9a3c; width:86px; height:86px; display:flex; align-items:center; justify-content:center; border: 3px solid rgba(255,154,60,0.3); border-radius:50%; font-size:42px }
.confirm-icon.destructive .warn { background: rgba(239,68,68,0.12); color: #ef4444; width:86px; height:86px; display:flex; align-items:center; justify-content:center; border: 3px solid rgba(239,68,68,0.3); border-radius:50%; font-size:42px }
.confirm-title { font-size:28px; margin: 8px 0; font-weight:700; color: #ffffff }
.confirm-sub { color: #cbd6df; margin: 6px 0 18px; font-size:16px }
.confirm-actions { display:flex; gap:16px; justify-content:center; margin-top:16px }
.btn-cancel { background: rgba(255,255,255,0.05); color: #cbd6df; border: 1px solid rgba(255,255,255,0.1); padding: 12px 22px; border-radius:10px; min-width:120px; font-weight:600; cursor: pointer; transition: all 0.2s }
.btn-cancel:hover { background: rgba(255,255,255,0.08); color: #fff }
.btn-confirm { background: #ff9a3c; color:#0b0f12; border: none; padding: 12px 22px; border-radius:10px; min-width:120px; font-weight:700; cursor: pointer; transition: all 0.2s }
.btn-confirm:hover { background: #ffb366; transform: translateY(-1px) }
.btn-confirm.destructive { background: #ef4444; color: #fff }
.btn-confirm.destructive:hover { background: #f87171 }
@media (max-width:640px) {
  .confirm-panel { padding: 28px 20px; width: 92% }
  .confirm-icon, .confirm-icon .check, .confirm-icon .warn { width:68px; height:68px; font-size:32px }
  .confirm-title { font-size:22px }
  .confirm-sub { font-size: 14px }
  .confirm-actions { flex-direction: column; gap: 10px }
  .btn-cancel, .btn-confirm { width: 100%; min-width: auto }
}
</style>
