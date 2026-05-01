<template>
  <div
    class="dobo-display"
    :class="{ 'dobo-display-return': isReturn }"
    :style="stackStyle"
  >
    <div class="dobo-header">
      <div class="dobo-player-info">
        <span class="dobo-player">{{ playerName }}</span>
        <span class="dobo-label">{{ isReturn ? '返しドボン！' : 'ドボン！' }}</span>
      </div>
    </div>

    <div class="dobo-cards">
      <Card
        v-for="(card, index) in cards"
        :key="`dobo-${index}`"
        :card="card"
        :draggable="false"
      />
    </div>

    <div class="dobo-formula">
      <span class="formula-text">{{ formula }}</span>
      <span class="formula-equals">=</span>
      <span class="formula-result">{{ result }}</span>
    </div>

    <!-- Target player (who got dobo'd) -->
    <div v-if="targetPlayerName" class="dobo-target">
      <span class="target-text">{{ targetPlayerName }}さんが{{ isReturn ? '返された' : 'ドボンされた' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from './Card.vue'
import type { Card as CardType } from '@/types/domain'

interface Props {
  playerName: string
  cards: CardType[]
  formula: string
  result: number
  isReturn?: boolean
  targetPlayerName?: string
  stackIndex?: number
  totalStack?: number
}

const props = withDefaults(defineProps<Props>(), {
  isReturn: false,
  targetPlayerName: undefined,
  stackIndex: 0,
  totalStack: 1
})

// Calculate stacking style (diagonal overlay on top of previous card)
const stackStyle = computed(() => {
  const index = props.stackIndex
  
  if (index === 0) {
    // First dobo card - normal position (relative)
    return {
      position: 'relative' as const,
      zIndex: 1,
    }
  } else {
    // Return dobo cards - stack on top with rotation (absolute)
    const rotation = 5 + index * 3 // Rotate more for each return
    const translateX = index * 20 // Shift right slightly
    const translateY = index * 15 // Shift down slightly to create stacking effect
    
    return {
      position: 'absolute' as const,
      top: '0',
      left: '0',
      transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
      zIndex: index + 1,
    }
  }
})
</script>

<style scoped>
.dobo-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.6);
  border: 2px solid #fff;
  max-width: 280px;
  animation: slamDown 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.dobo-display-return {
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.6);
}

@keyframes slamDown {
  0% {
    opacity: 0;
    transform: translateY(-200px) rotate(-20deg) scale(0.7);
  }
  60% {
    transform: translateY(10px) rotate(3deg) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotate(0deg) scale(1);
  }
}

.dobo-header {
  display: flex;
  justify-content: center;
}

.dobo-player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.dobo-player {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.dobo-label {
  background: white;
  color: #f59e0b;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 8px;
}

.dobo-display-return .dobo-label {
  color: #ec4899;
}

.dobo-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  justify-content: center;
  padding: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
}

.dobo-formula {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: white;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
}

.formula-text {
  color: #1f2937;
}

.formula-equals {
  color: #6b7280;
}

.formula-result {
  color: #f59e0b;
  font-size: 18px;
}

.dobo-display-return .formula-result {
  color: #ec4899;
}

.dobo-target {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.target-text {
  color: white;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
}

/* Landscape mobile optimization */
@media (max-width: 926px) and (orientation: landscape) {
  .dobo-display {
    max-width: 300px;
    padding: 10px;
    gap: 6px;
  }

  .dobo-player {
    font-size: 14px;
  }

  .dobo-label {
    font-size: 11px;
    padding: 2px 8px;
  }

  .dobo-cards {
    gap: 3px;
    padding: 6px;
  }

  .dobo-formula {
    gap: 6px;
    padding: 6px;
    font-size: 14px;
  }

  .formula-result {
    font-size: 18px;
  }

  .target-text {
    font-size: 10px;
  }
}
</style>
