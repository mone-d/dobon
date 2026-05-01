<template>
  <div class="game-board">
    <!-- Left side: Opponents -->
    <div class="left-side">
      <div class="opponents-area">
        <OpponentHand
          v-for="opponent in opponents"
          :key="opponent.id"
          :player-name="opponent.name"
          :cards="opponent.cards"
          :is-current-player="opponent.isCurrentPlayer"
        />
      </div>
    </div>

    <!-- Right side: Top (Field info) + Bottom (Player hand) -->
    <div class="right-side">
      <!-- Top area: Field info -->
      <div class="top-area">
        <!-- Field info group (shifts left when dobo occurs) -->
        <div class="field-info-group">
          <div class="deck-area">
            <DeckDisplay :remaining-cards="deckCount" :can-draw="canDrawCard" @draw="handleDrawCard" />
          </div>
          <div class="field-area">
            <FieldCard
              :field-card="fieldCard"
              :multiplier="multiplier"
              :last-player-name="lastPlayerName"
              @drop="handleDrop"
            />
          </div>
        </div>

        <!-- Dobo display area (appears when dobo occurs) -->
        <div v-if="hasDobo" class="dobo-area">
          <div class="dobo-stack">
            <DoboDisplay
              v-for="(dobo, index) in doboDisplays"
              :key="index"
              :player-name="dobo.playerName"
              :cards="dobo.cards"
              :formula="dobo.formula"
              :result="dobo.result"
              :is-return="dobo.isReturn"
              :target-player-name="dobo.targetPlayerName"
              :stack-index="index"
              :total-stack="doboDisplays.length"
            />
          </div>
        </div>
      </div>

      <!-- Bottom area: Player hand -->
      <div class="bottom-area">
        <CardHand
          :cards="playerHand"
          :selected-cards="selectedCards"
          @select-card="handleSelectCard"
          @deselect-card="handleDeselectCard"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
        />
      </div>
    </div>

    <!-- Control panel (floating button) -->
    <div class="control-panel-wrapper">
      <ControlPanel
        :phase="gamePhase"
        :hand-cards="playerHand"
        :field-card="fieldCard"
        @draw-card="handleDrawCard"
        @declare-dobo="handleDeclareDobo"
        @no-return="handleNoReturn"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import OpponentHand from './OpponentHand.vue'
import DeckDisplay from './DeckDisplay.vue'
import FieldCard from './FieldCard.vue'
import DoboDisplay from './DoboDisplay.vue'
import CardHand from './CardHand.vue'
import ControlPanel from './ControlPanel.vue'
import type { Card, GamePhase } from '@/types/domain'

interface OpponentData {
  id: string
  name: string
  cards: Card[]
  isCurrentPlayer?: boolean
}

interface DoboDisplayData {
  playerName: string
  cards: Card[]
  formula: string
  result: number
  isReturn: boolean
  targetPlayerName?: string
}

interface Props {
  opponents: OpponentData[]
  playerHand: Card[]
  fieldCard: Card | null
  deckCount: number
  multiplier: number
  gamePhase: GamePhase
  doboDisplays: DoboDisplayData[]
  canDrawCard?: boolean
  lastPlayerName?: string
}

interface Emits {
  (e: 'selectCard', card: Card): void
  (e: 'deselectCard', card: Card): void
  (e: 'dragStart', card: Card): void
  (e: 'dragEnd'): void
  (e: 'drop'): void
  (e: 'drawCard'): void
  (e: 'declareDobo'): void
  (e: 'noReturn'): void
}

const props = withDefaults(defineProps<Props>(), {
  canDrawCard: false,
  lastPlayerName: undefined
})
const emit = defineEmits<Emits>()

const selectedCards = ref<Card[]>([])

const hasDobo = computed(() => props.doboDisplays.length > 0)

const handleSelectCard = (card: Card) => {
  // Auto-deselect if different number (business rule)
  if (selectedCards.value.length > 0) {
    const firstValue = selectedCards.value[0].value
    if (card.value !== firstValue) {
      selectedCards.value = []
    }
  }
  selectedCards.value.push(card)
  emit('selectCard', card)
}

const handleDeselectCard = (card: Card) => {
  selectedCards.value = selectedCards.value.filter(
    (c) => !(c.suit === card.suit && c.value === card.value)
  )
  emit('deselectCard', card)
}

const handleDragStart = (card: Card) => {
  emit('dragStart', card)
}

const handleDragEnd = () => {
  emit('dragEnd')
}

const handleDrop = () => {
  emit('drop')
}

const handleDrawCard = () => {
  emit('drawCard')
}

const handleDeclareDobo = () => {
  emit('declareDobo')
}

const handleNoReturn = () => {
  emit('noReturn')
}
</script>

<style scoped>
.game-board {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 12px;
  padding: 12px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  overflow: hidden;
}

.left-side {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 24px);
}

.opponents-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.right-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
  height: 100%;
}

.top-area {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 200px;
  max-height: 300px;
}

.field-info-group {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.deck-area {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.field-area {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.dobo-area {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: visible;
}

.dobo-stack {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 280px;
  min-height: 200px;
}

.bottom-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 80px 0;
  flex-shrink: 0;
}

.control-panel-wrapper {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 100;
}

/* Landscape mobile optimization */
@media (max-width: 926px) and (orientation: landscape) {
  .game-board {
    grid-template-columns: 150px 1fr;
    gap: 10px;
    padding: 8px;
  }

  .left-side {
    max-height: calc(100vh - 16px);
  }

  .field-info-group {
    gap: 12px;
  }

  .control-panel-wrapper {
    bottom: 12px;
    right: 12px;
  }
}

/* Portrait fallback */
@media (max-width: 640px) and (orientation: portrait) {
  .game-board {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    gap: 8px;
  }

  .left-side {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    max-height: none;
  }

  .opponents-area {
    flex-direction: row;
  }

  .top-area {
    grid-template-columns: 1fr;
  }

  .top-area-shifted {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }

  .field-info-group {
    flex-direction: column;
  }

  .control-panel-wrapper {
    bottom: 8px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
}
</style>
