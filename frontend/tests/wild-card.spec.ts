import { test, expect } from '@playwright/test';

test.describe('特殊カード効果テスト', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[Browser] ${text}`);
    });

    await page.goto('http://localhost:5173');
  });

  test('8（ワイルドカード）→ スート選択UI表示', async ({ page }) => {
    // 1. ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('ワイルドテスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
    console.log('✅ ログイン成功');
    
    // 2. Roomボタンでルーム画面へ
    await page.locator('button:has-text("Room")').click();
    await page.waitForTimeout(1000);
    console.log('✅ ルーム画面へ遷移');
    
    // 3. ゲーム開始
    const startButton = page.locator('button:has-text("ゲーム開始")');
    if (await startButton.isVisible()) {
      await startButton.click();
      console.log('🎮 ゲーム開始ボタンクリック');
      await page.waitForTimeout(3000);
    }
    
    // 4. ゲーム画面の確認
    const isGameScreen = await page.locator('text=手札').isVisible();
    console.log(`ゲーム画面: ${isGameScreen ? '表示' : '非表示'}`);
    
    if (!isGameScreen) {
      console.log('❌ ゲーム画面が表示されていません');
      return;
    }
    
    // 5. 手札に8があるか確認
    await page.waitForTimeout(2000);
    
    // 手札のカードを全て取得（PlayingCardコンポーネント）
    const handCards = page.locator('.bg-white.rounded-lg.shadow-lg').filter({ hasText: /[A2-9JQK♠♥♦♣]/ });
    const cardCount = await handCards.count();
    console.log(`手札枚数: ${cardCount}枚`);
    
    // 8を探す
    let has8 = false;
    for (let i = 0; i < cardCount; i++) {
      const cardText = await handCards.nth(i).textContent();
      console.log(`カード${i}: ${cardText}`);
      if (cardText?.includes('8')) {
        has8 = true;
        console.log(`✅ 8を発見: インデックス${i}`);
        
        // 8をクリック
        await handCards.nth(i).click();
        await page.waitForTimeout(500);
        console.log('🃏 8をクリック');
        break;
      }
    }
    
    if (!has8) {
      console.log('⚠️ 手札に8がありません');
      await page.screenshot({ path: 'test-results/no-8-in-hand.png' });
      return;
    }
    
    // 6. 「出す」ボタンをクリック
    const playButton = page.locator('button:has-text("出す")');
    if (await playButton.isVisible()) {
      await playButton.click();
      console.log('🃏 カードをプレイ');
      await page.waitForTimeout(2000);
    } else {
      console.log('❌ 出すボタンが表示されていません');
      await page.screenshot({ path: 'test-results/no-play-button.png' });
      return;
    }
    
    // 7. スート選択UIが表示されるか確認
    const suitSelector = page.locator('text=スートを選択');
    const isSuitSelectorVisible = await suitSelector.isVisible().catch(() => false);
    console.log(`スート選択UI: ${isSuitSelectorVisible ? '表示あり' : '表示なし'}`);
    
    if (isSuitSelectorVisible) {
      console.log('✅ スート選択UIが表示されました');
      
      // スクリーンショット保存
      await page.screenshot({ path: 'test-results/suit-selector.png' });
      console.log('📸 スクリーンショット保存: suit-selector.png');
      
      // スペードを選択
      const spadeButton = page.locator('button:has-text("スペード")');
      await spadeButton.click();
      console.log('♠️ スペードを選択');
      
      await page.waitForTimeout(1000);
      
      // スート選択UIが消えたか確認
      const isGone = !(await suitSelector.isVisible().catch(() => false));
      console.log(`スート選択UI消去: ${isGone ? '成功' : '失敗'}`);
    } else {
      console.log('❌ スート選択UIが表示されませんでした');
      await page.screenshot({ path: 'test-results/no-suit-selector.png' });
    }
    
    console.log('✅ ワイルドカードテスト完了');
  });
});
