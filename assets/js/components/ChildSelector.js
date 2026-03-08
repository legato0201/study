import { createChild } from '../api-client.js';

/**
 * ChildSelector Component
 * 子供の切り替えUIと、新規追加UIを管理する
 */
export default class ChildSelector {

    static mountEl = null;
    static childrenList = [];
    static activeChild = null;
    static onChangeCallback = null;

    /**
     * コンポーネントの初期化
     */
    static init(mountElement, initialChildren, onChange) {
        this.mountEl = mountElement;
        this.childrenList = initialChildren || [];
        this.onChangeCallback = onChange;

        // 初期選択 (存在する場合最初の子供を選択)
        if (this.childrenList.length > 0) {
            this.activeChild = this.childrenList[0];
        }

        this.render();
        // 初期選択状態を親に通知
        this.onChangeCallback(this.activeChild);
    }

    /**
     * 子供を切り替える
     */
    static selectChild(childId) {
        const child = this.childrenList.find(c => parseInt(c.id, 10) === parseInt(childId, 10));
        if (child) {
            this.activeChild = child;
            this.render();
            this.onChangeCallback(this.activeChild);
        }
    }

    /**
     * 描画
     */
    static render() {
        if (!this.mountEl) return;

        let tabsHtml = '';
        if (this.childrenList.length === 0) {
            tabsHtml = `<span class="spt-text-muted">（登録されていません）</span>`;
        } else {
            tabsHtml = this.childrenList.map(child => {
                const isActive = this.activeChild && parseInt(child.id, 10) === parseInt(this.activeChild.id, 10);
                return `
                    <div class="spt-child-tab ${isActive ? 'active' : ''}" data-id="${child.id}">
                        ${this.escapeHtml(child.name)} 
                        ${child.grade ? `<small>(${this.escapeHtml(child.grade)})</small>` : ''}
                    </div>
                `;
            }).join('');
        }

        this.mountEl.innerHTML = `
            <div class="spt-child-tabs">
                ${tabsHtml}
                <button id="spt-add-child-btn" class="spt-btn spt-btn-secondary" style="border-radius:20px; padding: 4px 12px; font-size: 0.9em;">
                    + 追加
                </button>
            </div>
            
            <div id="spt-add-child-form" class="spt-form-group" style="display:none; margin-top:15px; background:var(--spt-bg-card); padding:15px; border-radius:var(--spt-radius); border:1px solid var(--spt-border);">
                <h4>新しい子供を登録</h4>
                <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
                    <div class="spt-form-group" style="flex:1; min-width:150px;">
                        <label>名前 (必須)</label>
                        <input type="text" id="spt-new-child-name" placeholder="例: 太郎">
                    </div>
                    <div class="spt-form-group" style="flex:1; min-width:120px;">
                        <label>学年</label>
                        <input type="text" id="spt-new-child-grade" placeholder="例: 小4">
                    </div>
                    <div class="spt-form-group" style="flex:2; min-width:200px;">
                        <label>目標</label>
                        <input type="text" id="spt-new-child-goal" placeholder="例: 毎日音読する">
                    </div>
                    <div style="padding-bottom: 2px;">
                        <button id="spt-submit-child-btn" class="spt-btn spt-btn-primary">保存</button>
                        <button id="spt-cancel-child-btn" class="spt-btn spt-btn-secondary">キャンセル</button>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
    }

    /**
     * イベント付与
     */
    static attachEvents() {
        // タブ切り替えクリック
        const tabs = this.mountEl.querySelectorAll('.spt-child-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.selectChild(id);
            });
        });

        const addBtn = document.getElementById('spt-add-child-btn');
        const formDiv = document.getElementById('spt-add-child-form');
        const submitBtn = document.getElementById('spt-submit-child-btn');
        const cancelBtn = document.getElementById('spt-cancel-child-btn');

        // フォーム表示トグル
        if (addBtn) addBtn.addEventListener('click', () => formDiv.style.display = 'block');
        if (cancelBtn) cancelBtn.addEventListener('click', () => {
            formDiv.style.display = 'none';
            document.getElementById('spt-new-child-name').value = '';
        });

        // 新規登録保存
        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                const nameInput = document.getElementById('spt-new-child-name');
                const gradeInput = document.getElementById('spt-new-child-grade');
                const goalInput = document.getElementById('spt-new-child-goal');

                const name = nameInput.value.trim();
                const grade = gradeInput.value.trim();
                const goal = goalInput.value.trim();

                if (!name) {
                    alert('名前を入力してください');
                    nameInput.focus();
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = '保存中...';

                try {
                    const newChild = await createChild({ name, grade, goal });
                    this.childrenList.push(newChild);
                    this.selectChild(newChild.id); // 切り替え＆再描画
                } catch (error) {
                    alert('登録に失敗しました: ' + error.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = '保存';
                }
            });
        }
    }

    /**
     * 基本的なXSS対策
     */
    static escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
}
