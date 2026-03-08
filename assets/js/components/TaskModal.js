import { createProgress, updateProgress } from '../api-client.js';

/**
 * TaskModal Component
 * タスクの作成・編集・削除を行うモーダルダイアログ
 */
export default class TaskModal {

    static overlayEl = null;

    /**
     * DOMにモーダルのガワを配置する
     */
    static init() {
        if (document.getElementById('spt-task-modal-overlay')) return; // 既に存在すれば何もしない

        const modalHtml = `
            <div id="spt-task-modal-overlay" class="spt-modal-overlay">
                <div class="spt-modal">
                    <div class="spt-modal-header">
                        <h3 id="spt-modal-title">タスクを作成</h3>
                        <button class="spt-modal-close" id="spt-modal-close-btn">&times;</button>
                    </div>
                    <div class="spt-modal-body">
                        <input type="hidden" id="spt-modal-task-id">
                        <input type="hidden" id="spt-modal-child-id">
                        
                        <div class="spt-form-group">
                            <label>教科 / 分野 (Subject) *</label>
                            <input type="text" id="spt-modal-subject" placeholder="例: 算数, 国語, プログラミング">
                        </div>
                        
                        <div class="spt-form-group">
                            <label>マイルストーン (Milestone) *</label>
                            <textarea id="spt-modal-milestone" rows="3" placeholder="例: ドリル10ページから20ページまで終わらせる"></textarea>
                        </div>

                        <div class="spt-form-group">
                            <label>ステータス</label>
                            <select id="spt-modal-status">
                                <option value="todo">未着手 (Todo)</option>
                                <option value="in_progress">進行中 (In Progress)</option>
                                <option value="done">完了 (Done)</option>
                            </select>
                        </div>
                    </div>
                    <div class="spt-modal-footer space-between">
                        <button id="spt-modal-delete-btn" class="spt-btn spt-btn-danger" style="display:none;">削除</button>
                        <div>
                            <button id="spt-modal-cancel-btn" class="spt-btn spt-btn-secondary">キャンセル</button>
                            <button id="spt-modal-save-btn" class="spt-btn spt-btn-primary">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.overlayEl = document.getElementById('spt-task-modal-overlay');

        this.attachEvents();
    }

    /**
     * 静的なイベントリスナーを登録
     */
    static attachEvents() {
        document.getElementById('spt-modal-close-btn').addEventListener('click', () => this.close());
        document.getElementById('spt-modal-cancel-btn').addEventListener('click', () => this.close());

        // オーバーレイクリックで閉じる
        this.overlayEl.addEventListener('click', (e) => {
            if (e.target === this.overlayEl) this.close();
        });
    }

    /**
     * モーダルを開く
     * @param {Object} config - { mode, childId, task, onSave, onDelete }
     */
    static open(config) {
        this.config = config; // configを保存しておく

        const { mode, childId, task } = config;

        document.getElementById('spt-modal-title').textContent = mode === 'edit' ? 'タスクを編集' : '新しいタスク';
        document.getElementById('spt-modal-task-id').value = task.id || '';
        document.getElementById('spt-modal-child-id').value = childId || '';
        document.getElementById('spt-modal-subject').value = task.subject || '';
        document.getElementById('spt-modal-milestone').value = task.milestone || '';
        document.getElementById('spt-modal-status').value = task.status || 'todo';

        const deleteBtn = document.getElementById('spt-modal-delete-btn');
        if (mode === 'edit') {
            deleteBtn.style.display = 'block';
            // 古いイベントリスナを消すためにcloneするテクニック
            const newDelBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDelBtn, deleteBtn);
            newDelBtn.addEventListener('click', () => {
                if (this.config.onDelete) this.config.onDelete(task.id);
            });
        } else {
            deleteBtn.style.display = 'none';
        }

        const saveBtn = document.getElementById('spt-modal-save-btn');
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', () => this.handleSave());

        this.overlayEl.classList.add('active');
        document.getElementById('spt-modal-subject').focus();
    }

    /**
     * モーダルを閉じる
     */
    static close() {
        if (this.overlayEl) {
            this.overlayEl.classList.remove('active');
        }
    }

    /**
     * 保存処理
     */
    static async handleSave() {
        const id = document.getElementById('spt-modal-task-id').value;
        const child_id = document.getElementById('spt-modal-child-id').value;
        const subject = document.getElementById('spt-modal-subject').value.trim();
        const milestone = document.getElementById('spt-modal-milestone').value.trim();
        const status = document.getElementById('spt-modal-status').value;

        if (!subject || !milestone) {
            alert('教科とマイルストーンは必須です');
            return;
        }

        const btn = document.getElementById('spt-modal-save-btn');
        btn.disabled = true;
        btn.textContent = '保存中...';

        try {
            let savedTask;
            if (this.config.mode === 'edit') {
                savedTask = await updateProgress(id, { subject, milestone, status });
            } else {
                savedTask = await createProgress({ child_id, subject, milestone, status });
            }

            if (this.config.onSave) {
                this.config.onSave(savedTask);
            }
            this.close();

        } catch (error) {
            alert('保存に失敗しました: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = '保存';
        }
    }
}
