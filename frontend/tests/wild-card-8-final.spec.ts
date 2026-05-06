import { test, expect } from '@playwright/test';

test.describe('ワイルドカード8の動作確認', () => {
  test('8を出したらスート選択UIが表示される', async ({ page }) => {
    page.on('console', msg => console.log(`[Browser] ${msg.text()}`));

    await page.goto('http://localhost:5173');
    
    // ゲストログイン
    await page.fill('input[type="text"]', 'ワイルド8テスト');
    await page.locator('button').first().click();
    await page.waitForTimeout(2000);
    
    // ルーム参加
    const firstRoom = page.locator('button').filter({ hasText: '参加' }).first();
    await firstRoom.click();
    await page.waitForTimeout(2000);
    
    // ゲーム開始
    await page.locator('button:has-text("ゲーム開始")').click();
    await page.waitForTimeout(5000);
    
    console.log('✅ ゲーム開始');
    
    // 8を探してクリック
    const clicked8 = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const cardDivs = allDivs.filter(div => {
        const classes = div.className || '';
        return classes.includes('w-14') && classes.includes('h-[76px]');
      });
      
      const card8 = cardDivs.find(div => div.textContent?.includes('8'));
      
      if (card8) {
        (card8 as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (!clicked8) {
      console.log('⚠️ 今回の手札に8がありませんでした。テストをもう一度実行してください。');
      return;
    }
    
    console.log('✅ 8を選択');
    await page.waitForTimeout(500);
    
    // 「出す」ボタンをクリック
    const playButton = page.locator('button:has-text("出す")');
    await playButton.click();
    console.log('✅ 8を出しました');
    await page.waitForTimeout(2000);
    
    // スート選択UIを確認
    const suitSelector = await page.locator('text=スートを選択').isVisible();
    console.log(`スート選択UI: ${suitSelector ? '✅ 表示' : '❌ 非表示'}`);
    
    if (suitSelector) {
      // スートボタンを確認
      const spades = await page.locator('button:has-text("♠")').isVisible();
      const hearts = await page.locator('button:has-text("♥")').isVisible();
      const diamonds = await page.locator('button:has-text("♦")').isVisible();
      const clubs = await page.locator('button:has-text("♣")').isVisible();
      
      console.log(`♠: ${spades ? '✅' : '❌'}`);
      console.log(`♥: ${hearts ? '✅' : '❌'}`);
      console.log(`♦: ${diamonds ? '✅' : '❌'}`);
      console.log(`♣: ${clubs ? '✅' : '❌'}`);
      
      // ♠を選択
      await page.locator('button:has-text("♠")').click();
      console.log('✅ ♠を選択');
      await page.waitForTimeout(1000);
      
      // スート選択UIが消えたか確認
      const suitSelectorGone = !(await page.locator('text=スートを選択').isVisible());
      console.log(`スート選択UI消えた: ${suitSelectorGone ? '✅' : '❌'}`);
      
      expect(suitSelectorGone).toBe(true);
    } else {
      throw new Error('スート選択UIが表示されませんでした');
    }
    
    await page.screenshot({ path: 'test-results/wild-card-8-success.png' });
  });
});
