<template>
  <div class="player-room-root">
    <!-- Player-specific view rendered inside MatchRoom via nested route -->
    <!-- Keep minimal: parent MatchRoom will hide host-only controls when this route is active -->
    <div class="player-view-banner">You are viewing the player-only view.</div>
  </div>
</template>

<script setup>
// Minimal placeholder for player-only nested route.
</script>

<style scoped>
.player-room-root { padding: 12px 18px; text-align: center; }
.player-view-banner { background: rgba(255,255,255,0.02); color: #ffd98a; padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.03); font-weight:700 }

/* Responsive adjustments for collapsed sidebar */
.collapsed .player-room-root {
  padding-left: 8px;
  padding-right: 8px;
}

@media (max-width: 1100px) {
  .collapsed .player-room-root { 
    padding-left: 6px; 
    padding-right: 6px; 
  }
}

@media (max-width: 720px) {
  .collapsed .player-room-root { 
    padding-left: 4px; 
    padding-right: 4px; 
  }
}
</style>
