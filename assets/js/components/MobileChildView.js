/**
 * スマホ向け 子供用フォーカスUI (Focus & Log)
 */
export default class MobileChildView {

    static render(mountEl, children) {
        if (children.length === 0) {
            mountEl.innerHTML = `<div class="spt-empty-state">まずはPCからアカウント（お子様）を登録してください。</div>`;
            return;
        }

        // スマホ版の基本レイアウト（ゲームやアプリのようなUI）
        mountEl.innerHTML = `
            <div class="spt-mobile-view" style="max-width: 100%; padding: 10px; font-family: sans-serif;">
                <header style="text-align: center; margin-bottom: 20px;">
                    <h2 style="font-size: 1.2rem; color: var(--spt-primary);">🚀 今日のミッション</h2>
                </header>

                <div class="spt-form-group" style="margin-bottom: 20px;">
                    <label style="font-size: 0.9rem; font-weight: bold;">だれが学習しますか？</label>
                    <select id="spt-mobile-child-select" style="width: 100%; padding: 12px; font-size: 1.1rem; border-radius: 8px;">
                        <option value="">-- なまえをえらんでね --</option>
                        ${children.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                </div>

                <div id="spt-mobile-task-area" style="text-align: center; padding: 30px; background: white; border-radius: 12px; box-shadow: var(--spt-shadow-md); display: none;">
                    <h3 style="margin-bottom: 10px;">⏳ タイマー機能など（準備中）</h3>
                    <p style="color: var(--spt-text-muted); font-size: 0.9rem;">ここに「勉強開始」ボタンと、<br>かかった時間を記録するUIを作ります。</p>
                </div>
            </div>
        `;

        // ユーザー（子供）が自分を選んだ時の処理
        const selectEl = document.getElementById('spt-mobile-child-select');
        const taskArea = document.getElementById('spt-mobile-task-area');

        selectEl.addEventListener('change', (e) => {
            if (e.target.value) {
                taskArea.style.display = 'block';
                // 次のステップで、ここに選択した子供の「未完了タスク」だけをAPIで取得して表示する処理を書きます。
            } else {
                taskArea.style.display = 'none';
            }
        });
    }
}
