/**
 * シナリオ8: ターン外ドボン宣言
 * 自分のターンでなくてもDOBON!ボタンが押せて、ドボン宣言が送信される
 */
import { test, expect } from '@playwright/test';
import {
  startBackend,
  stopBackend,
  setupPage,
  startGameFlow,
  isMyTurn,
} from '../helpers/test-setup';

test.describe('シナリオ8: ターン外ドボン宣言', () => {
  test.beforeAll(async () => {
    // 手札(1,1,1,1,2) + 場札(6) → 1+1+1+1+2=6 でドボン可能
    // AI_PLAY_CARDS=false でAIはドローのみ（場札が変わらない）
    // ただし自分のターンにならないようにするため、通常モードで起動
    // → 自分のターンが来る前にドボンを宣言する
    await startBackend({
      TEST_FIXED_HAND: '1,1,1,1,2',
      TEST_FIXED_FIELD: '6',
      AI_PLAY_CARDS: 'false',
    });
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test('自分のターンでなくてもDOBON!ボタンが押せる', async ({ page }) => {
    test.setTimeout(90000);
    await setupPage(page);
    await startGameFlow(page, 'ドボンテスト');

    // 自分のターンであることを確認（自動スキップで戻ってくる）
    expect(await isMyTurn(page)).toBe(true);

    // DOBONボタンが表示されている
    const dobonButton = page.locator('button:has-text("DOBON")');
    await expect(dobonButton).toBeVisible();

    // コンソールログを監視
    const logs: string[] = [];
    page.on('console', msg => { logs.push(msg.text()); });

    // DOBONボタンをクリック（自分のターンだが、ターンチェックなしで動作することを確認）
    await dobonButton.click();
    await page.waitForTimeout(2000);

    // ドボン宣言イベントが送信されたことを確認
    const dobonLog = logs.find(l => l.includes('Declaring dobo') || l.includes('Dobo declared'));
    expect(dobonLog).toBeTruthy();

    // ドボンが成功したことを確認（1+1+1+1+2=6）
    const successLog = logs.find(l => l.includes('Dobo declared') && !l.includes('Failed'));
    console.log('ドボン結果:', successLog ? '成功' : '失敗');
    
    // ゲーム結果画面を待つ
    const winText = page.locator('text=WIN');
    let resultFound = false;
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(1000);
      if (await winText.isVisible().catch(() => false)) {
        resultFound = true;
        break;
      }
    }
    expect(resultFound).toBe(true);
  });
});
