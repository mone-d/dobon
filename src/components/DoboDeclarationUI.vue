<template>
  <div class="dobo-declaration-ui">
    <div class="dobo-title">
      <span>ドボン宣言</span>
    </div>
    <div class="dobo-formulas">
      <button
        v-for="(formula, index) in formulaOptions"
        :key="index"
        class="dobo-formula-button"
        :class="{ 'dobo-formula-disabled': !formula }"
        :disabled="!formula"
        @click="handleFormulaClick(formula)"
      >
        <span v-if="formula" class="formula-text">{{ formula }}</span>
        <span v-else class="formula-empty">-</span>
      </button>
    </div>
    <div class="dobo-hint">
      <span>タップで即座にドボン宣言</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Card } from '@/types/domain'

interface Props {
  cards: Card[]
  fieldCard: Card | null
}

interface Emits {
  (e: 'declareDobo', formula: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Generate 4 formula options (one for each operator: +, -, *, /)
const formulaOptions = computed<(string | null)[]>(() => {
  if (!props.fieldCard || props.cards.length === 0) {
    return [null, null, null, null]
  }

  const operators = ['+', '-', '*', '/']
  const targetValue = props.fieldCard.value
  const cardValues = props.cards.map((c) => c.value)

  return operators.map((operator) => {
    const formula = generateFormula(cardValues, operator, targetValue)
    return formula
  })
})

// Generate formula for a specific operator
const generateFormula = (
  values: number[],
  operator: string,
  target: number
): string | null => {
  if (values.length === 0) return null

  // Simple formula generation (can be improved with more complex logic)
  const formula = values.join(` ${operator} `)
  
  // Validate formula
  try {
    const result = evaluateFormula(values, operator)
    if (result === target) {
      return formula
    }
  } catch (error) {
    // Invalid formula
  }

  return null
}

// Evaluate formula
const evaluateFormula = (values: number[], operator: string): number => {
  switch (operator) {
    case '+':
      return values.reduce((acc, val) => acc + val, 0)
    case '-':
      return values.reduce((acc, val, index) => (index === 0 ? val : acc - val))
    case '*':
      return values.reduce((acc, val) => acc * val, 1)
    case '/':
      return values.reduce((acc, val, index) => (index === 0 ? val : acc / val))
    default:
      throw new Error('Invalid operator')
  }
}

// Handle formula click - one-tap declaration (no confirmation dialog)
const handleFormulaClick = (formula: string | null) => {
  if (!formula) return
  emit('declareDobo', formula)
}
</script>

<style scoped>
.dobo-declaration-ui {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dobo-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.dobo-formulas {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.dobo-formula-button {
  padding: 12px;
  background: white;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #f59e0b;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dobo-formula-button:hover:not(:disabled) {
  background: #f59e0b;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
}

.dobo-formula-button:active:not(:disabled) {
  transform: scale(0.98);
}

.dobo-formula-disabled {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.formula-text {
  font-family: 'Courier New', monospace;
}

.formula-empty {
  color: #d1d5db;
  font-size: 24px;
}

.dobo-hint {
  color: white;
  font-size: 12px;
  text-align: center;
  opacity: 0.9;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .dobo-declaration-ui {
    padding: 12px;
    gap: 8px;
  }

  .dobo-title {
    font-size: 16px;
  }

  .dobo-formulas {
    gap: 6px;
  }

  .dobo-formula-button {
    padding: 10px;
    font-size: 14px;
    min-height: 50px;
  }

  .dobo-hint {
    font-size: 11px;
  }
}
</style>
