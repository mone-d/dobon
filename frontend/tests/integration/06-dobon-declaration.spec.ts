/**
 * シナリオ6: ドボン宣言
 * 固定手札(3,7) + 場札(10) → 3+7=10 → DOBON!ボタン
 */
import { test, expect } from '@playwright/test';
import {
  startBackend,
  stopBackend,
  setupPage,
  startGameFlow,
} from '../helpers/test-setup';

test.describe('シナリオ6: ドボン宣言', () => {
  test.beforeAll(async () => {
    await startBackend({
      TEST_FIXED_HAND: '3,7,2,4,6',
      TEST_FIXED_FIELD: '10',
    });
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('DOBON!ボタンをクリック → ドボン宣言イベント送信', async ({ page }) => {
    await startGameFlow(page);

    // DOBONボタンが表示される
    const dobonButton = page.locator('button:has-text("DOBON")');
    await expect(dobonButton).toBeVisible();

    // コンソールログを監視
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // DOBONボタンをクリック
    await dobonButton.click();
    await page.waitForTimeout(2000);

    // ドボン宣言イベントが送信されたことを確認
    const dobonLog = consoleLogs.find(log => log.includes('Declaring dobo'));
    expect(dobonLog).toBeTruthy();
  });
});
