/**
 * Application Entry Point & Router
 */

import { fetchChildren } from './api-client.js';
// 新しく作成するデバイス別ビューをインポート
import PCDashboardView from './components/PCDashboardView.js';
import MobileChildView from './components/MobileChildView.js';

async function initApp() {
    const root = document.getElementById('spt-app-root');
    if (!root) return;

    if (!window.sptConfig) {
        root.innerHTML = `<div class="spt-empty-state">設定が読み込めませんでした</div>`;
        return;
    }

    try {
        // 全員のデータを取得
        const children = await fetchChildren();

        // --- ルーティング（デバイス判定） ---
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // 【スマホ版】子供用フォーカスUIを起動
            MobileChildView.render(root, children);
        } else {
            // 【PC版】親・管理者用ダッシュボードを起動
            PCDashboardView.render(root, children);
        }

        // 画面サイズが変わった時のリロード処理（簡易レスポンシブ対応）
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const newIsMobile = window.innerWidth < 768;
                if (isMobile !== newIsMobile) {
                    location.reload(); // デバイス判定が変わったらアプリを再起動
                }
            }, 250);
        });

    } catch (error) {
        root.innerHTML = `<div class="spt-empty-state spt-error">
            <p>データの読み込みに失敗しました。</p>
            <p><small>${error.message}</small></p>
        </div>`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
