<template>
  <div class="card-hand">
    <div class="card-hand-title">
      <span>手札 ({{ cards.length }}枚)</span>
    </div>
    <div class="card-hand-cards">
      <div
        v-for="(card, index) in cards"
        :key="`${card.suit}-${card.value}-${index}`"
        class="card-wrapper"
        :style="getCardStyle(index)"
      >
        <Card
          :card="card"
          :is-selected="isCardSelected(card)"
          :draggable="true"
          :is-dragging="isDraggingCard(card)"
          :compact="shouldUseCompactMode(index)"
          @click="handleCardClick(card)"
          @dragstart="handleCardDragStart(card)"
          @dragend="handleCardDragEnd"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Card from './Card.vue'
import type { Card as CardType } from '@/types/domain'

interface Props {
  cards: CardType[]
  selectedCards: CardType[]
}

interface Emits {
  (e: 'selectCard', card: CardType): void
  (e: 'deselectCard', card: CardType): void
  (e: 'dragStart', card: CardType): void
  (e: 'dragEnd'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const draggingCard = ref<CardType | null>(null)

// Determine if compact mode should be used
const shouldUseCompactMode = (index: number) => {
  const cardCount = props.cards.length
  // Use compact mode for overlapped cards (not the first card)
  return cardCount > 5 && index > 0
}

// Calculate card position style for overlapping
// Cards overlap more as count increases, showing only suit and value on right edge
const getCardStyle = (index: number) => {
  const cardCount = props.cards.length
  
  if (cardCount <= 5) {
    // Normal spacing for 5 or fewer cards
    return {
      position: 'relative' as const,
      zIndex: index
    }
  }
  
  // Calculate overlap offset based on card count
  // Show the external indicator (24px outside the card) + small gap
  const visibleWidth = 30 // Card overlap leaves 30px for indicator
  
  return {
    position: 'relative' as const,
    marginLeft: index === 0 ? '0' : `-${80 - visibleWidth}px`,
    zIndex: index
  }
}

const isCardSelected = (card: CardType): boolean => {
  return props.selectedCards.some(
    (c) => c.suit === card.suit && c.value === card.value
  )
}

const isDraggingCard = (card: CardType): boolean => {
  if (!draggingCard.value) return false
  return (
    draggingCard.value.suit === card.suit &&
    draggingCard.value.value === card.value
  )
}

const handleCardClick = (card: CardType) => {
  if (isCardSelected(card)) {
    emit('deselectCard', card)
  } else {
    emit('selectCard', card)
  }
}

const handleCardDragStart = (card: CardType) => {
  draggingCard.value = card
  emit('dragStart', card)
}

const handleCardDragEnd = () => {
  draggingCard.value = null
  emit('dragEnd')
}
</script>

<style scoped>
.card-hand {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 100%;
}

.card-hand-title {
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.card-hand-cards {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
  flex-wrap: nowrap;
  overflow: visible;
  padding-right: 30px;
}

.card-wrapper {
  flex-shrink: 0;
  transition: transform 0.2s ease, z-index 0s;
}

.card-wrapper:hover {
  transform: translateY(-12px);
  z-index: 1000 !important;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .card-hand {
    padding: 12px;
    gap: 8px;
  }

  .card-hand-title {
    font-size: 14px;
  }

  .card-hand-cards {
    min-height: 90px;
  }
}
</style>
