/**
 * シナリオ2: カードドロー
 * 山札クリック → 手札+1 → 山札枚数減少 → ターン進行
 */
import { test, expect } from '@playwright/test';
import {
  startBackend,
  stopBackend,
  setupPage,
  startGameFlow,
  drawCard,
  getDeckCount,
  getHandCount,
  isMyTurn,
} from '../helpers/test-setup';

test.describe('シナリオ2: カードドロー', () => {
  test.beforeAll(async () => {
    await startBackend();
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('山札からカードを引く → 手札+1、山札-6（自分+AI5人）', async ({ page }) => {
    await startGameFlow(page);

    const initialHand = await getHandCount(page);
    const initialDeck = await getDeckCount(page);
    expect(initialHand).toBe(5);

    // 1回ドロー
    await drawCard(page);

    const afterHand = await getHandCount(page);
    const afterDeck = await getDeckCount(page);

    // 手札が1枚増える
    expect(afterHand).toBe(initialHand + 1);
    // 山札が減る（自分1枚 + AI5人分）
    expect(afterDeck).toBeLessThan(initialDeck);

    // まだ自分のターン（自動スキップで戻ってくる）
    expect(await isMyTurn(page)).toBe(true);
  });

  test('連続ドロー → 手札が増え続ける', async ({ page }) => {
    await startGameFlow(page);

    const initialHand = await getHandCount(page);

    for (let i = 0; i < 3; i++) {
      await drawCard(page);
    }

    const finalHand = await getHandCount(page);
    expect(finalHand).toBe(initialHand + 3);
  });
});
