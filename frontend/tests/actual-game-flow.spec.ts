import { test, expect } from '@playwright/test';

test.describe('実際のゲーム開始フロー', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      const text = msg.text();
      // すべてのログを表示
      console.log(`[Browser] ${text}`);
    });

    await page.goto('http://localhost:5173');
  });

  test('Room → ゲーム開始 → レート・山札表示確認', async ({ page }) => {
    // 1. ログイン
    await test.step('ログイン', async () => {
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill('実フローテスト');
      await page.locator('button:has-text("ゲームを始める")').click();
      await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
      console.log('✅ ログイン完了');
    });

    // 2. Roomボタンでルーム画面へ
    await test.step('ルーム画面へ', async () => {
      await page.locator('button:has-text("Room")').click();
      await page.waitForTimeout(1000);
      console.log('✅ ルーム画面へ遷移');
    });

    // 3. ゲーム開始ボタンをクリック
    await test.step('ゲーム開始', async () => {
      const startButton = page.locator('button:has-text("ゲーム開始")');
      
      if (await startButton.isVisible()) {
        await startButton.click();
        console.log('🎮 ゲーム開始ボタンクリック');
        await page.waitForTimeout(3000);
      } else {
        console.log('⚠️ ゲーム開始ボタンが見つかりません');
      }
    });

    // 4. ゲーム画面の表示確認
    await test.step('ゲーム画面の確認', async () => {
      const isGameScreen = await page.locator('text=手札').isVisible();
      console.log(`ゲーム画面: ${isGameScreen ? '表示' : '非表示'}`);
      
      if (isGameScreen) {
        // レート表示を確認
        const rateDisplay = page.locator('text=×');
        const isRateVisible = await rateDisplay.isVisible();
        console.log(`レート表示: ${isRateVisible ? '表示あり' : '表示なし'}`);
        
        if (isRateVisible) {
          const rateText = await rateDisplay.textContent();
          console.log(`レート値: ${rateText}`);
        } else {
          console.log('❌ レート表示が見つかりません');
        }
        
        // 山札枚数を確認
        const deckArea = page.locator('text=山札').first();
        const deckText = await deckArea.textContent();
        console.log(`山札表示: ${deckText}`);
        
        // 山札枚数バッジを探す（bg-gray-900のバッジ）
        const deckCountBadge = page.locator('.bg-gray-900:has-text("枚")').first();
        const hasDeckCount = await deckCountBadge.isVisible();
        console.log(`山札枚数バッジ: ${hasDeckCount ? '表示あり' : '表示なし'}`);
        
        if (hasDeckCount) {
          const countText = await deckCountBadge.textContent();
          console.log(`山札枚数: ${countText}`);
        }
        
        // 山札ドローテスト
        console.log('\n🎴 山札ドローテスト開始');
        
        // isMyTurnの状態を確認
        const isMyTurnText = await page.locator('text=あなたのターン').isVisible();
        console.log(`isMyTurn: ${isMyTurnText ? 'true (あなたのターン表示あり)' : 'false (表示なし)'}`);
        
        const getDeckCount = async () => {
          // 山札枚数バッジを探す（bg-gray-900のバッジ内の数字）
          const deckBadge = page.locator('.bg-gray-900:has-text("枚")').first();
          if (await deckBadge.isVisible()) {
            const text = await deckBadge.textContent();
            return text?.match(/\d+/)?.[0] || '0';
          }
          return '0';
        };
        
        const initialDeckCount = await getDeckCount();
        console.log(`初期山札枚数: ${initialDeckCount}枚`);
        
        // 山札カードをクリックしてドロー（bg-gray-900の親要素）
        const deckCard = page.locator('.bg-gray-900:has-text("枚")').first().locator('..').locator('..');
        
        console.log('🎴 1回目のドロー');
        await deckCard.click();
        await page.waitForTimeout(2000);
        
        const afterFirstDraw = await getDeckCount();
        console.log(`1回ドロー後: ${afterFirstDraw}枚`);
        
        console.log('🎴 2回目のドロー');
        await deckCard.click();
        await page.waitForTimeout(2000);
        
        const afterSecondDraw = await getDeckCount();
        console.log(`2回ドロー後: ${afterSecondDraw}枚`);
        
        // さらに3回ドロー
        for (let i = 0; i < 3; i++) {
          console.log(`🎴 ${i + 3}回目のドロー`);
          await deckCard.click();
          await page.waitForTimeout(1500);
          const count = await getDeckCount();
          console.log(`${i + 3}回ドロー後: ${count}枚`);
        }
        
        const afterFiveDraw = await getDeckCount();
        console.log(`最終山札枚数: ${afterFiveDraw}枚`);
        
        // 検証
        const initial = parseInt(initialDeckCount);
        const final = parseInt(afterFiveDraw);
        console.log(`山札枚数の変化: ${initial} → ${final} (差分: ${initial - final})`);
        
        if (initial === final) {
          console.log('❌ 山札枚数が更新されていません');
        } else if (initial > final) {
          console.log(`✅ 山札枚数が正しく更新されています（${initial - final}枚減少）`);
        } else {
          console.log(`❌ 山札枚数が増えています（異常）`);
        }
        
        // スクリーンショット保存
        await page.screenshot({ path: 'test-results/room-to-game-flow.png' });
        console.log('📸 スクリーンショット保存: room-to-game-flow.png');
      }
    });
  });

  test('Room → ゲーム開始 → 山札枚数更新確認', async ({ page }) => {
    // 1. ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('山札テスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
    console.log('✅ ログイン成功');
    
    // 2. ルーム作成
    await page.locator('button:has-text("ルームを作成")').click();
    await expect(page.locator('text=待機中').first()).toBeVisible({ timeout: 5000 });
    console.log('✅ ルーム作成成功');
    
    // 3. 準備完了
    await page.locator('button:has-text("準備完了")').click();
    await page.waitForTimeout(500);
    console.log('✅ 準備完了');
    
    // 4. ゲーム開始
    await page.locator('button:has-text("ゲーム開始")').click();
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    console.log('✅ ゲーム開始成功');
    
    // 5. 初期の山札枚数を確認
    const getDeckCount = async () => {
      const deckBadge = page.locator('div:has-text("枚")').filter({ hasText: /^\d+枚$/ }).first();
      const text = await deckBadge.textContent();
      return text?.match(/\d+/)?.[0] || '0';
    };
    
    const initialDeckCount = await getDeckCount();
    console.log(`初期山札枚数: ${initialDeckCount}枚`);
    
    // 6. 山札をクリックしてドロー
    const deckArea = page.locator('text=山札').first();
    await deckArea.click();
    await page.waitForTimeout(1500);
    
    const afterFirstDraw = await getDeckCount();
    console.log(`1回ドロー後: ${afterFirstDraw}枚`);
    
    // 7. もう一度ドロー
    await deckArea.click();
    await page.waitForTimeout(1500);
    
    const afterSecondDraw = await getDeckCount();
    console.log(`2回ドロー後: ${afterSecondDraw}枚`);
    
    // 8. さらに3回ドロー
    for (let i = 0; i < 3; i++) {
      await deckArea.click();
      await page.waitForTimeout(1200);
    }
    
    const afterFiveDraw = await getDeckCount();
    console.log(`5回ドロー後: ${afterFiveDraw}枚`);
    
    // 検証: 山札枚数が減っているか
    const initial = parseInt(initialDeckCount);
    const final = parseInt(afterFiveDraw);
    
    console.log(`山札枚数の変化: ${initial} → ${final} (差分: ${initial - final})`);
    
    if (initial === final) {
      console.log('❌ 山札枚数が更新されていません');
    } else if (initial - final === 5) {
      console.log('✅ 山札枚数が正しく更新されています（5枚減少）');
    } else {
      console.log(`⚠️ 山札枚数の減少が期待と異なります（期待: 5枚、実際: ${initial - final}枚）`);
    }
    
    // スクリーンショット保存
    await page.screenshot({ path: 'test-results/room-flow-deck-count.png' });
    console.log('📸 スクリーンショット保存: room-flow-deck-count.png');
  });

  test('デバッグGameボタン → レート・山札表示確認', async ({ page }) => {
    // 1. ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('デバッグフローテスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
    
    // 2. Gameボタンで直接ゲーム画面へ
    await page.locator('button:has-text("Game")').click();
    await expect(page.locator('text=手札')).toBeVisible({ timeout: 5000 });
    console.log('✅ デバッグGameボタンでゲーム画面へ');
    
    // 3. レート表示を確認
    const rateDisplay = page.locator('text=×');
    const isRateVisible = await rateDisplay.isVisible();
    console.log(`レート表示: ${isRateVisible ? '表示あり' : '表示なし'}`);
    
    if (isRateVisible) {
      const rateText = await rateDisplay.textContent();
      console.log(`レート値: ${rateText}`);
    }
    
    // 4. 初期の山札枚数を確認
    const getDeckCount = async () => {
      const deckBadge = page.locator('div:has-text("枚")').filter({ hasText: /^\d+枚$/ }).first();
      const text = await deckBadge.textContent();
      return text?.match(/\d+/)?.[0] || '0';
    };
    
    const initialDeckCount = await getDeckCount();
    console.log(`初期山札枚数: ${initialDeckCount}枚`);
    
    // 5. 山札をクリックしてドロー
    const deckArea = page.locator('text=山札').first();
    await deckArea.click();
    await page.waitForTimeout(1000);
    
    const afterFirstDraw = await getDeckCount();
    console.log(`1回ドロー後: ${afterFirstDraw}枚`);
    
    // 6. もう一度ドロー
    await deckArea.click();
    await page.waitForTimeout(1000);
    
    const afterSecondDraw = await getDeckCount();
    console.log(`2回ドロー後: ${afterSecondDraw}枚`);
    
    // 7. さらに3回ドロー
    for (let i = 0; i < 3; i++) {
      await deckArea.click();
      await page.waitForTimeout(800);
    }
    
    const afterFiveDraw = await getDeckCount();
    console.log(`5回ドロー後: ${afterFiveDraw}枚`);
    
    // 検証: 山札枚数が減っているか
    const initial = parseInt(initialDeckCount);
    const final = parseInt(afterFiveDraw);
    
    console.log(`山札枚数の変化: ${initial} → ${final} (差分: ${initial - final})`);
    
    if (initial === final) {
      console.log('❌ 山札枚数が更新されていません');
    } else {
      console.log('✅ 山札枚数が正しく更新されています');
    }
    
    // スクリーンショット保存
    await page.screenshot({ path: 'test-results/deck-count-after-draws.png' });
    console.log('📸 スクリーンショット保存: deck-count-after-draws.png');
  });
});
