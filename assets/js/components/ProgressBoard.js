import { fetchProgress, deleteProgress } from '../api-client.js';
import TaskModal from './TaskModal.js';

/**
 * ProgressBoard Component
 * 選択された子供のタスクをカンバンボード形式で表示する
 */
export default class ProgressBoard {

    static mountEl = null;
    static currentChild = null;
    static tasks = [];

    // 定義済みのステータスとカラムラベル
    static columns = [
        { id: 'todo', label: '未着手 (Todo)' },
        { id: 'in_progress', label: 'インプット中 (In Progress)' },
        { id: 'review', label: '演習・テスト中 (Review)' }, // ←追加
        { id: 'done', label: '定着完了 (Done)' }
    ];

    /**
     * ボードの描画 (外部から呼ばれるエントリポイント)
     */
    static async render(mountElement, child) {
        this.mountEl = mountElement;
        this.currentChild = child;

        if (!this.mountEl) return;

        if (!this.currentChild) {
            this.mountEl.innerHTML = '<div class="spt-empty-state">お子様が選択されていません。</div>';
            return;
        }

        this.mountEl.innerHTML = '<div class="spt-loading">タスクを読み込み中...</div>';

        try {
            this.tasks = await fetchProgress(this.currentChild.id);
            this.renderBoard();
        } catch (error) {
            this.mountEl.innerHTML = `<div class="spt-empty-state spt-error">タスクの取得に失敗しました: ${error.message}</div>`;
        }
    }

    /**
     * カンバンUIの生成とDOMへの展開
     */
    static renderBoard() {
        let boardHtml = `<div class="spt-board" style="display:flex; gap:20px;">`;

        // Modalをマウントするための領域（ボード外、グローバル寄りに置くのが望ましいが簡易的にアプリルート末尾に持たせる用だが、ここでは動的生成する）
        TaskModal.init();

        this.columns.forEach(col => {
            const colTasks = this.tasks.filter(t => t.status === col.id);

            let tasksHtml = '';
            colTasks.forEach(task => {
                // ▼▼ 追加 (リンクボタンの生成) ▼▼
                const linkHtml = task.resource_url ? `<a href="${this.escapeHtml(task.resource_url)}" target="_blank" style="display:inline-block; margin-top:8px; font-size:0.8rem; color:var(--spt-primary); background:#e0f2fe; padding:4px 8px; border-radius:4px; text-decoration:none;" onclick="event.stopPropagation();">📺 動画・教材を開く</a>` : '';

                tasksHtml += `
                    <div class="spt-task-card" data-id="${task.id}">
                        <div class="spt-task-subject">${this.escapeHtml(task.subject)}</div>
                        <div class="spt-task-milestone">${this.escapeHtml(task.milestone)}</div>
                        ${linkHtml} </div>
                `;
            });

            boardHtml += `
                <div class="spt-column" data-status="${col.id}">
                    <h3>${col.label} (${colTasks.length})</h3>
                    <div class="spt-task-list" style="display:flex; flex-direction:column; gap:10px; flex:1;">
                        ${tasksHtml}
                    </div>
                    <button class="spt-add-task-btn" data-status="${col.id}">+ タスクを追加</button>
                </div>
            `;
        });

        boardHtml += `</div>`;
        this.mountEl.innerHTML = boardHtml;

        this.attachEvents();
    }

    /**
     * イベント付与
     */
    static attachEvents() {
        // 追加ボタン
        const addBtns = this.mountEl.querySelectorAll('.spt-add-task-btn');
        addBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.currentTarget.getAttribute('data-status');
                this.openModalForNewTask(status);
            });
        });

        // タスクカードクリック（編集モード）
        const cards = this.mountEl.querySelectorAll('.spt-task-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const task = this.tasks.find(t => parseInt(t.id, 10) === parseInt(id, 10));
                if (task) {
                    this.openModalForEditTask(task);
                }
            });
        });
    }

    /**
     * 新規タスク用のモーダル表示
     */
    static openModalForNewTask(defaultStatus) {
        TaskModal.open({
            mode: 'create',
            childId: this.currentChild.id,
            task: { status: defaultStatus, subject: '', milestone: '' },
            onSave: (savedTask) => {
                this.tasks.push(savedTask);
                this.renderBoard();
                // ▼▼ 追加（更新をシステム全体に通知） ▼▼
                document.dispatchEvent(new CustomEvent('spt-data-updated'));
            }
        });
    }

    /**
     * 既存タスク編集用のモーダル表示
     */
    static openModalForEditTask(task) {
        TaskModal.open({
            mode: 'edit',
            childId: this.currentChild.id,
            task: { ...task }, // コピーを渡す
            onSave: (updatedTask) => {
                const idx = this.tasks.findIndex(t => t.id == updatedTask.id);
                if (idx > -1) {
                    this.tasks[idx] = updatedTask;
                }
                this.renderBoard();
                // ▼▼ 追加（更新をシステム全体に通知） ▼▼
                document.dispatchEvent(new CustomEvent('spt-data-updated'));
            },
            onDelete: async (taskId) => {
                const confirmed = confirm("このタスクを削除しますか？");
                if (!confirmed) return;

                try {
                    await deleteProgress(taskId);
                    this.tasks = this.tasks.filter(t => t.id != taskId);
                    this.renderBoard();
                    // ▼▼ 追加（更新をシステム全体に通知） ▼▼
                    document.dispatchEvent(new CustomEvent('spt-data-updated'));
                    TaskModal.close();
                } catch (error) {
                    alert('削除に失敗しました: ' + error.message);
                }
            }
        });
    }

    /**
     * エスケープ処理
     */
    static escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }
}
