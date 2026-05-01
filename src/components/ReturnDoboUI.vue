<template>
  <div class="return-dobo-ui">
    <div class="return-title">
      <span>返しドボン判定</span>
    </div>
    <div class="return-message">
      <span>{{ doboPlayer }}さんがドボン宣言しました</span>
      <span class="return-formula">{{ doboFormula }}</span>
    </div>
    <div class="return-actions">
      <button
        class="return-button return-button-yes"
        :disabled="hasResponded"
        @click="handleDeclareReturn"
      >
        <span>返す</span>
      </button>
      <button
        class="return-button return-button-no"
        :disabled="hasResponded"
        @click="handleDeclareNoReturn"
      >
        <span>返さない</span>
      </button>
    </div>
    <div v-if="hasResponded" class="return-status">
      <span v-if="isReturning">返しドボンを宣言しました</span>
      <span v-else>返さないを宣言しました（他プレイヤーには非表示）</span>
    </div>
    <div v-if="returnEvents.length > 0" class="return-events">
      <div class="return-events-title">
        <span>返しドボン発生</span>
      </div>
      <div
        v-for="(event, index) in returnEvents"
        :key="index"
        class="return-event"
      >
        <span class="return-event-player">{{ event.playerName }}</span>
        <span class="return-event-formula">{{ event.formula }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface ReturnEvent {
  playerName: string
  formula: string
}

interface Props {
  doboPlayer: string
  doboFormula: string
  returnEvents?: ReturnEvent[]
}

interface Emits {
  (e: 'declareReturn', formula: string): void
  (e: 'declareNoReturn'): void
}

withDefaults(defineProps<Props>(), {
  returnEvents: () => []
})

const emit = defineEmits<Emits>()

const hasResponded = ref(false)
const isReturning = ref(false)

const handleDeclareReturn = () => {
  // In a real implementation, this would show a formula selection UI
  // For now, we'll use a placeholder formula
  const formula = '3+4+5' // Placeholder
  hasResponded.value = true
  isReturning.value = true
  emit('declareReturn', formula)
}

const handleDeclareNoReturn = () => {
  hasResponded.value = true
  isReturning.value = false
  emit('declareNoReturn')
}
</script>

<style scoped>
.return-dobo-ui {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.return-title {
  color: white;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.return-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: white;
  text-align: center;
}

.return-formula {
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
}

.return-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.return-button {
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.return-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.return-button:active:not(:disabled) {
  transform: scale(0.98);
}

.return-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.return-button-yes {
  background: #10b981;
  color: white;
}

.return-button-no {
  background: #ef4444;
  color: white;
}

.return-status {
  color: white;
  text-align: center;
  font-size: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
}

.return-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 8px;
}

.return-events-title {
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.return-event {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.return-event-player {
  font-weight: 600;
}

.return-event-formula {
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .return-dobo-ui {
    padding: 16px;
    gap: 12px;
  }

  .return-title {
    font-size: 18px;
  }

  .return-formula {
    font-size: 16px;
    padding: 6px 12px;
  }

  .return-actions {
    gap: 8px;
  }

  .return-button {
    padding: 12px;
    font-size: 14px;
  }

  .return-status {
    font-size: 12px;
    padding: 10px;
  }

  .return-events-title {
    font-size: 14px;
  }

  .return-event-formula {
    font-size: 12px;
  }
}
</style>
