<template>
  <div class="team-card">
    <div class="team-icon">{{ team.icon }}</div>
    <h2 class="team-name">{{ team.name }}</h2>
    <p class="team-record">Record: {{ team.record }}</p>
    <p class="team-next">Next: {{ team.next }}</p>

    <div class="actions">
      <RouterLink :to="`/team/${team.id}`">
        <button>View Team</button>
      </RouterLink>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    team: { type: Object, required: true }
  }
}
</script>

<style scoped>
.team-card {
  background-color: #161b22;
  color: #c9d1d9;
  border: 1px solid #f97316;
  border-radius: 10px;
  padding: 1rem;
  width: 250px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease;
}
.team-card:hover {
  transform: scale(1.02);
}
.team-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.team-name {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 0.3rem;
}
.team-record,
.team-next {
  font-size: 1rem;
  margin-bottom: 0.2rem;
  color: #8b949e;
}
.actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}
button {
  background-color: #f97316;
  border: none;
  padding: 0.6rem 1.2rem;
  color: white;
  cursor: pointer;
  border-radius: 999px;
  font-weight: 600;
  transition: background-color 0.2s ease;
}
button:hover {
  background-color: #fb923c;
}
</style>