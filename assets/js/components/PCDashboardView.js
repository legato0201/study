import ChildSelector from './ChildSelector.js';
import ProgressBoard from './ProgressBoard.js';
import { fetchProgress } from '../api-client.js';

/**
 * PC向け 親用ダッシュボード (Strategy & Analytics)
 */
export default class PCDashboardView {

    static chartInstances = [];

    // 東大・京大合格に向けた標準的な逆算マイルストーン定義
    static roadmapStages = [
        { id: 's1', grade: '小5-小6', title: '論理思考の地盤固め', desc: '算数の四則演算・割合の完璧化、長文要約の習慣化' },
        { id: 's2', grade: '中1-中2', title: '中学範囲の早期コンパイル', desc: '中2冬までに中学3年間の英数を独学で完了' },
        { id: 's3', grade: '中3', title: '高校カリキュラムへのアーリーアクセス', desc: '高校数学(I・A)と高校英文法の基礎開始' },
        { id: 's4', grade: '高1-高2', title: '全範囲の修了と理社稼働', desc: '高2終了時までに受験必要な全科目の基礎範囲を修了' },
        { id: 's5', grade: '高3', title: '過去問での徹底デバッグ', desc: '東大・京大の過去問（10〜20年分）をひたすら演習・添削' }
    ];

    static async render(mountEl, children) {
        mountEl.innerHTML = `
            <div class="spt-pc-dashboard" style="background: var(--spt-bg-site); padding: 20px;">
                <header class="spt-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.8rem; color: var(--spt-text-main);">👨‍🏫 戦略ダッシュボード</h2>
                        <p style="color: var(--spt-text-muted); margin-top: 5px;">チーム全体の学習進捗と、合格までのロードマップを俯瞰します。</p>
                    </div>
                    <div id="spt-pc-overall-summary" style="background: white; padding: 15px 25px; border-radius: 8px; box-shadow: var(--spt-shadow-sm); text-align: right; min-width: 200px;">
                        <span style="color: var(--spt-text-muted); font-size: 0.9rem;">データ集計中...</span>
                    </div>
                </header>

                <div id="spt-pc-summary-cards" style="display: flex; gap: 20px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 30px;">
                    </div>

                <hr style="border: none; border-top: 1px solid var(--spt-border); margin-bottom: 30px;">

                <div style="display: flex; gap: 20px; align-items: flex-start;">
                    <div style="flex: 2; min-width: 0;">
                        <h3 style="margin-bottom: 15px; color: var(--spt-text-main);">📋 個別タスク管理・割り当て</h3>
                        <div id="spt-pc-selector-mount" style="margin-bottom: 20px;"></div>
                        <div id="spt-pc-board-mount" style="background: white; padding: 20px; border-radius: 12px; box-shadow: var(--spt-shadow-sm);"></div>
                    </div>

                    <div style="flex: 1; min-width: 300px; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--spt-shadow-sm); position: sticky; top: 20px;">
                        <h3 style="margin-bottom: 5px; color: var(--spt-text-main); font-size: 1.2rem;">🗺️ 合格逆算ロードマップ</h3>
                        <p style="color: var(--spt-text-muted); font-size: 0.85rem; margin-bottom: 20px;">現在選択中のお子様のステージ</p>
                        <div id="spt-pc-roadmap-mount">
                            <div class="spt-empty-state" style="padding: 20px;">お子様を選択してください</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const summaryCardsMount = document.getElementById('spt-pc-summary-cards');
        const overallSummaryMount = document.getElementById('spt-pc-overall-summary');

        // 既存のグラフを破棄
        this.chartInstances.forEach(chart => chart.destroy());
        this.chartInstances = [];

        try {
            // 全ての子供のタスクデータを並行して取得し、統計情報を計算
            const childrenWithStats = await Promise.all(children.map(async (child) => {
                const tasks = await fetchProgress(child.id);
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.status === 'done').length;
                const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                let totalActualTime = 0;
                const subjectTimes = {};

                tasks.forEach(task => {
                    const time = parseInt(task.actual_time, 10) || 0;
                    totalActualTime += time;
                    if (time > 0) {
                        const subject = task.subject || 'その他';
                        subjectTimes[subject] = (subjectTimes[subject] || 0) + time;
                    }
                });

                return {
                    ...child,
                    stats: { totalTasks, completedTasks, progressPercent, totalActualTime, subjectTimes }
                };
            }));

            // オーバーオールサマリーの描画
            const teamTotalTime = childrenWithStats.reduce((sum, c) => sum + c.stats.totalActualTime, 0);
            overallSummaryMount.innerHTML = `
                <div style="font-size: 0.9rem; color: var(--spt-text-muted); margin-bottom: 4px;">チーム総学習時間</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: var(--spt-primary); line-height: 1;">
                    ${Math.floor(teamTotalTime / 60)}<span style="font-size: 1rem; color: var(--spt-text-main); margin: 0 4px;">時間</span>${teamTotalTime % 60}<span style="font-size: 1rem; color: var(--spt-text-main); margin-left: 2px;">分</span>
                </div>
            `;

            // 個別サマリーカードとグラフの描画
            if (childrenWithStats.length === 0) {
                summaryCardsMount.innerHTML = `<div class="spt-empty-state" style="width: 100%;">お子様が登録されていません。まずは下から追加してください。</div>`;
            } else {
                summaryCardsMount.innerHTML = childrenWithStats.map(child => `
                    <div style="min-width: 320px; flex: 1; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--spt-shadow-sm); border-top: 5px solid var(--spt-primary); display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4 style="margin: 0; font-size: 1.2rem; color: var(--spt-text-main);">${this.escapeHtml(child.name)}</h4>
                            <span style="background: #f3f4f6; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; color: var(--spt-text-muted);">${this.escapeHtml(child.grade || '未設定')}</span>
                        </div>
                        
                        <div style="position: relative; height: 160px; margin-bottom: 15px; display: flex; justify-content: center;">
                            ${Object.keys(child.stats.subjectTimes).length > 0
                        ? `<canvas id="chart-${child.id}"></canvas>`
                        : `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f9fafb; border-radius: 8px; color: var(--spt-text-muted); font-size: 0.9rem;">学習データがありません</div>`
                    }
                        </div>

                        <div style="margin-bottom: 15px; margin-top: auto;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                                <span style="color: var(--spt-text-muted);">タスク消化率</span>
                                <span style="font-weight: bold; color: ${child.stats.progressPercent === 100 ? 'var(--spt-success)' : 'var(--spt-text-main)'};">${child.stats.progressPercent}%</span>
                            </div>
                            <div style="width: 100%; background: #e5e7eb; border-radius: 6px; height: 10px; overflow: hidden;">
                                <div style="width: ${child.stats.progressPercent}%; background: ${child.stats.progressPercent === 100 ? 'var(--spt-success)' : 'var(--spt-primary)'}; height: 100%; transition: width 0.8s ease-out;"></div>
                            </div>
                        </div>

                        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.85rem; color: var(--spt-text-muted);">累計学習時間</div>
                            <div style="font-size: 1.3rem; font-weight: bold; color: var(--spt-text-main);">
                                ${Math.floor(child.stats.totalActualTime / 60)}<span style="font-size: 0.9rem; font-weight: normal; margin: 0 2px;">h</span> 
                                ${child.stats.totalActualTime % 60}<span style="font-size: 0.9rem; font-weight: normal; margin-left: 2px;">m</span>
                            </div>
                        </div>
                    </div>
                `).join('');

                childrenWithStats.forEach(child => {
                    const canvas = document.getElementById(`chart-${child.id}`);
                    if (canvas && Object.keys(child.stats.subjectTimes).length > 0) {
                        this.renderChart(canvas, child.stats.subjectTimes);
                    }
                });
            }

        } catch (error) {
            summaryCardsMount.innerHTML = `<div style="color: var(--spt-danger); padding: 20px;">データの集計に失敗しました: ${error.message}</div>`;
        }

        const selectorMount = document.getElementById('spt-pc-selector-mount');
        const boardMount = document.getElementById('spt-pc-board-mount');
        const roadmapMount = document.getElementById('spt-pc-roadmap-mount');

        ChildSelector.init(selectorMount, children, (selectedChild) => {
            if (selectedChild) {
                ProgressBoard.render(boardMount, selectedChild);
                this.renderRoadmap(roadmapMount, selectedChild);
            } else {
                boardMount.innerHTML = `<div class="spt-empty-state">お子様を選択するか、新しく追加してください。</div>`;
                roadmapMount.innerHTML = `<div class="spt-empty-state" style="padding: 20px;">お子様を選択してください</div>`;
            }
        });
    }

    /**
     * 現在選択されている子供の学年から、ロードマップ上の現在地を描画
     */
    static renderRoadmap(mountEl, child) {
        const gradeStr = child.grade || '';

        let html = '<div style="display: flex; flex-direction: column; gap: 0;">';

        this.roadmapStages.forEach((stage, index) => {
            // 学年の文字列が含まれていれば現在地（アクティブ）と判定
            // ※簡易的な部分一致判定です。例：「小5」「中2」など
            const isActive = gradeStr && stage.grade.includes(gradeStr);
            const isPast = !isActive && index < this.roadmapStages.findIndex(s => gradeStr && s.grade.includes(gradeStr));

            const dotColor = isActive ? 'var(--spt-primary)' : (isPast ? 'var(--spt-success)' : '#d1d5db');
            const lineStyle = index === this.roadmapStages.length - 1 ? 'display: none;' : `width: 2px; height: 30px; background-color: ${isPast ? 'var(--spt-success)' : '#e5e7eb'}; margin-left: 11px; margin-top: 4px; margin-bottom: 4px;`;

            html += `
                <div style="display: flex; align-items: flex-start; opacity: ${isActive ? '1' : '0.6'}; transition: all 0.3s;">
                    <div style="display: flex; flex-direction: column; align-items: center; margin-right: 15px; margin-top: 4px;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${dotColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; font-weight: bold; box-shadow: ${isActive ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none'};">
                            ${isPast ? '✓' : (index + 1)}
                        </div>
                        <div style="${lineStyle}"></div>
                    </div>
                    <div style="padding-bottom: ${index === this.roadmapStages.length - 1 ? '0' : '15px'};">
                        <div style="font-size: 0.8rem; font-weight: bold; color: ${isActive ? 'var(--spt-primary)' : 'var(--spt-text-muted)'}; margin-bottom: 2px;">${stage.grade}</div>
                        <div style="font-size: 1rem; font-weight: bold; color: var(--spt-text-main); margin-bottom: 4px;">${stage.title}</div>
                        <div style="font-size: 0.85rem; color: var(--spt-text-muted); line-height: 1.4;">${stage.desc}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // ゴール（目標）の表示
        if (child.goal) {
            html += `
                <div style="margin-top: 25px; padding: 15px; background: #f0fdfa; border: 1px dashed var(--spt-success); border-radius: 8px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--spt-success); font-weight: bold; margin-bottom: 5px;">🎯 最終目標</div>
                    <div style="font-size: 1.1rem; font-weight: bold; color: var(--spt-text-main);">${this.escapeHtml(child.goal)}</div>
                </div>
            `;
        }

        mountEl.innerHTML = html;
    }

    // Chart描画処理 (変更なし)
    static renderChart(canvas, subjectTimes) {
        const labels = Object.keys(subjectTimes);
        const data = Object.values(subjectTimes);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

        const chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function (context) { return (context.label || '') + ': ' + context.raw + ' 分'; }
                        }
                    }
                }
            }
        });
        this.chartInstances.push(chart);
    }

    static unmount() {
        this.chartInstances.forEach(chart => chart.destroy());
    }

    static escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
}
