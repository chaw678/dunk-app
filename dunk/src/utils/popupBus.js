import { reactive } from 'vue'

const state = reactive({
  visible: false,
  message: '',
  type: 'success'
})

export default {
  show(message = '', type = 'success') {
    state.message = String(message || '')
    state.type = type
    state.visible = true
  },
  close() {
    state.visible = false
  },
  state
}
