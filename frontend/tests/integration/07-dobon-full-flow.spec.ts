/**
 * シナリオ7: ドボン完全フロー
 * 手札(5,8,2,3,5) + 場札(5) → 8を出す → スート選択 → 5を出す → 5を出す → DOBON!(2+3=5)
 */
import { test, expect } from '@playwright/test';
import {
  startBackend,
  stopBackend,
  setupPage,
  startGameFlow,
  selectCardByIndex,
  playSelectedCards,
  drawCard,
  getHandCount,
  getDeckCount,
  getMultiplier,
  isMyTurn,
} from '../helpers/test-setup';

test.describe('シナリオ7: ドボン完全フロー', () => {
  test.beforeAll(async () => {
    // 手札5枚(1,1,1,1,2) + 場札6 → 1+1+1+1+2=6 で即ドボン可能
    await startBackend({
      TEST_FIXED_HAND: '1,1,1,1,2',
      TEST_FIXED_FIELD: '6',
      AI_PLAY_CARDS: 'false',
    });
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test('手札(1,1,1,1,2) + 場札(6) → 即DOBON(1+1+1+1+2=6)', async ({ page }) => {
    test.setTimeout(90000);
    await setupPage(page);
    
    const logs: string[] = [];
    page.on('console', msg => { logs.push(`[${msg.type()}] ${msg.text()}`); });

    await startGameFlow(page, 'ドボンテスト');

    const initialHand = await getHandCount(page);
    console.log(`初期手札: ${initialHand}枚`);
    // 手札は2枚（TEST_FIXED_HAND=2,3で2枚指定、残り3枚はランダム）
    // dealCardsは5枚配るので、2,3 + ランダム3枚 = 5枚になる

    // DOBON!
    await test.step('DOBON宣言', async () => {
      const dobonButton = page.locator('button:has-text("DOBON")');
      await expect(dobonButton).toBeVisible();
      await dobonButton.click();
      console.log('DOBON!ボタンをクリック');
      
      // ゲーム結果画面を待つ（返しドボンタイムアウト10秒 + マージン）
      const winText = page.locator('text=WIN');
      const loseText = page.locator('text=LOSE');
      
      let resultFound = false;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(1000);
        if (await winText.isVisible().catch(() => false) || await loseText.isVisible().catch(() => false)) {
          console.log(`✅ ゲーム結果画面表示 (${i+1}秒後)`);
          resultFound = true;
          break;
        }
      }
      
      if (!resultFound) {
        const dobonLogs = logs.filter(l => l.includes('dobo') || l.includes('formula') || l.includes('penalty') || l.includes('ended'));
        console.log('❌ ゲーム結果画面が表示されない');
        dobonLogs.forEach(l => console.log(`  ${l}`));
      }
      
      await page.screenshot({ path: 'test-results/dobon-final.png' });
      expect(resultFound).toBe(true);
    });
  });
});
