<template>
  <div class="opponent-hand" :class="{ 'opponent-hand-current': isCurrentPlayer }">
    <div class="opponent-info">
      <div class="opponent-name-section">
        <span class="opponent-name">{{ playerName }}</span>
        <span v-if="isCurrentPlayer" class="current-indicator">●</span>
      </div>
      <span class="opponent-card-count">{{ totalCards }}枚</span>
    </div>
    
    <!-- Card display -->
    <div class="opponent-cards">
      <!-- Private cards (stacked back) -->
      <div v-if="privateCardCount > 0" class="card-group">
        <div class="card-back-mini"></div>
        <span class="card-count-badge">×{{ privateCardCount }}</span>
      </div>
      
      <!-- Public cards (all visible, overlapped) -->
      <div v-if="publicCards.length > 0" class="public-cards-container">
        <div
          v-for="(card, index) in publicCards"
          :key="`public-${index}`"
          class="public-card-mini"
          :class="getSuitColorClass(card)"
          :style="getCardStyle(index, publicCards.length)"
        >
          <div class="mini-card-content">
            <span class="mini-card-value">{{ getCardDisplay(card) }}</span>
            <span class="mini-card-suit">{{ getSuitSymbol(card) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card as CardType } from '@/types/domain'

interface Props {
  playerName: string
  cards: CardType[]
  isCurrentPlayer?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isCurrentPlayer: false
})

const publicCards = computed(() => props.cards.filter((c) => c.isPublic))
const privateCardCount = computed(() => props.cards.filter((c) => !c.isPublic).length)
const totalCards = computed(() => props.cards.length)

// Calculate card position style (overlap cards)
const getCardStyle = (index: number, total: number) => {
  // Overlap cards more when there are many cards
  let offsetX = 6 // Default offset
  if (total > 10) offsetX = 4
  if (total > 13) offsetX = 3
  
  return {
    transform: `translateX(${index * offsetX}px)`,
    zIndex: index
  }
}

const getCardDisplay = (card: CardType): string => {
  switch (card.value) {
    case 1: return 'A'
    case 11: return 'J'
    case 12: return 'Q'
    case 13: return 'K'
    default: return card.value.toString()
  }
}

const getSuitSymbol = (card: CardType): string => {
  switch (card.suit) {
    case 'hearts': return '♥'
    case 'diamonds': return '♦'
    case 'clubs': return '♣'
    case 'spades': return '♠'
    default: return ''
  }
}

const getSuitColorClass = (card: CardType): string => {
  return (card.suit === 'hearts' || card.suit === 'diamonds') ? 'card-red' : 'card-black'
}
</script>

<style scoped>
.opponent-hand {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.opponent-hand-current {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
}

.opponent-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.opponent-name-section {
  display: flex;
  align-items: center;
  gap: 6px;
}

.opponent-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.current-indicator {
  color: #fbbf24;
  font-size: 12px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.opponent-card-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 13px;
  white-space: nowrap;
}

.opponent-cards {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 40px;
}

.card-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-back-mini {
  width: 28px;
  height: 40px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  border: 1px solid #1e293b;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.card-count-badge {
  color: white;
  font-size: 13px;
  font-weight: 700;
}

.public-cards-container {
  display: flex;
  position: relative;
  align-items: center;
}

.public-card-mini {
  width: 28px;
  height: 40px;
  background: white;
  border: 1px solid #333;
  border-radius: 4px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.public-card-mini:hover {
  transform: translateY(-4px) !important;
  z-index: 100 !important;
}

.mini-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 2px;
  padding: 2px;
}

.mini-card-value {
  font-size: 11px;
  font-weight: bold;
  line-height: 1;
}

.mini-card-suit {
  font-size: 10px;
  line-height: 1;
}

.card-red .mini-card-value,
.card-red .mini-card-suit {
  color: #dc2626;
}

.card-black .mini-card-value,
.card-black .mini-card-suit {
  color: #1f2937;
}

/* Landscape mobile optimization */
@media (max-width: 926px) and (orientation: landscape) {
  .opponent-hand {
    padding: 8px 10px;
    gap: 6px;
  }

  .opponent-name {
    font-size: 12px;
    max-width: 80px;
  }

  .opponent-card-count {
    font-size: 11px;
    padding: 2px 8px;
  }

  .card-back-mini {
    width: 24px;
    height: 34px;
  }

  .public-card-mini {
    width: 24px;
    height: 34px;
  }

  .mini-card-value {
    font-size: 10px;
  }

  .mini-card-suit {
    font-size: 9px;
  }
}

/* Portrait fallback */
@media (max-width: 640px) and (orientation: portrait) {
  .opponent-hand {
    padding: 6px 8px;
  }

  .opponent-name {
    font-size: 11px;
    max-width: 60px;
  }

  .opponent-card-count {
    font-size: 10px;
    padding: 2px 6px;
  }

  .card-back-mini {
    width: 22px;
    height: 32px;
  }

  .public-card-mini {
    width: 22px;
    height: 32px;
  }

  .mini-card-value {
    font-size: 9px;
  }

  .mini-card-suit {
    font-size: 8px;
  }
}
</style>
