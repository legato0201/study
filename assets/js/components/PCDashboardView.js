import ChildSelector from './ChildSelector.js';
import ProgressBoard from './ProgressBoard.js';

/**
 * PC向け 親用ダッシュボード (Strategy & Analytics)
 */
export default class PCDashboardView {

    static render(mountEl, children) {
        // PC版の基本レイアウト
        mountEl.innerHTML = `
            <div class="spt-pc-dashboard" style="background: var(--spt-bg-site); padding: 20px;">
                <header class="spt-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2>👨‍🏫 戦略ダッシュボード (PC版)</h2>
                        <p style="color: var(--spt-text-muted); margin-top: 5px;">登録されているお子様の学習状況を俯瞰します。</p>
                    </div>
                    <div style="background: white; padding: 10px 20px; border-radius: 8px; box-shadow: var(--spt-shadow-sm);">
                        <strong>総登録人数:</strong> ${children.length} 名
                    </div>
                </header>

                <div id="spt-pc-selector-mount" style="margin-top: 20px; margin-bottom: 20px;"></div>
                
                <div id="spt-pc-board-mount" style="background: white; padding: 20px; border-radius: 8px; box-shadow: var(--spt-shadow-sm);"></div>
            </div>
        `;

        const selectorMount = document.getElementById('spt-pc-selector-mount');
        const boardMount = document.getElementById('spt-pc-board-mount');

        // 既存のコンポーネントをPC版レイアウトの中に展開
        ChildSelector.init(selectorMount, children, (selectedChild) => {
            if (selectedChild) {
                ProgressBoard.render(boardMount, selectedChild);
            } else {
                boardMount.innerHTML = `<div class="spt-empty-state">お子様を選択するか、新しく追加してください。</div>`;
            }
        });
    }
}
