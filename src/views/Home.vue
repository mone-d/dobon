<template>
  <div class="home">
    <div class="home-header">
      <h1 class="home-title">Dobon Game - ゲームボードプレビュー</h1>
      <div class="home-controls">
        <button @click="togglePhase" class="phase-button">
          フェーズ切替: {{ currentPhase }}
        </button>
        <button @click="toggleDoboDisplay" class="dobo-button">
          ドボン表示切替
        </button>
      </div>
    </div>

    <!-- Game Board -->
    <GameBoard
      :opponents="sampleOpponents"
      :player-hand="sampleHand"
      :field-card="sampleFieldCard"
      :deck-count="deckCount"
      :multiplier="multiplier"
      :game-phase="currentPhase"
      :dobo-displays="showDobo ? sampleDoboDisplays : []"
      :can-draw-card="canDrawCard"
      :last-player-name="lastPlayerName"
      @select-card="handleSelectCard"
      @deselect-card="handleDeselectCard"
      @draw-card="handleDrawCard"
      @declare-dobo="handleDeclareDobo"
      @no-return="handleNoReturn"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameBoard from '@/components/GameBoard.vue'
import type { Card as CardType, GamePhase } from '@/types/domain'

// Sample opponents (8 players max)
const sampleOpponents = ref([
  {
    id: 'opponent1',
    name: 'プレイヤー2',
    cards: [
      { suit: 'hearts' as const, value: 3 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 4 as const, isPublic: false },
      { suit: 'clubs' as const, value: 13 as const, isPublic: true },
      { suit: 'spades' as const, value: 8 as const, isPublic: true },
    ],
    isCurrentPlayer: false,
  },
  {
    id: 'opponent2',
    name: 'プレイヤー3',
    cards: [
      { suit: 'hearts' as const, value: 5 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 6 as const, isPublic: false },
      { suit: 'clubs' as const, value: 7 as const, isPublic: false },
    ],
    isCurrentPlayer: true,
  },
  {
    id: 'opponent3',
    name: 'プレイヤー4 (13枚全オープン)',
    cards: [
      { suit: 'hearts' as const, value: 1 as const, isPublic: true },
      { suit: 'hearts' as const, value: 2 as const, isPublic: true },
      { suit: 'hearts' as const, value: 3 as const, isPublic: true },
      { suit: 'diamonds' as const, value: 4 as const, isPublic: true },
      { suit: 'diamonds' as const, value: 5 as const, isPublic: true },
      { suit: 'diamonds' as const, value: 6 as const, isPublic: true },
      { suit: 'clubs' as const, value: 7 as const, isPublic: true },
      { suit: 'clubs' as const, value: 8 as const, isPublic: true },
      { suit: 'clubs' as const, value: 9 as const, isPublic: true },
      { suit: 'spades' as const, value: 10 as const, isPublic: true },
      { suit: 'spades' as const, value: 11 as const, isPublic: true },
      { suit: 'spades' as const, value: 12 as const, isPublic: true },
      { suit: 'spades' as const, value: 13 as const, isPublic: true },
    ],
    isCurrentPlayer: false,
  },
  {
    id: 'opponent4',
    name: 'プレイヤー5',
    cards: [
      { suit: 'hearts' as const, value: 1 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 2 as const, isPublic: false },
    ],
    isCurrentPlayer: false,
  },
  {
    id: 'opponent5',
    name: 'プレイヤー6',
    cards: [
      { suit: 'hearts' as const, value: 4 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 5 as const, isPublic: false },
      { suit: 'clubs' as const, value: 6 as const, isPublic: false },
      { suit: 'spades' as const, value: 7 as const, isPublic: false },
    ],
    isCurrentPlayer: false,
  },
  {
    id: 'opponent6',
    name: 'プレイヤー7',
    cards: [
      { suit: 'hearts' as const, value: 8 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 9 as const, isPublic: false },
      { suit: 'clubs' as const, value: 10 as const, isPublic: false },
    ],
    isCurrentPlayer: false,
  },
  {
    id: 'opponent7',
    name: 'プレイヤー8',
    cards: [
      { suit: 'hearts' as const, value: 11 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 12 as const, isPublic: false },
      { suit: 'clubs' as const, value: 13 as const, isPublic: true },
    ],
    isCurrentPlayer: false,
  },
])

// Sample player hand (13 cards scenario)
const sampleHand = ref<CardType[]>([
  { suit: 'hearts', value: 1, isPublic: false },
  { suit: 'hearts', value: 2, isPublic: false },
  { suit: 'diamonds', value: 3, isPublic: false },
  { suit: 'diamonds', value: 4, isPublic: false },
  { suit: 'clubs', value: 5, isPublic: false },
  { suit: 'clubs', value: 6, isPublic: false },
  { suit: 'spades', value: 7, isPublic: false },
  { suit: 'spades', value: 8, isPublic: false },
  { suit: 'hearts', value: 9, isPublic: true },
  { suit: 'diamonds', value: 10, isPublic: true },
  { suit: 'clubs', value: 11, isPublic: true },
  { suit: 'spades', value: 12, isPublic: true },
  { suit: 'hearts', value: 13, isPublic: true },
])

// Sample field card
const sampleFieldCard = ref<CardType>({
  suit: 'hearts',
  value: 12,
  isPublic: false,
})

// Deck count
const deckCount = ref(35)

// Multiplier
const multiplier = ref(3)

// Can draw card (player's turn)
const canDrawCard = ref(true)

// Last player who played the field card
const lastPlayerName = ref('プレイヤー2')

// Game phase
const currentPhase = ref<GamePhase>('playing')

// Show dobo display
const showDobo = ref(false)

// Sample dobo displays (with return dobo scenario)
const sampleDoboDisplays = ref([
  {
    playerName: 'プレイヤー2',
    cards: [
      { suit: 'hearts' as const, value: 3 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 4 as const, isPublic: false },
      { suit: 'clubs' as const, value: 5 as const, isPublic: false },
    ],
    formula: '3 + 4 + 5',
    result: 12,
    isReturn: false,
    targetPlayerName: 'プレイヤー3',
  },
  {
    playerName: 'プレイヤー4',
    cards: [
      { suit: 'hearts' as const, value: 2 as const, isPublic: false },
      { suit: 'diamonds' as const, value: 5 as const, isPublic: false },
      { suit: 'clubs' as const, value: 5 as const, isPublic: false },
    ],
    formula: '2 + 5 + 5',
    result: 12,
    isReturn: true,
    targetPlayerName: 'プレイヤー2',
  },
])

const togglePhase = () => {
  if (currentPhase.value === 'playing') {
    currentPhase.value = 'return-dobo'
  } else {
    currentPhase.value = 'playing'
  }
}

const toggleDoboDisplay = () => {
  showDobo.value = !showDobo.value
}

const handleSelectCard = (card: CardType) => {
  console.log('Card selected:', card)
}

const handleDeselectCard = (card: CardType) => {
  console.log('Card deselected:', card)
}

const handleDrawCard = () => {
  alert('山札から引く')
}

const handleDeclareDobo = () => {
  alert('ドボン宣言！システムが自動計算します')
  showDobo.value = true
}

const handleNoReturn = () => {
  alert('返さない')
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #0f172a;
}

.home-header {
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.home-title {
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.home-controls {
  display: flex;
  gap: 12px;
}

.phase-button,
.dobo-button {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.phase-button:hover,
.dobo-button:hover {
  background: #2563eb;
  transform: scale(1.05);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .home-header {
    padding: 12px;
    flex-direction: column;
    align-items: stretch;
  }

  .home-title {
    font-size: 18px;
    text-align: center;
  }

  .home-controls {
    flex-direction: column;
  }

  .phase-button,
  .dobo-button {
    width: 100%;
  }
}
</style>
