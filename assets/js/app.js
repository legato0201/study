/**
 * Application Entry Point
 */

import { fetchChildren } from './api-client.js';
import ChildSelector from './components/ChildSelector.js';
import ProgressBoard from './components/ProgressBoard.js';

// 1. 全体を包括していたコールバックを「initApp」関数として独立させる
async function initApp() {
    const root = document.getElementById('spt-app-root');
    if (!root) return;

    // グローバルオブジェクトがない(管理画面プレビュー等)場合のハンドリング
    if (!window.sptConfig) {
        root.innerHTML = `<div class="spt-empty-state">設定が読み込めませんでした (sptConfig is undefined)</div>`;
        return;
    }

    try {
        // APIから管理している子供の一覧を取得
        const children = await fetchChildren();

        // アプリケーションの初期UIを描画
        root.innerHTML = `
            <div class="spt-app-container">
                <header class="spt-header">
                    <h2>学習進捗管理ダッシュボード</h2>
                    <div id="spt-child-selector-mount"></div>
                </header>
                <main id="spt-progress-board-mount"></main>
            </div>
        `;

        const selectorMount = document.getElementById('spt-child-selector-mount');
        const boardMount = document.getElementById('spt-progress-board-mount');

        // 各コンポーネントの初期化
        ChildSelector.init(selectorMount, children, (selectedChild) => {
            // 子供が切り替わったら進捗ボードを再描画
            if (selectedChild) {
                ProgressBoard.render(boardMount, selectedChild);
            } else {
                boardMount.innerHTML = `<div class="spt-empty-state">お子様を選択するか、新しく追加してください。</div>`;
            }
        });

    } catch (error) {
        root.innerHTML = `<div class="spt-empty-state spt-error">
            <p>データの読み込みに失敗しました。</p>
            <p><small>${error.message}</small></p>
        </div>`;
        console.error('App initialization error:', error);
    }
}

// 2. モジュールの読み込みタイミングに合わせて確実に初期化関数をキックする
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // 既にDOM構築が完了している場合は即座に実行
    initApp();
}
