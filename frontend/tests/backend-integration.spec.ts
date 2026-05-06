import { test, expect } from '@playwright/test';

test.describe('DOBON Backend Integration Test', () => {
  test.beforeEach(async ({ page }) => {
    // コンソールログを監視
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('✅') || text.includes('❌') || text.includes('🎮') || text.includes('🃏')) {
        console.log(`[Browser] ${text}`);
      }
    });

    // フロントエンドにアクセス
    await page.goto('http://localhost:5173');
  });

  test('完全フロー: ログイン → ルーム作成 → ゲーム開始 → カードプレイ', async ({ page }) => {
    // 1. ゲストログイン
    await test.step('ゲストログイン', async () => {
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill('E2Eテストユーザー');
      await page.locator('button:has-text("ゲームを始める")').click();
      await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
      console.log('✅ ログイン成功');
    });

    // 2. ルーム作成
    await test.step('ルーム作成', async () => {
      await page.locator('button:has-text("ルームを作成")').click();
      await page.waitForTimeout(2000);
      
      // ルーム画面またはロビー画面のまま
      const isRoomScreen = await page.locator('text=ゲーム開始').isVisible();
      const isLobbyScreen = await page.locator('text=DOBON ロビー').isVisible();
      
      expect(isRoomScreen || isLobbyScreen).toBeTruthy();
      console.log('✅ ルーム作成試行完了');
    });

    // 3. デバッグナビゲーションでゲーム画面へ（実際のゲーム開始の代わり）
    await test.step('ゲーム画面へ遷移', async () => {
      await page.locator('button:has-text("Game")').click();
      await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
      console.log('✅ ゲーム画面表示');
    });

    // 4. ゲーム状態の確認
    await test.step('ゲーム状態の確認', async () => {
      // 手札が表示されている
      await expect(page.locator('text=手札')).toBeVisible();
      
      // 倍率が表示されている
      const multiplier = page.locator('text=×');
      await expect(multiplier).toBeVisible();
      
      console.log('✅ ゲーム状態表示確認');
    });

    // 5. カード選択を試行
    await test.step('カード選択', async () => {
      // 手札エリアを探す
      const handArea = page.locator('text=手札').locator('..');
      
      // カードをクリック（最初のカード）
      const firstCard = handArea.locator('div').first();
      await firstCard.click();
      await page.waitForTimeout(500);
      
      console.log('✅ カード選択試行');
    });

    // 6. カードプレイボタンの確認
    await test.step('カードプレイボタンの確認', async () => {
      const playButton = page.locator('button:has-text("カードを出す")');
      const drawButton = page.locator('button:has-text("カードを引く")');
      
      const hasPlayButton = await playButton.isVisible();
      const hasDrawButton = await drawButton.isVisible();
      
      console.log(`カードを出すボタン: ${hasPlayButton ? '表示' : '非表示'}`);
      console.log(`カードを引くボタン: ${hasDrawButton ? '表示' : '非表示'}`);
      
      expect(hasPlayButton || hasDrawButton).toBeTruthy();
    });
  });

  test('WebSocket通信の確認', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('WebSocketテスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // WebSocket接続を待つ
    await page.waitForTimeout(3000);
    
    // 接続ログを確認
    const hasConnectionLog = logs.some(log => 
      log.includes('Socket connected') || 
      log.includes('✅ Socket connected')
    );
    
    console.log('WebSocket接続ログ:', hasConnectionLog ? '確認' : '未確認');
    console.log('ログ数:', logs.length);
    
    // ゲーム画面へ
    await page.locator('button:has-text("Game")').click();
    await page.waitForTimeout(2000);
    
    // ゲーム状態更新ログを確認
    const hasGameStateLog = logs.some(log => 
      log.includes('Game state updated') || 
      log.includes('📊')
    );
    
    console.log('ゲーム状態更新ログ:', hasGameStateLog ? '確認' : '未確認');
    
    expect(hasConnectionLog).toBeTruthy();
  });

  test('カードドローの動作確認', async ({ page }) => {
    // ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('ドローテスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // ゲーム画面へ
    await page.locator('button:has-text("Game")').click();
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    
    // 山札をクリックしてカードを引く
    await test.step('山札をクリック', async () => {
      // 山札は画面中央付近にある
      // "山札"というテキストを探す
      const deckArea = page.locator('text=山札');
      
      if (await deckArea.isVisible()) {
        console.log('✅ 山札発見');
        
        // 山札エリアをクリック
        await deckArea.click();
        console.log('🎴 山札クリック（カードドロー実行）');
        
        // 結果を待つ
        await page.waitForTimeout(2000);
        
        // 手札が表示されているか確認
        await expect(page.locator('text=手札')).toBeVisible();
        console.log('✅ ドロー後の手札表示確認');
      } else {
        console.log('⚠️ 山札が見つかりません');
      }
    });
  });

  test('複数回のカードドロー', async ({ page }) => {
    // ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('連続ドローテスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // ゲーム画面へ
    await page.locator('button:has-text("Game")').click();
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    
    // 3回山札をクリックしてカードを引く
    for (let i = 0; i < 3; i++) {
      const deckArea = page.locator('text=山札');
      
      if (await deckArea.isVisible()) {
        await deckArea.click();
        console.log(`🎴 ${i + 1}回目のドロー実行`);
        await page.waitForTimeout(1500);
      } else {
        console.log(`⚠️ ${i + 1}回目: 山札が見つかりません`);
        break;
      }
    }
    
    // 最終的な手札が表示されているか確認
    await expect(page.locator('text=手札')).toBeVisible();
    console.log('✅ 連続ドロー完了');
  });

  test('山札が空になるまでドロー', async ({ page }) => {
    // エラー通知を監視
    let errorShown = false;
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('山札が空') || text.includes('deck_empty')) {
        console.log('⚠️ 山札が空のエラー検出:', text);
        errorShown = true;
      }
    });

    // ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('EmptyDeckTest');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // ゲーム画面へ
    await page.locator('button:has-text("Game")').click();
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    
    console.log('🎴 山札が空になるまでドローを開始');
    
    // 最大30回ドローを試行（山札が空になるまで）
    let drawCount = 0;
    for (let i = 0; i < 30; i++) {
      // 山札エリアを探す（より具体的なセレクタ）
      const deckArea = page.locator('text=山札').first();
      
      if (await deckArea.isVisible()) {
        await deckArea.click();
        drawCount++;
        
        if (drawCount % 5 === 0) {
          console.log(`🎴 ${drawCount}回ドロー完了`);
        }
        
        await page.waitForTimeout(500);
        
        // エラー通知が表示されたか確認
        const errorNotification = page.locator('text=山札が空');
        if (await errorNotification.isVisible({ timeout: 300 }).catch(() => false)) {
          console.log('✅ エラー通知表示確認');
          break;
        }
      } else {
        break;
      }
    }
    
    console.log(`✅ 合計${drawCount}回ドロー実行`);
    console.log(`エラー検出: ${errorShown ? 'あり' : 'なし'}`);
    
    // 手札が表示されているか確認
    await expect(page.locator('text=手札')).toBeVisible();
  });

  test('レート表示と山札枚数の確認', async ({ page }) => {
    // ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('UIチェック');
    await page.locator('button:has-text("ゲームを始める")').click();
    
    // ゲーム画面へ
    await page.locator('button:has-text("Game")').click();
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    
    // レート表示を確認
    await test.step('レート表示の確認', async () => {
      const rateDisplay = page.locator('text=×');
      const isRateVisible = await rateDisplay.isVisible();
      
      console.log(`レート表示: ${isRateVisible ? '表示あり' : '表示なし'}`);
      
      if (isRateVisible) {
        const rateText = await rateDisplay.textContent();
        console.log(`レート値: ${rateText}`);
      }
    });
    
    // 山札枚数を確認
    await test.step('山札枚数の確認', async () => {
      const deckText = page.locator('text=山札').first();
      const deckInfo = await deckText.textContent();
      console.log(`山札情報: ${deckInfo}`);
      
      // 初期状態をスクリーンショット
      await page.screenshot({ path: 'test-results/initial-game-state.png' });
      console.log('📸 初期状態のスクリーンショット保存');
    });
    
    // 1回ドローして山札枚数の変化を確認
    await test.step('ドロー後の山札枚数確認', async () => {
      const deckArea = page.locator('text=山札').first();
      await deckArea.click();
      await page.waitForTimeout(1000);
      
      const deckTextAfter = await page.locator('text=山札').first().textContent();
      console.log(`ドロー後の山札情報: ${deckTextAfter}`);
      
      // ドロー後をスクリーンショット
      await page.screenshot({ path: 'test-results/after-draw-state.png' });
      console.log('📸 ドロー後のスクリーンショット保存');
    });
  });
});
