import { fetchProgress, updateProgress } from '../api-client.js';

/**
 * スマホ向け 子供用フォーカスUI (Focus & Log)
 */
export default class MobileChildView {
    static mountEl = null;
    static childrenList = [];
    static currentChildId = null;
    static tasks = [];

    // タイマー管理用
    static activeTimerId = null; // 計測中のタスクID
    static timerInterval = null;
    static startTime = null;
    static elapsedSeconds = 0;

    static render(mountEl, children) {
        this.mountEl = mountEl;
        this.childrenList = children;

        if (this.childrenList.length === 0) {
            this.mountEl.innerHTML = `<div class="spt-empty-state">まずはPCからアカウント（お子様）を登録してください。</div>`;
            return;
        }

        // スマホ版の基本レイアウト
        this.mountEl.innerHTML = `
            <div class="spt-mobile-view" style="max-width: 100%; padding: 10px; font-family: sans-serif;">
                <header style="text-align: center; margin-bottom: 20px;">
                    <h2 style="font-size: 1.4rem; color: var(--spt-primary); margin:0;">🚀 今日のミッション</h2>
                    <p style="color: var(--spt-text-muted); font-size: 0.8rem; margin-top:5px;">ストップウォッチで時間をはかろう！</p>
                </header>

                <div class="spt-form-group" style="margin-bottom: 20px;">
                    <select id="spt-mobile-child-select" style="width: 100%; padding: 15px; font-size: 1.1rem; border-radius: 12px; border: 2px solid var(--spt-primary); background: #f0fdf4; font-weight: bold; text-align: center;">
                        <option value="">-- なまえをえらんでね --</option>
                        ${this.childrenList.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('')}
                    </select>
                </div>

                <div id="spt-mobile-task-area" style="display: none;"></div>
            </div>
        `;

        const selectEl = document.getElementById('spt-mobile-child-select');
        selectEl.addEventListener('change', (e) => this.handleChildSelect(e.target.value));
    }

    /**
     * 子供が選択された時の処理（タスクの取得と描画）
     */
    static async handleChildSelect(childId) {
        const taskArea = document.getElementById('spt-mobile-task-area');

        if (!childId) {
            taskArea.style.display = 'none';
            this.currentChildId = null;
            this.stopTimer(); // 別の子供に切り替えたらタイマーリセット
            return;
        }

        this.currentChildId = childId;
        taskArea.style.display = 'block';
        taskArea.innerHTML = `<div class="spt-loading">ミッションをよみこみ中...</div>`;

        try {
            const allTasks = await fetchProgress(childId);
            // 「未着手」と「進行中」のタスクだけを抽出（完了したものは見せない）
            this.tasks = allTasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
            this.renderTasks();
        } catch (error) {
            taskArea.innerHTML = `<div class="spt-empty-state spt-error">エラーがおきました: ${error.message}</div>`;
        }
    }

    /**
     * タスクリストの描画
     */
    static renderTasks() {
        const taskArea = document.getElementById('spt-mobile-task-area');

        // ▼▼ 1. 追加: 子供の現在地（ステージ）判定ロジック ▼▼
        const child = this.childrenList.find(c => c.id == this.currentChildId);
        const gradeStr = child ? (child.grade || '') : '';
        const goalStr = child && child.goal ? child.goal : 'トップ大学合格';

        let currentStage = { title: '冒険のはじまり', icon: '🎒' };
        if (gradeStr.includes('小5') || gradeStr.includes('小6')) currentStage = { title: '論理思考の地盤固め', icon: '🌱' };
        else if (gradeStr.includes('中1') || gradeStr.includes('中2')) currentStage = { title: '中学範囲の早期コンパイル', icon: '⚔️' };
        else if (gradeStr.includes('中3')) currentStage = { title: '高校カリキュラムへのアーリーアクセス', icon: '🚀' };
        else if (gradeStr.includes('高1') || gradeStr.includes('高2')) currentStage = { title: '全範囲の修了と理社稼働', icon: '🔥' };
        else if (gradeStr.includes('高3')) currentStage = { title: '過去問での徹底デバッグ', icon: '👑' };

        // ▼▼ 2. 追加: モチベーションを高めるRPG風バナーUI ▼▼
        let html = `
            <div style="background: linear-gradient(135deg, var(--spt-primary), #8b5cf6); color: white; border-radius: 16px; padding: 20px; margin-bottom: 25px; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3); position: relative; overflow: hidden;">
                <div style="position: relative; z-index: 1;">
                    <div style="font-size: 0.85rem; opacity: 0.9; font-weight: bold; margin-bottom: 5px;">🎯 最終目標: ${this.escapeHtml(goalStr)}</div>
                    <div style="font-size: 1.1rem; font-weight: bold; line-height: 1.3;">
                        ${currentStage.icon} 現在のステージ：<br>
                        <span style="font-size: 1.3rem; color: #fde047; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">${currentStage.title}</span>
                    </div>
                </div>
                <div style="position: absolute; right: -20px; bottom: -20px; font-size: 6rem; opacity: 0.15; z-index: 0; line-height: 1;">${currentStage.icon}</div>
            </div>
        `;

        // ▼▼ 3. 既存のタスク表示ロジック（html変数に結合していく形に変更） ▼▼
        if (this.tasks.length === 0) {
            html += `
                <div style="text-align:center; padding: 40px 20px; background: white; border-radius: 12px; box-shadow: var(--spt-shadow-sm);">
                    <h3 style="font-size:3rem; margin:0;">🎉</h3>
                    <p style="font-weight:bold; font-size:1.2rem; color:var(--spt-success); margin-top:10px;">今日のミッションは全部クリア！</p>
                    <p style="color:var(--spt-text-muted); font-size:0.9rem;">よくがんばりました！</p>
                </div>
            `;
        } else {
            html += '<div style="display:flex; flex-direction:column; gap:15px;">';

            this.tasks.forEach(task => {
                const isTimerActive = this.activeTimerId === task.id;
                const timerDisplay = isTimerActive ? this.formatTime(this.elapsedSeconds) : '00:00';

                html += `
                    <div class="spt-mobile-task-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: var(--spt-shadow-md); border-left: 6px solid var(--spt-primary);">
                        <div style="font-size: 0.8rem; font-weight: bold; color: var(--spt-primary); margin-bottom: 5px;">
                            📚 ${this.escapeHtml(task.subject)}
                        </div>
                        <div style="font-size: 1.1rem; font-weight: bold; line-height: 1.4; margin-bottom: 15px;">
                            ${this.escapeHtml(task.milestone)}
                        </div>
                        
                        <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 15px;">
                            <div id="timer-display-${task.id}" style="font-size: 2rem; font-family: monospace; font-weight: bold; color: ${isTimerActive ? 'var(--spt-danger)' : '#374151'};">
                                ${timerDisplay}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--spt-text-muted);">ストップウォッチ</div>
                        </div>

                        <div style="display: flex; gap: 10px;">
                            ${isTimerActive ? `
                                <button class="spt-btn spt-btn-danger" style="flex: 1; padding: 15px; font-size: 1.1rem; border-radius: 25px;" onclick="sptMobileViewFinishTask(${task.id})">
                                    ⏹️ おわり！
                                </button>
                            ` : `
                                <button class="spt-btn spt-btn-primary" style="flex: 1; padding: 15px; font-size: 1.1rem; border-radius: 25px;" onclick="sptMobileViewStartTimer(${task.id})" ${this.activeTimerId ? 'disabled' : ''}>
                                    ▶️ はじめる
                                </button>
                            `}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        taskArea.innerHTML = html;

        // グローバルに関数を露出
        window.sptMobileViewStartTimer = (id) => this.startTimer(id);
        window.sptMobileViewFinishTask = (id) => this.finishTask(id);
    }

    /**
     * タイマー開始
     */
    static startTimer(taskId) {
        if (this.activeTimerId) return; // 既に別のタイマーが動いていればブロック

        this.activeTimerId = taskId;
        this.startTime = Date.now();
        this.elapsedSeconds = 0;

        // UIを再描画してボタンを切り替え
        this.renderTasks();

        // 1秒ごとに表示を更新
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            const displayEl = document.getElementById(`timer-display-${taskId}`);
            if (displayEl) {
                displayEl.textContent = this.formatTime(this.elapsedSeconds);
            }
        }, 1000);
    }

    /**
     * タイマー停止 ＆ タスク完了（API送信）
     */
    static async finishTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // タイマーを止める
        clearInterval(this.timerInterval);

        // 分単位に変換（切り上げ）
        const measuredMinutes = Math.ceil(this.elapsedSeconds / 60);
        // 元々DBに入っている実学習時間(actual_time)に今回の計測時間を足す
        const previousTime = parseInt(task.actual_time, 10) || 0;
        const newActualTime = previousTime + measuredMinutes;

        // 通信中のUIブロック
        const displayEl = document.getElementById(`timer-display-${taskId}`);
        if (displayEl) displayEl.textContent = 'きろく中...';

        try {
            // APIに「ステータス=完了(done)」と「実学習時間(actual_time)」を送信して更新
            await updateProgress(taskId, {
                status: 'done',
                actual_time: newActualTime
            });

            // 成功したら内部データから消して再描画
            this.stopTimer();
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.renderTasks();

            // ゲーミフィケーションの演出（簡易版）
            alert(`🎉 クリア！\n${measuredMinutes}分 がんばりました！`);

        } catch (error) {
            alert('きろくに失敗しました。もう一度ためしてね。');
            // 失敗したらタイマーを再開させるなどのハンドリングも可能ですが、今回は停止状態に戻す
            this.stopTimer();
            this.renderTasks();
        }
    }

    /**
     * タイマーの完全リセット
     */
    static stopTimer() {
        clearInterval(this.timerInterval);
        this.activeTimerId = null;
        this.elapsedSeconds = 0;
    }

    /**
     * 秒数を MM:SS にフォーマット
     */
    static formatTime(totalSeconds) {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    static escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }
}
