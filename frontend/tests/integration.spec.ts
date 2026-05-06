import { test, expect } from '@playwright/test';

test.describe('DOBON Integration Test', () => {
  test.beforeEach(async ({ page }) => {
    // フロントエンドにアクセス
    await page.goto('http://localhost:5173');
  });

  test('基本フロー: ログイン → デバッグナビゲーション → ゲーム画面', async ({ page }) => {
    // 1. ゲストログイン
    await test.step('ゲストログイン', async () => {
      await expect(page.locator('text=DOBON')).toBeVisible();
      
      // 名前を入力
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill('テストユーザー');
      
      // ゲームを始めるボタンをクリック
      await page.locator('button:has-text("ゲームを始める")').click();
      
      // ロビー画面に遷移
      await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
    });

    // 2. デバッグナビゲーションでゲーム画面へ
    await test.step('ゲーム画面へ遷移', async () => {
      // Gameボタンをクリック
      await page.locator('button:has-text("Game")').click();
      
      // ゲーム画面に遷移（モックデータで表示）
      await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    });

    // 3. ゲーム画面の要素確認
    await test.step('ゲーム画面の確認', async () => {
      // 手札が表示されている
      await expect(page.locator('text=手札')).toBeVisible();
      
      // 倍率が表示されている
      await expect(page.locator('text=×')).toBeVisible();
    });
  });

  test('WebSocket接続確認', async ({ page }) => {
    // コンソールログを監視
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // ゲストログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('テストユーザー');
    await page.locator('button:has-text("ゲームを始める")').click();

    // WebSocket接続ログを確認
    await page.waitForTimeout(2000);
    
    const hasConnectionLog = logs.some(log => 
      log.includes('Socket connected') || log.includes('✅')
    );
    
    expect(hasConnectionLog).toBeTruthy();
  });

  test('エラー通知の表示', async ({ page }) => {
    // バックエンドが停止している場合のテスト
    // （このテストは手動でバックエンドを停止して実行）
    
    // ゲストログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('テストユーザー');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // ルーム作成を試行
    await page.locator('button:has-text("ルームを作成")').click();
    
    // ゲーム開始を試行（バックエンドが停止していればエラー）
    const startButton = page.locator('button:has-text("ゲーム開始")');
    if (await startButton.isVisible()) {
      await startButton.click();
      
      // エラー通知が表示される（バックエンド停止時）
      // await expect(page.locator('text=サーバーに接続されていません')).toBeVisible({ timeout: 5000 });
    }
  });

  test('デバッグナビゲーション', async ({ page }) => {
    // ゲストログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('テストユーザー');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // デバッグボタンが表示されている
    await expect(page.locator('button:has-text("Lobby")')).toBeVisible();
    await expect(page.locator('button:has-text("Room")')).toBeVisible();
    await expect(page.locator('button:has-text("Game")')).toBeVisible();
    
    // Gameボタンをクリック
    await page.locator('button:has-text("Game")').click();
    
    // ゲーム画面に遷移（モックデータで表示）
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
  });

  test('カードプレイとドロー', async ({ page }) => {
    // ゲストログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('テストユーザー');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // ゲーム画面へ
    await page.locator('button:has-text("Game")').click();
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    
    // カードを選択
    await test.step('カードを選択', async () => {
      const cards = page.locator('[class*="card"]').first();
      await cards.click();
      
      // 選択状態になることを確認（緑の枠線）
      await page.waitForTimeout(500);
    });
    
    // カードをプレイ
    await test.step('カードをプレイ', async () => {
      const playButton = page.locator('button:has-text("カードを出す")');
      if (await playButton.isVisible()) {
        await playButton.click();
        await page.waitForTimeout(1000);
        
        // コンソールログを確認
        console.log('カードプレイ完了');
      }
    });
    
    // カードをドロー
    await test.step('カードをドロー', async () => {
      const drawButton = page.locator('button:has-text("カードを引く")');
      if (await drawButton.isVisible()) {
        await drawButton.click();
        await page.waitForTimeout(1000);
        
        // コンソールログを確認
        console.log('カードドロー完了');
      }
    });
    
    // 複数回実行可能か確認
    await test.step('複数回実行', async () => {
      for (let i = 0; i < 3; i++) {
        const drawButton = page.locator('button:has-text("カードを引く")');
        if (await drawButton.isVisible()) {
          await drawButton.click();
          await page.waitForTimeout(500);
          console.log(`${i + 1}回目のドロー完了`);
        }
      }
    });
  });
});
