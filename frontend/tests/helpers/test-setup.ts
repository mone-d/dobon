/**
 * 結合テスト共通ヘルパー
 * 
 * バックエンドの起動・停止、ゲーム開始までの共通フローを提供
 */
import { type Page, expect } from '@playwright/test';
import { execSync, spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '../../../backend');
const BACKEND_PORT = 3001; // テスト用ポート（開発用3000と分離）
const FRONTEND_URL = 'http://localhost:5173';

let backendProcess: ChildProcess | null = null;

/**
 * テスト用バックエンドを起動する
 */
export async function startBackend(env: Record<string, string> = {}): Promise<void> {
  await stopBackend();

  const backendEnv = {
    ...process.env,
    PORT: String(BACKEND_PORT),
    ...env,
  };

  backendProcess = spawn('npx', ['ts-node-dev', '--transpile-only', 'src/index.ts'], {
    cwd: BACKEND_DIR,
    env: backendEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // バックエンドのログを出力
  backendProcess.stdout?.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[Backend] ${msg}`);
  });
  backendProcess.stderr?.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes('ts-node-dev')) console.log(`[Backend ERR] ${msg}`);
  });

  // バックエンドの起動を待つ
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Backend startup timeout')), 15000);

    const checkHealth = async () => {
      try {
        const res = await fetch(`http://localhost:${BACKEND_PORT}/health`);
        if (res.ok) {
          clearTimeout(timeout);
          resolve();
        }
      } catch {
        // まだ起動していない
      }
    };

    const interval = setInterval(checkHealth, 500);
    backendProcess!.on('error', (err) => {
      clearInterval(interval);
      clearTimeout(timeout);
      reject(err);
    });

    // タイムアウト時にクリーンアップ
    const origReject = reject;
    reject = (err) => {
      clearInterval(interval);
      origReject(err);
    };
  });
}

/**
 * テスト用バックエンドを停止する
 */
export async function stopBackend(): Promise<void> {
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
    // ポートが解放されるまで待つ
    await new Promise(r => setTimeout(r, 1000));
  }
  // 念のためポートを使っているプロセスを停止
  try {
    execSync(`lsof -ti:${BACKEND_PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch {
    // ignore
  }
  await new Promise(r => setTimeout(r, 500));
}

/**
 * フロントエンドのWebSocket接続先をテスト用ポートに変更
 */
export async function setupPage(page: Page): Promise<void> {
  // コンソールログを出力
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser ERROR] ${msg.text()}`);
    }
  });

  // WebSocket URLをテスト用ポートに上書き
  await page.addInitScript((port) => {
    (window as any).__TEST_WS_URL__ = `ws://localhost:${port}`;
  }, BACKEND_PORT);
}

/**
 * ログイン → Room → ゲーム開始までの共通フロー
 */
export async function startGameFlow(page: Page, playerName = 'テストプレイヤー'): Promise<void> {
  await page.goto(FRONTEND_URL);
  await page.waitForTimeout(500);

  // ログイン
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill(playerName);
  await page.locator('button:has-text("ゲームを始める")').click();
  await expect(page.locator('text=DOBON ロビー')).toBeVisible({ timeout: 5000 });

  // Room画面へ
  await page.locator('button:has-text("Room")').click();
  await page.waitForTimeout(500);

  // ゲーム開始
  const startButton = page.locator('button:has-text("ゲーム開始")');
  await expect(startButton).toBeVisible({ timeout: 3000 });
  await startButton.click();

  // ゲーム画面が表示されるまで待つ
  await expect(page.getByText('手札', { exact: true })).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000); // 自動スキップ完了を待つ
}

/**
 * 山札をクリックしてカードをドローする
 */
export async function drawCard(page: Page): Promise<void> {
  // 山札のクリック可能な領域（cursor-pointer クラスを持つ要素）
  const deckClickable = page.locator('.cursor-pointer:has(.bg-gray-900:has-text("枚"))');
  await deckClickable.click();
  await page.waitForTimeout(1500); // 自動スキップ完了を待つ
}

/**
 * 手札のカードをクリックして選択する（インデックス指定）
 */
export async function selectCardByIndex(page: Page, index: number): Promise<void> {
  // PlayerHand内のカード要素（absolute positioned divs inside the hand area）
  const handContainer = page.locator('.bg-gray-900\\/70 .relative.flex.items-end');
  const cards = handContainer.locator('> .absolute.bottom-0');
  const count = await cards.count();
  if (index < count) {
    await cards.nth(index).click();
  }
  await page.waitForTimeout(300);
}

/**
 * 「X枚出す」ボタンをクリック
 */
export async function playSelectedCards(page: Page): Promise<void> {
  const playButton = page.locator('button:has-text("枚出す")');
  await expect(playButton).toBeVisible({ timeout: 3000 });
  await playButton.click();
  await page.waitForTimeout(1500); // 自動スキップ完了を待つ
}

/**
 * 山札の残り枚数を取得
 */
export async function getDeckCount(page: Page): Promise<number> {
  const badge = page.locator('.cursor-pointer .bg-gray-900').first();
  if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
    const text = await badge.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : -1;
  }
  return -1;
}

/**
 * 倍率を取得
 */
export async function getMultiplier(page: Page): Promise<number> {
  const rateEl = page.locator('text=レート').locator('..').locator('span').first();
  const text = await rateEl.textContent();
  const match = text?.match(/×(\d+)/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * 手札の枚数を取得
 */
export async function getHandCount(page: Page): Promise<number> {
  // 「手札」テキストの隣にある枚数バッジ
  const handHeader = page.locator('span:has-text("手札")').locator('..').locator('span').filter({ hasText: /^\d+枚$/ });
  const text = await handHeader.textContent();
  const match = text?.match(/(\d+)/);
  return match ? parseInt(match[1]) : -1;
}

/**
 * 自分のターンかどうかを確認
 */
export async function isMyTurn(page: Page): Promise<boolean> {
  return page.locator('text=あなたのターンです').isVisible();
}

export const BACKEND_PORT_NUM = BACKEND_PORT;
