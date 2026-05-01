<template>
  <div
    class="card"
    :class="[
      `card-${card.suit}`,
      { 'card-selected': isSelected },
      { 'card-public': card.isPublic },
      { 'card-dragging': isDragging },
      { 'card-compact': compact }
    ]"
    :draggable="draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
  >
    <div class="card-inner">
      <!-- Normal mode: Top left corner -->
      <div v-if="!compact" class="card-corner card-corner-top">
        <div class="card-value">{{ displayValue }}</div>
        <div class="card-suit" v-html="suitSymbol"></div>
      </div>

      <!-- Compact mode: Right edge indicator -->
      <div v-if="compact" class="card-compact-indicator">
        <div class="compact-value">{{ displayValue }}</div>
        <div class="compact-suit" v-html="suitSymbol"></div>
      </div>

      <!-- Center suit symbol (only in normal mode) -->
      <div v-if="!compact" class="card-center">
        <div class="card-suit-large" v-html="suitSymbol"></div>
      </div>

      <!-- Bottom right corner (rotated, only in normal mode) -->
      <div v-if="!compact" class="card-corner card-corner-bottom">
        <div class="card-value">{{ displayValue }}</div>
        <div class="card-suit" v-html="suitSymbol"></div>
      </div>

      <!-- Public indicator -->
      <div v-if="card.isPublic && !compact" class="card-public-indicator">
        <span>公開</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/types/domain'

interface Props {
  card: Card
  isSelected?: boolean
  draggable?: boolean
  isDragging?: boolean
  compact?: boolean
}

interface Emits {
  (e: 'click', card: Card): void
  (e: 'dragstart', card: Card): void
  (e: 'dragend'): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  draggable: true,
  isDragging: false,
  compact: false
})

const emit = defineEmits<Emits>()

// Display value (A, J, Q, K for special cards)
const displayValue = computed(() => {
  switch (props.card.value) {
    case 1:
      return 'A'
    case 11:
      return 'J'
    case 12:
      return 'Q'
    case 13:
      return 'K'
    default:
      return props.card.value.toString()
  }
})

// Suit symbol (Unicode characters)
const suitSymbol = computed(() => {
  switch (props.card.suit) {
    case 'hearts':
      return '♥'
    case 'diamonds':
      return '♦'
    case 'clubs':
      return '♣'
    case 'spades':
      return '♠'
    default:
      return ''
  }
})

const handleClick = () => {
  emit('click', props.card)
}

const handleDragStart = (event: DragEvent) => {
  if (!props.draggable) {
    event.preventDefault()
    return
  }
  emit('dragstart', props.card)
}

const handleDragEnd = () => {
  emit('dragend')
}
</script>

<style scoped>
.card {
  width: 80px;
  height: 112px;
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  user-select: none;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-selected {
  border-color: #3b82f6;
  border-width: 3px;
  transform: translateY(-8px);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
}

.card-dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.card-public {
  border-color: #f59e0b;
  background: #fffbeb;
}

.card-inner {
  width: 100%;
  height: 100%;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.card-corner-top {
  position: absolute;
  top: 8px;
  left: 8px;
}

.card-corner-bottom {
  position: absolute;
  bottom: 8px;
  right: 8px;
  transform: rotate(180deg);
}

.card-value {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.card-suit {
  font-size: 16px;
  line-height: 1;
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-suit-large {
  font-size: 48px;
  line-height: 1;
  opacity: 0.3;
}

/* Suit colors */
.card-hearts .card-value,
.card-hearts .card-suit,
.card-hearts .card-suit-large,
.card-diamonds .card-value,
.card-diamonds .card-suit,
.card-diamonds .card-suit-large {
  color: #dc2626;
}

.card-clubs .card-value,
.card-clubs .card-suit,
.card-clubs .card-suit-large,
.card-spades .card-value,
.card-spades .card-suit,
.card-spades .card-suit-large {
  color: #1f2937;
}

.card-public-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
}

/* Compact mode styles */
.card-compact {
  width: 80px;
  height: 112px;
}

.card-compact-indicator {
  position: absolute;
  top: 50%;
  right: -24px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: white;
  padding: 6px 4px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  border: 2px solid #333;
  z-index: 10;
}

.compact-value {
  font-size: 22px;
  font-weight: bold;
  line-height: 1;
}

.compact-suit {
  font-size: 20px;
  line-height: 1;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .card {
    width: 60px;
    height: 84px;
  }

  .card-compact {
    width: 60px;
    height: 84px;
  }

  .compact-value {
    font-size: 16px;
  }

  .compact-suit {
    font-size: 14px;
  }

  .card-value {
    font-size: 14px;
  }

  .card-suit {
    font-size: 12px;
  }

  .card-suit-large {
    font-size: 36px;
  }

  .card-public-indicator {
    font-size: 8px;
    padding: 1px 3px;
  }
}
</style>
