<template>
  <div class="deck-display" :class="{ 'deck-clickable': canDraw }" @click="handleDeckClick">
    <div class="deck-title">
      <span>山札</span>
    </div>
    <div class="deck-stack" :class="thicknessClass">
      <div
        v-for="layer in displayLayers"
        :key="layer"
        class="deck-layer"
        :style="{ transform: `translateY(-${layer * 2}px) translateX(${layer}px)` }"
      >
        <div class="deck-card-back">
          <div class="deck-pattern"></div>
        </div>
      </div>
    </div>
    <div class="deck-count">
      <span>残り {{ remainingCards }}枚</span>
    </div>
    
    <!-- Draw button overlay (only visible when it's player's turn) -->
    <div v-if="canDraw" class="draw-overlay">
      <button class="draw-button" @click.stop="handleDeckClick">引く</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  remainingCards: number
  canDraw?: boolean
}

interface Emits {
  (e: 'draw'): void
}

const props = withDefaults(defineProps<Props>(), {
  canDraw: false
})

const emit = defineEmits<Emits>()

const handleDeckClick = () => {
  if (props.canDraw) {
    emit('draw')
  }
}

// Calculate thickness class based on remaining cards
const thicknessClass = computed(() => {
  if (props.remainingCards > 30) return 'deck-thick'
  if (props.remainingCards > 15) return 'deck-medium'
  if (props.remainingCards > 5) return 'deck-thin'
  return 'deck-very-thin'
})

// Calculate number of layers to display (visual effect)
const displayLayers = computed(() => {
  if (props.remainingCards > 30) return 8
  if (props.remainingCards > 15) return 5
  if (props.remainingCards > 5) return 3
  return Math.max(1, props.remainingCards)
})
</script>

<style scoped>
.deck-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  position: relative;
}

.deck-title {
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.deck-stack {
  position: relative;
  width: 80px;
  height: 112px;
}

.deck-layer {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.3s ease;
}

.deck-card-back {
  width: 80px;
  height: 112px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  border: 2px solid #1e293b;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.deck-pattern {
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1) 0px,
    rgba(255, 255, 255, 0.1) 10px,
    transparent 10px,
    transparent 20px
  );
}

.deck-count {
  background: rgba(255, 255, 255, 0.9);
  color: #1e40af;
  font-size: 14px;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 12px;
}

.deck-clickable {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.deck-clickable:hover {
  transform: scale(1.05);
}

.deck-clickable:active {
  transform: scale(0.98);
}

.draw-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
}

.draw-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 14px;
  font-weight: bold;
  padding: 6px 12px;
  border: 2px solid white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.6);
  cursor: pointer;
  pointer-events: auto;
  animation: pulse 1.5s ease-in-out infinite;
  white-space: nowrap;
}

.draw-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: scale(1.05);
}

.draw-button:active {
  transform: scale(0.95);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.6);
  }
  50% {
    box-shadow: 0 2px 12px rgba(16, 185, 129, 0.9);
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .deck-title {
    font-size: 14px;
  }

  .deck-stack {
    width: 60px;
    height: 84px;
  }

  .deck-card-back {
    width: 60px;
    height: 84px;
  }

  .deck-count {
    font-size: 12px;
    padding: 4px 10px;
  }
}
</style>
