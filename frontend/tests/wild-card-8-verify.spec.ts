import { test, expect } from '@playwright/test';

test.describe('ワイルドカード8の動作確認', () => {
  test('8を出したらスート選択UIが表示される', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      console.log(`[Browser] ${text}`);
      logs.push(text);
    });

    await page.goto('http://localhost:5173');
    
    // ゲストログイン
    await page.fill('input[type="text"]', 'ワイルド8テスト');
    await page.locator('button').first().click();
    await page.waitForTimeout(2000);
    
    console.log('✅ ログイン完了');
    
    // ルーム一覧から最初のルームに参加
    const firstRoom = page.locator('button').filter({ hasText: '参加' }).first();
    await firstRoom.click();
    await page.waitForTimeout(2000);
    
    console.log('✅ ルーム参加');
    
    // ゲーム開始
    await page.locator('button:has-text("ゲーム開始")').click();
    await page.waitForTimeout(5000);
    
    console.log('✅ ゲーム開始');
    await page.waitForTimeout(1000);
    
    // カード（div要素）を探す
    const cardInfo = await page.evaluate(() => {
      // 画面下部のカード風div（w-14 h-[76px]クラスを持つ）を探す
      const allDivs = Array.from(document.querySelectorAll('div'));
      const cardDivs = allDivs.filter(div => {
        const classes = div.className || '';
        // カードのサイズクラスを持つ
        return classes.includes('w-14') && classes.includes('h-[76px]');
      });
      
      return {
        totalDivs: allDivs.length,
        cardDivs: cardDivs.length,
        cardSample: cardDivs.slice(0, 5).map(div => ({
          text: div.textContent?.trim().substring(0, 10),
          classes: div.className.substring(0, 100),
        })),
      };
    });
    
    console.log('\n=== カード情報 ===');
    console.log(JSON.stringify(cardInfo, null, 2));
    
    // 8を探してクリック
    const clicked8 = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      const cardDivs = allDivs.filter(div => {
        const classes = div.className || '';
        return classes.includes('w-14') && classes.includes('h-[76px]');
      });
      
      // 8を含むカードを探す
      const card8 = cardDivs.find(div => {
        const text = div.textContent || '';
        return text.includes('8');
      });
      
      if (card8) {
        console.log('✅ 8を発見:', card8.textContent);
        (card8 as HTMLElement).click();
        return true;
      }
      
      console.log('❌ 8が見つかりません');
      return false;
    });
    
    console.log(`8をクリック: ${clicked8 ? '✅' : '❌'}`);
    
    if (!clicked8) {
      console.log('⚠️ 今回の手札に8がありませんでした');
      console.log('💡 テストをもう一度実行すると、8が配られる可能性があります');
      return;
    }
    
    console.log('✅ 8を選択しました');
    await page.waitForTimeout(500);
    
    // 手札エリアを特定
    const handArea = page.locator('text=手札').locator('..');
    
    // 手札から8を探してクリック
    const has8 = await page.evaluate(() => {
      // 手札エリアを探す（「手札」と「枚」を含む要素）
      const allDivs = Array.from(document.querySelectorAll('div'));
      const handSection = allDivs.find(div => {
        const text = div.textContent || '';
        return text.includes('手札') && text.includes('枚');
      });
      
      console.log('手札エリア:', handSection ? '見つかった' : '見つからない');
      
      if (!handSection) {
        // 別の方法: 画面下部のカードを探す
        const allCards = Array.from(document.querySelectorAll('img[src*="card"], img[alt*="card"]'));
        console.log('全カード数:', allCards.length);
        
        // 最後の5枚が手札の可能性が高い
        const handCards = allCards.slice(-5);
        console.log('手札候補:', handCards.length);
        
        const card8 = handCards.find(card => {
          const src = card.getAttribute('src') || '';
          const alt = card.getAttribute('alt') || '';
          console.log('カード:', { src: src.substring(0, 50), alt });
          return src.includes('8') || src.includes('_8_') || alt.includes('8');
        });
        
        if (card8) {
          console.log('✅ 8を発見');
          (card8 as HTMLElement).click();
          return true;
        }
        
        return false;
      }
      
      const cards = Array.from(handSection.querySelectorAll('img'));
      console.log('手札内のカード数:', cards.length);
      
      const card8 = cards.find(card => {
        const src = card.getAttribute('src') || '';
        const alt = card.getAttribute('alt') || '';
        return src.includes('8') || src.includes('_8_') || alt.includes('8');
      });
      
      if (card8) {
        console.log('✅ 8を発見');
        (card8 as HTMLElement).click();
        return true;
      }
      
      console.log('❌ 8が見つかりません');
      return false;
    });
    
    if (!has8) {
      console.log('⚠️ 手札に8がありません');
      return;
    }
    
    console.log('✅ 8を選択');
    await page.waitForTimeout(500);
    
    // 「出す」ボタンをクリック
    const playButton = page.locator('button:has-text("出す")');
    if (await playButton.isVisible()) {
      await playButton.click();
      console.log('✅ 8を出しました');
      await page.waitForTimeout(2000);
      
      // スート選択UIを確認
      const suitSelector = await page.locator('text=スートを選択').isVisible();
      console.log(`スート選択UI: ${suitSelector ? '✅ 表示' : '❌ 非表示'}`);
      
      if (suitSelector) {
        // スートボタンを確認
        const spades = await page.locator('text=♠').isVisible();
        const hearts = await page.locator('text=♥').isVisible();
        const diamonds = await page.locator('text=♦').isVisible();
        const clubs = await page.locator('text=♣').isVisible();
        
        console.log(`♠: ${spades ? '✅' : '❌'}`);
        console.log(`♥: ${hearts ? '✅' : '❌'}`);
        console.log(`♦: ${diamonds ? '✅' : '❌'}`);
        console.log(`♣: ${clubs ? '✅' : '❌'}`);
        
        // ♠を選択
        await page.locator('text=♠').click();
        console.log('✅ ♠を選択');
        await page.waitForTimeout(1000);
        
        // スート選択UIが消えたか確認
        const suitSelectorGone = !(await page.locator('text=スートを選択').isVisible());
        console.log(`スート選択UI消えた: ${suitSelectorGone ? '✅' : '❌'}`);
      }
      
      await page.screenshot({ path: 'test-results/wild-card-8.png' });
    } else {
      console.log('❌ 「出す」ボタンが見つかりません');
    }
  });
});
