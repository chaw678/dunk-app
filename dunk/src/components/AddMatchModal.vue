<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2 class="modal-title">Create a New Match</h2>
      <p class="modal-desc">Fill in the details below to organize a new game.</p>

      <form @submit.prevent="createMatch">
        <label>Match Title</label>
        <input type="text" v-model="matchTitle" placeholder="e.g., Weekend Hoops" />

        <label>Court</label>
            <p class="court-display">{{ courtName }}</p>

        <label>Date</label>
        <input type="date" v-model="matchDate" />

        <label>Time</label>
        <input type="time" v-model="matchTime" />

        <label>Match Type (Skill Level)</label>
        <select v-model="matchType">
          <option value="Open">Open</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <button type="submit" class="create-btn">Create Match</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { pushDataToFirebase } from '../firebase/firebase'
import { ref } from 'vue'

const props = defineProps({
  courtName: String
})
const matchTitle = ref('')
const matchDate = ref('')
const matchTime = ref('')
const matchType = ref('Open')

const emit = defineEmits(['close'])

const closeModal = () => {
  emit('close')
}

const createMatch = async () => {
  const newMatch = {
    title: matchTitle.value,
    court: props.courtName, // Use prop directly!
    date: matchDate.value,
    time: matchTime.value,
    type: matchType.value,
    createdAt: new Date().toISOString()
  }

  try {
    await pushDataToFirebase('matches', newMatch)
    alert('Match created and saved to Firebase!')
    closeModal()
  } catch (error) {
    alert('Failed to save match: ' + error.message)
  }
}
</script>


<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(24, 28, 35, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #2c323a;
  padding: 32px;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  color: #dde3ea;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
}

.modal-title {
  font-size: 1.8rem;
  color: orange;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 1rem;
  color: #a2aec3;
  margin-bottom: 24px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  font-weight: bold;
  font-size: 0.95rem;
}

input,
select {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background-color: #3a404a;
  color: #dde3ea;
  font-size: 0.95rem;
}

.create-btn {
  background-color: orange;
  color: #181c23;
  font-weight: bold;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.create-btn:hover {
  background-color: #ffa733;
}
</style>