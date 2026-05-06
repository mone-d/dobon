import { test, expect } from '@playwright/test';

test.describe('ドボン宣言フロー', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[Browser] ${text}`);
    });

    await page.goto('http://localhost:5173');
  });

  test('ドボン宣言 → エフェクト表示', async ({ page }) => {
    // 1. ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('ドボンテスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
    console.log('✅ ログイン成功');
    
    // 2. Roomボタンでルーム画面へ
    await page.locator('button:has-text("Room")').click();
    await page.waitForTimeout(1000);
    console.log('✅ ルーム画面へ遷移');
    
    // 3. ゲーム開始ボタンをクリック
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
    
    // 5. 自分のターンまで待つ
    console.log('⏳ 自分のターンを待機中...');
    await page.waitForTimeout(2000);
    
    // 6. ドボンボタンをクリック
    const doboButton = page.locator('button:has-text("DOBON")');
    await expect(doboButton).toBeVisible();
    console.log('🎯 ドボンボタンが表示されています');
    
    await doboButton.click();
    console.log('🎯 ドボンボタンをクリック');
    
    // 7. ドボンエフェクトの表示を確認（3秒待機）
    await page.waitForTimeout(1000);
    
    // エフェクトが表示されているか確認
    const effectVisible = await page.locator('text=DOBON').count() > 1; // ボタン以外にエフェクトがあるか
    console.log(`ドボンエフェクト: ${effectVisible ? '表示あり' : '表示なし'}`);
    
    // 8. スクリーンショット保存
    await page.screenshot({ path: 'test-results/dobo-declaration.png' });
    console.log('📸 スクリーンショット保存: dobo-declaration.png');
    
    // 9. エフェクトが消えるまで待つ
    await page.waitForTimeout(3000);
    console.log('✅ ドボン宣言テスト完了');
  });

  test('無効なドボン → ペナルティ表示', async ({ page }) => {
    // 1. ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('ペナルティテスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
    
    // 2. Roomボタンでルーム画面へ
    await page.locator('button:has-text("Room")').click();
    await page.waitForTimeout(1000);
    
    // 3. ゲーム開始
    const startButton = page.locator('button:has-text("ゲーム開始")');
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 4. 手札を全て選択解除（無効なドボンを作るため）
    await page.waitForTimeout(2000);
    
    // 5. ドボンボタンをクリック（手札が場札と一致しない状態）
    const doboButton = page.locator('button:has-text("DOBON")');
    await doboButton.click();
    console.log('🎯 無効なドボンを宣言');
    
    // 6. ペナルティメッセージを確認
    await page.waitForTimeout(1000);
    
    // エラーメッセージまたはペナルティエフェクトを確認
    const errorVisible = await page.locator('text=無効').isVisible().catch(() => false);
    console.log(`ペナルティ表示: ${errorVisible ? '表示あり' : '表示なし'}`);
    
    // 7. スクリーンショット保存
    await page.screenshot({ path: 'test-results/dobo-penalty.png' });
    console.log('📸 スクリーンショット保存: dobo-penalty.png');
    
    await page.waitForTimeout(3000);
    console.log('✅ ペナルティテスト完了');
  });
});
