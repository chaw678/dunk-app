<template>
  <div class="team-detail">
    <h1 class="team-title">{{ team?.name }}</h1>
    <p class="team-record">Record: {{ team?.record }}</p>
    <p class="team-next">Next Match: {{ team?.next }}</p>

    <h2>Members</h2>
    <ul class="members-list">
      <li v-for="(member, index) in team?.members || []" :key="index">
        {{ member }}
      </li>
    </ul>

    <RouterLink to="/teams">
      <button class="back-btn">← Back to Teams</button>
    </RouterLink>
  </div>
</template>

<script>
import { listenToFirebase } from '../firebase/firebase'

export default {
  data() {
    return {
      team: null
    }
  },
  mounted() {
    const teamId = this.$route.params.id
    listenToFirebase(`teams/${teamId}`, (data) => {
      this.team = data
    })
  }
}
</script>

<style scoped>
.team-detail {
  background-color: #0d1117;
  color: #c9d1d9;
  padding: 2rem;
  border-radius: 10px;
  max-width: 600px;
  margin: 2rem auto;
}

.team-title {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #f97316;
}

.team-record,
.team-next {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #8b949e;
}

.members-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.members-list li {
  background: #161b22;
  padding: 0.6rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  border: 1px solid #f97316;
}

.back-btn {
  margin-top: 2rem;
  background-color: #f97316;
  border: none;
  padding: 0.6rem 1.2rem;
  color: white;
  cursor: pointer;
  border-radius: 999px;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.back-btn:hover {
  background-color: #fb923c;
}
</style>