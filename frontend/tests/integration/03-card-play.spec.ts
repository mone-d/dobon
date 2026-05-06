/**
 * シナリオ3: カードプレイ
 * 固定手札(5,5,5,5,5) + 場札(5) → 同じ数字のカードを出す
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
  isMyTurn,
} from '../helpers/test-setup';

test.describe('シナリオ3: カードプレイ', () => {
  test.beforeAll(async () => {
    await startBackend({
      TEST_FIXED_HAND: '5,5,5,5,5',
      TEST_FIXED_FIELD: '5',
      AI_PLAY_CARDS: 'false',
    });
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('同じ数字のカードを出す → 手札-1、場札更新', async ({ page }) => {
    await startGameFlow(page);

    const initialHand = await getHandCount(page);
    expect(initialHand).toBe(5);
    expect(await isMyTurn(page)).toBe(true);

    // デバッグ: カードの数を確認
    const handContainer = page.locator('.bg-gray-900\\/70 .relative.flex.items-end');
    const cardDivs = handContainer.locator('> .absolute');
    const cardCount = await cardDivs.count();
    console.log(`カード要素数: ${cardCount}`);

    // 最初のカードを選択
    await selectCardByIndex(page, 0);
    await page.waitForTimeout(500);

    // 「X枚出す」ボタンが表示されるか確認
    const playButton = page.locator('button:has-text("枚出す")');
    const isPlayVisible = await playButton.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`出すボタン表示: ${isPlayVisible}`);

    if (!isPlayVisible) {
      // カード選択が効いていない場合、スクリーンショットを撮る
      await page.screenshot({ path: 'test-results/card-play-debug.png' });
      console.log('📸 デバッグスクリーンショット保存');
    }

    expect(isPlayVisible).toBe(true);

    // カードを出す
    await playSelectedCards(page);

    // 手札が1枚減る
    const afterHand = await getHandCount(page);
    expect(afterHand).toBe(initialHand - 1);

    // まだ自分のターン（自動スキップで戻ってくる）
    expect(await isMyTurn(page)).toBe(true);
  });

  test('複数枚の同じ数字を出す → 手札-2', async ({ page }) => {
    await startGameFlow(page);

    const initialHand = await getHandCount(page);

    // 2枚選択（同じ数字5）
    await selectCardByIndex(page, 0);
    await selectCardByIndex(page, 1);

    // 「2枚出す」ボタンが表示される
    const playButton = page.locator('button:has-text("2枚出す")');
    await expect(playButton).toBeVisible({ timeout: 3000 });

    // カードを出す
    await playSelectedCards(page);

    // 手札が2枚減る
    const afterHand = await getHandCount(page);
    expect(afterHand).toBe(initialHand - 2);
  });
});
