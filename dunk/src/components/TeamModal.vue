<template>
  <div class="modal-backdrop" v-if="show">
    <div class="modal">
      <!-- Step 1 -->
      <div v-if="step === 1">
        <h2>Create a New Team</h2>
        <input v-model="teamName" type="text" placeholder="Enter team name" />
        <div class="actions">
          <button @click="goToStep(2)" :disabled="!teamName">Next</button>
          <button class="cancel" @click="$emit('close')">Cancel</button>
        </div>
      </div>

      <!-- Step 2 -->
      <div v-else-if="step === 2">
        <h2>Choose a Team Icon</h2>
        <div class="emoji-grid">
          <span
            v-for="emoji in emojiOptions"
            :key="emoji"
            class="emoji-option"
            :class="{ selected: teamIcon === emoji }"
            @click="teamIcon = emoji"
          >
            {{ emoji }}
          </span>
        </div>
            

        <!-- Invite button -->
        <div class="invite-controls">
          <button class="invite-btn" @click="showInviteModal = true">👤➕ Invite +</button>
        </div>

        <!-- Invite Modal -->
        <div v-if="showInviteModal" class="modal-backdrop">
          <div class="modal">
            <h2>Invite Players</h2>
            <ul class="invite-list">
              <li v-for="player in inviteList" :key="player.id" class="invite-item">
                <span>{{ player.name }}</span>
                <button
                  class="invite-btn"
                  :disabled="invited.includes(player.name)"
                  @click="invite(player.name)"
                >
                  {{ invited.includes(player.name) ? 'Invited' : 'Invite to Team' }}
                </button>
              </li>
            </ul>
            <div class="actions">
              <button class="cancel" @click="showInviteModal = false">Close</button>
            </div>
          </div>
        </div>

        <div class="actions">
          <button @click="submit" :disabled="!teamIcon">Finish</button>
          <button class="cancel" @click="$emit('close')">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: { show: { type: Boolean, required: true } },
  data() {
    return {
      step: 1,
      teamName: '',
      teamIcon: '',
      emojiOptions: ['✨','🔥','⚡','🏀','🦁','🐻','🐺','🦅'],

      // Invite modal state
      showInviteModal: false,
      inviteList: [
        { id: 1, name: 'Zul_F' },
        { id: 2, name: 'David_L' },
        { id: 3, name: 'Aaron_T' }
      ],
      invited: []
    }
  },
  methods: {
    goToStep(step) {
      this.step = step
    },
    invite(name) {
      if (!this.invited.includes(name)) {
        this.invited.push(name)
      }
    },
    submit() {
      if (!this.teamName || !this.teamIcon) return
      this.$emit('create', {
        name: this.teamName,
        icon: this.teamIcon,
        members: this.invited
      })
      // reset state
      this.teamName = ''
      this.teamIcon = ''
      this.invited = []
      this.step = 1
      this.showInviteModal = false
    }
  }
}
</script>

<style scoped>
.invite-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}
.invite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .5rem;
  padding: .5rem;
  background: #0d1117;
  border: 1px solid #f97316;
  border-radius: 6px;
}
.invite-item span {
  color: #c9d1d9;
}
</style>