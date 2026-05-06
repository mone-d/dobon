import { test, expect } from '@playwright/test';

test.describe('ゲーム状態の詳細確認', () => {
  test('手札データの中身を確認', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));

    // 1. Home → Lobby (デバッグボタン使用)
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // デバッグボタンでLobbyへ
    const lobbyButton = page.locator('button:has-text("Lobby")');
    if (await lobbyButton.isVisible()) {
      await lobbyButton.click();
    }
    await page.waitForTimeout(1000);

    // 2. Room → ゲーム開始
    await page.locator('button:has-text("Room")').click();
    await page.waitForTimeout(1000);
    
    const startButton = page.locator('button:has-text("ゲーム開始")');
    await startButton.click();
    await page.waitForTimeout(5000);
    
    // 3. gameStoreの状態を取得
    const storeState = await page.evaluate(() => {
      const zustandStore = (window as any).useGameStore;
      if (!zustandStore) return { error: 'Store not found' };
      
      const state = zustandStore.getState();
      return {
        hasGameState: !!state.gameState,
        currentUserId: state.currentUserId,
        playersCount: state.gameState?.players?.length,
        players: state.gameState?.players?.map((p: any) => ({
          id: p.id,
          name: p.name,
          hasHand: !!p.hand,
          handLength: p.hand?.length,
          handSample: p.hand?.[0],
        })),
        currentPlayerFromFind: state.gameState?.players?.find((p: any) => p.id === state.currentUserId),
      };
    });
    
    console.log('\n=== Store State ===');
    console.log(JSON.stringify(storeState, null, 2));
    
    // 4. PlayerHandコンポーネントに渡されているpropsを確認
    const playerHandProps = await page.evaluate(() => {
      const handElement = document.querySelector('[class*="PlayerHand"]')?.parentElement;
      return {
        hasHandElement: !!handElement,
        innerHTML: handElement?.innerHTML.substring(0, 500),
      };
    });
    
    console.log('\n=== PlayerHand Element ===');
    console.log(JSON.stringify(playerHandProps, null, 2));
    
    // 5. PlayingCardコンポーネントの数を確認
    const cardCount = await page.locator('[class*="PlayingCard"]').count();
    console.log(`\n=== PlayingCard Count: ${cardCount} ===`);
  });
});
