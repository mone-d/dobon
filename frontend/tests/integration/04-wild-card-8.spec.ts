/**
 * シナリオ4: ワイルドカード8
 * 固定手札(8,8,8,8,8) + 場札(5) → 8を出す → スート選択UI表示
 */
import { test, expect } from '@playwright/test';
import {
  startBackend,
  stopBackend,
  setupPage,
  startGameFlow,
  selectCardByIndex,
  playSelectedCards,
  getHandCount,
} from '../helpers/test-setup';

test.describe('シナリオ4: ワイルドカード8', () => {
  test.beforeAll(async () => {
    await startBackend({
      TEST_FIXED_HAND: '8,8,8,8,8',
      TEST_FIXED_FIELD: '5',
    });
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('8を出す → スート選択UIが表示される', async ({ page }) => {
    await startGameFlow(page);

    // 8のカードを選択（最初のカード）
    await selectCardByIndex(page, 0);

    // カードを出す
    await playSelectedCards(page);

    // スート選択UIが表示される
    // SuitSelectorコンポーネントのボタンを確認
    const suitButtons = page.locator('button:has-text("♠"), button:has-text("♥"), button:has-text("♦"), button:has-text("♣")');
    const suitCount = await suitButtons.count();
    expect(suitCount).toBeGreaterThanOrEqual(4);
  });
});
