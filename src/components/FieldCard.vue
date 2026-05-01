<template>
  <div
    class="field-card"
    :class="{ 'field-card-drop-target': isDragOver }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="field-card-title">
      <span>場札</span>
    </div>
    <div class="field-card-content">
      <Card v-if="fieldCard" :card="fieldCard" :draggable="false" />
      <div v-else class="field-card-empty">
        <span>カードなし</span>
      </div>
    </div>
    <div v-if="lastPlayerName" class="field-card-player">
      <span>{{ lastPlayerName }}さんが出した</span>
    </div>
    <div v-if="multiplier > 1" class="field-card-multiplier">
      <span>倍率: {{ multiplier }}x</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Card from './Card.vue'
import type { Card as CardType } from '@/types/domain'

interface Props {
  fieldCard: CardType | null
  multiplier?: number
  lastPlayerName?: string
}

interface Emits {
  (e: 'drop'): void
}

withDefaults(defineProps<Props>(), {
  multiplier: 1,
  lastPlayerName: undefined
})

const emit = defineEmits<Emits>()

const isDragOver = ref(false)

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  emit('drop')
}
</script>

<style scoped>
.field-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-height: 200px;
  position: relative;
  transition: all 0.2s ease;
}

.field-card-drop-target {
  border: 3px dashed #fff;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  transform: scale(1.02);
}

.field-card-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.field-card-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.field-card-empty {
  width: 80px;
  height: 112px;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.field-card-player {
  background: rgba(255, 255, 255, 0.95);
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.field-card-multiplier {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #dc2626;
  font-size: 16px;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Mobile responsive */
@media (max-width: 640px) {
  .field-card {
    padding: 16px;
    gap: 8px;
    min-height: 160px;
  }

  .field-card-title {
    font-size: 16px;
  }

  .field-card-empty {
    width: 60px;
    height: 84px;
    font-size: 12px;
  }

  .field-card-multiplier {
    font-size: 14px;
    padding: 4px 10px;
  }
}
</style>
