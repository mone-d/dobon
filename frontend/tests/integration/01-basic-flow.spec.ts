/**
 * シナリオ1: 基本フロー
 * ログイン → Room → ゲーム開始 → 画面表示確認
 */
import { test, expect } from '@playwright/test';
import {
  startBackend,
  stopBackend,
  setupPage,
  startGameFlow,
  getMultiplier,
  getDeckCount,
  getHandCount,
  isMyTurn,
} from '../helpers/test-setup';

test.describe('シナリオ1: 基本フロー', () => {
  test.beforeAll(async () => {
    await startBackend();
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('ログイン → Room → ゲーム開始 → ゲーム画面表示', async ({ page }) => {
    await startGameFlow(page, 'テスト太郎');

    // ゲーム画面の要素を確認
    await test.step('ヘッダー表示', async () => {
      await expect(page.getByText('DOBON', { exact: true })).toBeVisible();
      await expect(page.locator('text=BASE')).toBeVisible();
    });

    await test.step('対戦相手表示', async () => {
      // 5人の対戦相手が表示される（6人プレイ - 自分）
      const opponents = page.locator('.grid.grid-cols-3 > div');
      const count = await opponents.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    await test.step('場札表示', async () => {
      await expect(page.locator('text=場札')).toBeVisible();
      await expect(page.locator('text=山札')).toBeVisible();
    });

    await test.step('手札表示', async () => {
      await expect(page.getByText('手札', { exact: true })).toBeVisible();
      const handCount = await getHandCount(page);
      expect(handCount).toBe(5); // 初期手札5枚
    });

    await test.step('倍率表示', async () => {
      const multiplier = await getMultiplier(page);
      expect(multiplier).toBeGreaterThanOrEqual(1);
    });

    await test.step('山札枚数表示', async () => {
      const deckCount = await getDeckCount(page);
      expect(deckCount).toBeGreaterThan(0);
    });

    await test.step('ターン表示', async () => {
      const myTurn = await isMyTurn(page);
      expect(myTurn).toBe(true); // 自動スキップで自分のターンになるはず
    });

    await test.step('DOBONボタン表示', async () => {
      await expect(page.locator('button:has-text("DOBON")')).toBeVisible();
    });
  });
});
