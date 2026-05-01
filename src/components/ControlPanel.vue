<template>
  <div class="control-panel-wrapper">
    <!-- Simple Dobo button -->
    <button class="dobo-button" @click="handleDoboClick">
      <span class="dobo-button-text">ドボン！</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Card, GamePhase } from '@/types/domain'

interface Props {
  phase: GamePhase
  handCards: Card[]
  fieldCard: Card | null
}

interface Emits {
  (e: 'drawCard'): void
  (e: 'declareDobo'): void
  (e: 'noReturn'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleDoboClick = () => {
  // System will auto-calculate all 4 formulas (+, -, *, /)
  // and check if any matches the field card
  // If match found: use that formula
  // If no match: penalty (burst-level payment)
  emit('declareDobo')
}
</script>

<style scoped>
.control-panel-wrapper {
  position: relative;
}

.dobo-button {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  font-size: 20px;
  font-weight: bold;
  padding: 16px 32px;
  border: 4px solid white;
  border-radius: 50px;
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  animation: pulse-glow 2s ease-in-out infinite;
  white-space: nowrap;
}

.dobo-button:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(251, 191, 36, 0.8);
}

.dobo-button:active {
  transform: scale(0.95);
}

.dobo-button-text {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8px 24px rgba(251, 191, 36, 0.6);
  }
  50% {
    box-shadow: 0 8px 32px rgba(251, 191, 36, 0.9);
  }
}

/* Landscape mobile optimization */
@media (max-width: 926px) and (orientation: landscape) {
  .dobo-button {
    font-size: 18px;
    padding: 14px 28px;
  }
}

/* Portrait fallback */
@media (max-width: 640px) and (orientation: portrait) {
  .dobo-button {
    font-size: 16px;
    padding: 12px 24px;
  }
}
</style>
