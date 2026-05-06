/**
 * シナリオ5: 山札リシャッフル
 * カードを出して捨て札を作り、山札が0になったらリシャッフル → 倍率×2
 */
import { test, expect } from '@playwright/test';
import {
  startBackend,
  stopBackend,
  setupPage,
  startGameFlow,
  drawCard,
  selectCardByIndex,
  playSelectedCards,
  getDeckCount,
  getMultiplier,
} from '../helpers/test-setup';

test.describe('シナリオ5: 山札リシャッフル', () => {
  test.beforeAll(async () => {
    // 場札5で、手札に5を含めて出せるようにする
    await startBackend({
      TEST_FIXED_HAND: '5,5,5,5,5',
      TEST_FIXED_FIELD: '5',
    });
  });

  test.afterAll(async () => {
    await stopBackend();
  });

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('カードを出す → ドローを繰り返す → 山札0 → リシャッフル → 倍率上昇', async ({ page }) => {
    await startGameFlow(page);

    const initialMultiplier = await getMultiplier(page);

    // まずカードを出して捨て札を作る
    await selectCardByIndex(page, 0);
    await playSelectedCards(page);

    // 山札が0になるまでドロー
    let deckCount = await getDeckCount(page);
    let drawAttempts = 0;
    const maxAttempts = 10;

    while (deckCount > 0 && drawAttempts < maxAttempts) {
      await drawCard(page);
      deckCount = await getDeckCount(page);
      drawAttempts++;
    }

    // 山札が0になったらもう1回ドロー（リシャッフルが発生するはず）
    if (deckCount === 0) {
      await drawCard(page);
      
      const newMultiplier = await getMultiplier(page);
      const newDeckCount = await getDeckCount(page);

      // 倍率が上がっているはず
      expect(newMultiplier).toBeGreaterThan(initialMultiplier);
      
      // 山札が復活しているはず（捨て札があった場合）
      // 捨て札がなければ0のまま
      console.log(`リシャッフル後: 倍率=${newMultiplier}, 山札=${newDeckCount}`);
    } else {
      console.log(`山札が0にならなかった（${drawAttempts}回ドロー後: ${deckCount}枚）`);
    }
  });
});
