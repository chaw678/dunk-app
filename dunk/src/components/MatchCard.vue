<!-- MatchCard.vue -->
<template>
    <div :class="['card', 'match-card', 'h-100', 'text-reset', 'text-decoration-none', isHost ? 'host-match' : '']">
        <div class="card-header match-card-header">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <h3 class="match-title mb-1">{{ match.title }}</h3>
                    <div class="match-people text-warning fw-bold small">
                        <i class="bi bi-people-fill me-1"></i> {{ displayedPlayersCount }}/{{ match.maxPlayers || 10 }}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <template v-if="isHost">
                        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center" @click.prevent="$emit('invite', match)">
                            <i class="bi bi-person-plus me-1"></i>Invite
                        </button>
                        <button type="button" class="btn btn-danger btn-sm d-flex align-items-center" @click.prevent="$emit('delete', match)">
                            <i class="bi bi-trash me-1"></i>Delete
                        </button>
                    </template>
                    <template v-else-if="isJoined">
                        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center" @click.prevent="$emit('invite', match)">
                            <i class="bi bi-person-plus me-1"></i>Invite
                        </button>
                    </template>
                </div>
            </div>
        </div>
        <div class="card-body d-flex flex-column h-100 p-4">
            <!-- Rest of match card content -->
            <slot></slot>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    match: { type: Object, required: true },
    isHost: { type: Boolean, default: false },
    isJoined: { type: Boolean, default: false },
    displayedPlayersCount: { type: Number, required: true }
})
</script>

<style scoped>
/* You can move relevant styles from Matches.vue here */
</style>