import { test, expect } from '@playwright/test';

test.describe('手札表示デバッグ', () => {
  test('手札が正しく表示されるか確認', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      console.log(`[Browser] ${text}`);
    });

    await page.goto('http://localhost:5173');
    
    // 1. ログイン
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('手札テスト');
    await page.locator('button:has-text("ゲームを始める")').click();
    await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });
    
    // 2. Room → ゲーム開始
    await page.locator('button:has-text("Room")').click();
    await page.waitForTimeout(1000);
    
    const startButton = page.locator('button:has-text("ゲーム開始")');
    await startButton.click();
    await page.waitForTimeout(5000); // 5秒待機
    
    // 3. gameStoreの状態を取得（React内部から）
    const storeState = await page.evaluate(() => {
      // Reactのファイバーツリーから状態を取得
      const root = document.querySelector('#root');
      if (!root) return { error: 'Root not found' };
      
      const reactRoot = (root as any)._reactRootContainer?._internalRoot?.current ||
                        (root as any)._reactRoot?._internalRoot?.current ||
                        (root as any).__reactContainer$?.child;
      
      // PlayerHandコンポーネントのpropsを探す
      let playerHandProps: any = null;
      const findPlayerHand = (fiber: any): any => {
        if (!fiber) return null;
        
        // PlayerHandコンポーネントを探す
        if (fiber.type?.name === 'PlayerHand' || fiber.elementType?.name === 'PlayerHand') {
          return fiber.memoizedProps;
        }
        
        // 子要素を探索
        let child = fiber.child;
        while (child) {
          const result = findPlayerHand(child);
          if (result) return result;
          child = child.sibling;
        }
        
        return null;
      };
      
      playerHandProps = findPlayerHand(reactRoot);
      
      return {
        hasReactRoot: !!reactRoot,
        playerHandProps: playerHandProps ? {
          cardsLength: playerHandProps.cards?.length,
          cardsType: Array.isArray(playerHandProps.cards) ? 'array' : typeof playerHandProps.cards,
          cards: playerHandProps.cards,
          selectedIndices: playerHandProps.selectedIndices,
        } : null,
      };
    });
    
    console.log('\n=== Store State ===');
    console.log(JSON.stringify(storeState, null, 2));
    
    // 4. PlayingCardコンポーネントの数を確認（正しいセレクタ）
    const cardSelectors = [
      'img[alt*="card"]',
      '[class*="card"]',
      'svg[class*="card"]',
      'div[style*="card"]',
    ];
    
    let cardCount = 0;
    for (const selector of cardSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`\n✅ Found ${count} cards with selector: ${selector}`);
        cardCount = count;
        break;
      }
    }
    
    if (cardCount === 0) {
      console.log('\n⚠️ Trying generic selectors...');
      // 手札エリア内の子要素を数える
      const handCards = await page.locator('text=手札').last().locator('..').locator('> div > div > div').count();
      console.log(`Hand area children: ${handCards}`);
    }
    
    // 3. Hand debugログを探す
    const handDebugLog = logs.find(log => log.includes('🎴 Hand debug:'));
    const stateUpdatedLog = logs.find(log => log.includes('📊 Game state updated:'));
    console.log('\n=== Hand Debug Log ===');
    console.log(handDebugLog || '❌ Hand debug log not found');
    console.log('\n=== State Updated Log ===');
    console.log(stateUpdatedLog || '❌ State updated log not found');
    
    // 4. 手札エリアの確認
    const handArea = page.locator('text=手札').last();
    const hasHandArea = await handArea.isVisible();
    console.log(`\n手札エリア: ${hasHandArea ? '表示あり' : '表示なし'}`);
    
    // 5. カード枚数バッジの確認
    const cardCountBadge = page.locator('text=/\\d+枚/').first();
    const badgeText = await cardCountBadge.textContent().catch(() => null);
    console.log(`カード枚数バッジ: ${badgeText || '表示なし'}`);
    
    // 6. PlayingCardコンポーネントの数を確認
    const cards = page.locator('.bg-white.rounded-lg.shadow-lg');
    const cardCount = await cards.count();
    console.log(`表示されているカード数: ${cardCount}枚`);
    
    // 7. スクリーンショット保存
    await page.screenshot({ path: 'test-results/hand-debug.png', fullPage: true });
    console.log('📸 スクリーンショット保存: hand-debug.png');
    
    // 8. 判定
    if (cardCount === 0) {
      console.log('\n❌ 問題: カードが表示されていません');
      
      // PlayerHandコンポーネントが存在するか確認
      const playerHandDiv = page.locator('.bg-gray-900\\/70.border-t-2');
      const hasPlayerHand = await playerHandDiv.isVisible();
      console.log(`PlayerHandコンポーネント: ${hasPlayerHand ? '存在する' : '存在しない'}`);
      
      // カードコンテナを確認
      const cardContainer = page.locator('div').filter({ hasText: '手札' }).first();
      const containerHTML = await cardContainer.innerHTML().catch(() => 'エラー');
      console.log('\nPlayerHand HTML:');
      console.log(containerHTML.substring(0, 500));
    } else {
      console.log(`\n✅ カードが${cardCount}枚表示されています`);
    }
  });
});
