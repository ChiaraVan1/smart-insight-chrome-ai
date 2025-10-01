// sidebar.js - 侧边栏UI组件
// 主要的用户交互界面，支持分步渲染和实时更新

class CareerSidebar {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.currentData = null;
        this.renderSteps = ['flashcard', 'icebreaker', 'questions', 'email'];
        this.currentStep = 0;
        this.animationDuration = 300;
        
        this.init();
    }

    init() {
        this.createSidebarContainer();
        this.bindEvents();
        this.loadStyles();
    }

    createSidebarContainer() {
        // 创建侧边栏容器
        this.container = document.createElement('div');
        this.container.id = 'career-assistant-sidebar';
        this.container.className = 'career-sidebar hidden';
        
        this.container.innerHTML = `
            <div class="sidebar-header">
                <div class="header-title">
                    <h3>🎯 Career Assistant</h3>
                    <div class="header-actions">
                        <button class="btn-icon refresh-btn" title="刷新分析">🔄</button>
                        <button class="btn-icon minimize-btn" title="最小化">➖</button>
                        <button class="btn-icon close-btn" title="关闭">✖️</button>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
            
            <div class="sidebar-content">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>正在分析页面内容...</p>
                </div>
                
                <div class="content-sections" style="display: none;">
                    <!-- 速记卡片区 -->
                    <section class="flashcard-section collapsible">
                        <div class="section-header" data-section="flashcard">
                            <h4>📋 速记卡片</h4>
                            <div class="section-actions">
                                <button class="btn-icon audio-btn" title="语音播放">🔊</button>
                                <button class="btn-icon collapse-btn" title="折叠">⬆️</button>
                            </div>
                        </div>
                        <div class="section-content">
                            <div class="flashcard-content"></div>
                        </div>
                    </section>
                    
                    <!-- 开场白区 -->
                    <section class="icebreaker-section">
                        <div class="section-header">
                            <h4>💬 开场白</h4>
                            <div class="section-actions">
                                <button class="btn-icon copy-btn" title="复制">📋</button>
                            </div>
                        </div>
                        <div class="section-content">
                            <div class="icebreaker-content"></div>
                        </div>
                    </section>
                    
                    <!-- 问题列表区 -->
                    <section class="questions-section">
                        <div class="section-header">
                            <h4>❓ 深入问题</h4>
                        </div>
                        <div class="section-content">
                            <div class="questions-list"></div>
                        </div>
                    </section>
                    
                    <!-- 邮件草稿区 -->
                    <section class="email-section collapsible collapsed">
                        <div class="section-header" data-section="email">
                            <h4>📧 跟进邮件</h4>
                            <div class="section-actions">
                                <button class="btn-icon gmail-btn" title="发送到Gmail">📧</button>
                                <button class="btn-icon collapse-btn" title="展开">⬇️</button>
                            </div>
                        </div>
                        <div class="section-content">
                            <div class="email-content"></div>
                        </div>
                    </section>
                </div>
                
                <div class="sidebar-footer">
                    <div class="cost-info">
                        <span class="cost-label">本次分析成本:</span>
                        <span class="cost-value">$0.00</span>
                    </div>
                    <button class="btn-secondary save-btn">💾 保存到历史</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
    }

    loadStyles() {
        const styles = `
            .career-sidebar {
                position: fixed;
                top: 0;
                right: 0;
                width: 380px;
                height: 100vh;
                background: #ffffff;
                border-left: 1px solid #e1e5e9;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .career-sidebar.visible {
                transform: translateX(0);
            }
            
            .sidebar-header {
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                color: white;
                padding: 16px;
                border-bottom: 1px solid #e1e5e9;
            }
            
            .header-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .header-title h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            
            .header-actions {
                display: flex;
                gap: 8px;
            }
            
            .btn-icon {
                background: rgba(255,255,255,0.2);
                border: none;
                border-radius: 4px;
                padding: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            
            .btn-icon:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .progress-bar {
                height: 3px;
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: #ffffff;
                width: 0%;
                transition: width 0.5s ease;
            }
            
            .sidebar-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }
            
            .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: #666;
            }
            
            .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #4A90E2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .content-sections section {
                border-bottom: 1px solid #f0f0f0;
                animation: slideInUp 0.4s ease;
            }
            
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                background: #f8f9fa;
                cursor: pointer;
            }
            
            .section-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
                color: #333;
            }
            
            .section-actions {
                display: flex;
                gap: 6px;
            }
            
            .section-content {
                padding: 16px;
                line-height: 1.5;
            }
            
            .collapsible.collapsed .section-content {
                display: none;
            }
            
            .flashcard-content {
                background: #f8f9ff;
                border: 1px solid #e1e8ff;
                border-radius: 8px;
                padding: 16px;
            }
            
            .key-points {
                margin-bottom: 16px;
            }
            
            .key-points h5 {
                margin: 0 0 8px 0;
                font-size: 13px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .key-points ul {
                margin: 0;
                padding-left: 16px;
            }
            
            .key-points li {
                margin-bottom: 6px;
                font-size: 13px;
                color: #333;
            }
            
            .golden-quote {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                border-radius: 6px;
                padding: 12px;
                font-style: italic;
                font-size: 13px;
                color: #333;
                border-left: 4px solid #ffc107;
            }
            
            .question-item {
                background: #ffffff;
                border: 1px solid #e1e5e9;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .question-item:hover {
                border-color: #4A90E2;
                box-shadow: 0 2px 4px rgba(74,144,226,0.1);
            }
            
            .question-priority {
                display: inline-block;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                margin-right: 8px;
            }
            
            .priority-P0 { background: #ff4757; color: white; }
            .priority-P1 { background: #ffa502; color: white; }
            .priority-P2 { background: #2ed573; color: white; }
            
            .question-text {
                font-size: 13px;
                color: #333;
                margin-bottom: 6px;
            }
            
            .question-source {
                font-size: 11px;
                color: #666;
                text-decoration: underline;
                cursor: pointer;
            }
            
            .email-content {
                background: #f8f9fa;
                border-radius: 6px;
                padding: 16px;
            }
            
            .email-subject {
                font-weight: 600;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e1e5e9;
            }
            
            .email-body {
                font-size: 13px;
                line-height: 1.6;
                color: #333;
            }
            
            .sidebar-footer {
                padding: 16px;
                border-top: 1px solid #e1e5e9;
                background: #f8f9fa;
            }
            
            .cost-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                font-size: 12px;
                color: #666;
            }
            
            .btn-secondary {
                width: 100%;
                padding: 10px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: background 0.2s;
            }
            
            .btn-secondary:hover {
                background: #545b62;
            }
            
            .source-highlight {
                background: #fff3cd !important;
                border: 2px solid #ffc107 !important;
                animation: highlight-pulse 2s ease-in-out;
            }
            
            @keyframes highlight-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    bindEvents() {
        // 关闭按钮
        this.container.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
        });
        
        // 最小化按钮
        this.container.querySelector('.minimize-btn').addEventListener('click', () => {
            this.minimize();
        });
        
        // 刷新按钮
        this.container.querySelector('.refresh-btn').addEventListener('click', () => {
            this.refresh();
        });
        
        // 折叠/展开功能
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.section-header[data-section]')) {
                const section = e.target.closest('section');
                this.toggleSection(section);
            }
        });
        
        // 复制功能
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyContent(e.target);
            }
        });
        
        // 语音播放
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('audio-btn')) {
                this.playAudio();
            }
        });
        
        // 问题来源链接
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('question-source')) {
                this.highlightSource(e.target.dataset.source);
            }
        });
        
        // 保存到历史
        this.container.querySelector('.save-btn').addEventListener('click', () => {
            this.saveToHistory();
        });
    }

    show() {
        this.container.classList.remove('hidden');
        setTimeout(() => {
            this.container.classList.add('visible');
        }, 10);
        this.isVisible = true;
    }

    hide() {
        this.container.classList.remove('visible');
        setTimeout(() => {
            this.container.classList.add('hidden');
        }, this.animationDuration);
        this.isVisible = false;
    }

    minimize() {
        // 实现最小化逻辑
        this.container.style.height = '60px';
        this.container.querySelector('.sidebar-content').style.display = 'none';
    }

    // 分步渲染内容
    async renderContent(data) {
        this.currentData = data;
        this.showLoading();
        
        // 逐步渲染各个部分
        for (let i = 0; i < this.renderSteps.length; i++) {
            const step = this.renderSteps[i];
            await this.renderStep(step, data);
            this.updateProgress((i + 1) / this.renderSteps.length * 100);
            await this.delay(500); // 延迟显示，增强用户体验
        }
        
        this.hideLoading();
        this.updateCostInfo(data.metadata);
    }

    showLoading() {
        this.container.querySelector('.loading-state').style.display = 'flex';
        this.container.querySelector('.content-sections').style.display = 'none';
    }

    hideLoading() {
        this.container.querySelector('.loading-state').style.display = 'none';
        this.container.querySelector('.content-sections').style.display = 'block';
    }

    updateProgress(percentage) {
        const progressFill = this.container.querySelector('.progress-fill');
        progressFill.style.width = `${percentage}%`;
    }

    async renderStep(step, data) {
        switch (step) {
            case 'flashcard':
                this.renderFlashcard(data.flashcard);
                break;
            case 'icebreaker':
                this.renderIcebreaker(data.icebreaker);
                break;
            case 'questions':
                this.renderQuestions(data.questions);
                break;
            case 'email':
                this.renderEmail(data.email_draft);
                break;
        }
    }

    renderFlashcard(flashcard) {
        if (!flashcard) return;
        
        const content = this.container.querySelector('.flashcard-content');
        content.innerHTML = `
            <div class="key-points">
                <h5>关键要点</h5>
                <ul>
                    ${flashcard.key_points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
            <div class="golden-quote">
                💡 "${flashcard.golden_quote}"
            </div>
            <div class="reading-time" style="margin-top: 12px; font-size: 11px; color: #666;">
                预计阅读时间: ${flashcard.reading_time}秒
            </div>
        `;
    }

    renderIcebreaker(icebreaker) {
        if (!icebreaker) return;
        
        const content = this.container.querySelector('.icebreaker-content');
        content.innerHTML = `
            <div class="icebreaker-text" style="font-size: 14px; color: #333; margin-bottom: 12px;">
                ${icebreaker.icebreaker}
            </div>
            <div class="icebreaker-meta" style="font-size: 11px; color: #666;">
                语气: ${icebreaker.tone} | 基于 ${icebreaker.based_on_sources?.length || 0} 个信息点
            </div>
        `;
    }

    renderQuestions(questions) {
        if (!questions || questions.length === 0) return;
        
        const content = this.container.querySelector('.questions-list');
        content.innerHTML = questions.map(question => `
            <div class="question-item">
                <div class="question-header">
                    <span class="question-priority priority-${question.priority}">${question.priority}</span>
                    <span class="question-category">${question.category}</span>
                </div>
                <div class="question-text">${question.text}</div>
                <div class="question-source" data-source="${question.source}">
                    来源: ${question.source} ↗
                </div>
            </div>
        `).join('');
    }

    renderEmail(emailDraft) {
        if (!emailDraft) return;
        
        const content = this.container.querySelector('.email-content');
        content.innerHTML = `
            <div class="email-subject">
                <strong>主题:</strong> ${emailDraft.subject}
            </div>
            <div class="email-body">
                ${emailDraft.body.replace(/\n/g, '<br>')}
            </div>
            <div class="email-meta" style="margin-top: 12px; font-size: 11px; color: #666;">
                语气: ${emailDraft.tone} | 期望回应: ${emailDraft.call_to_action}
            </div>
        `;
    }

    updateCostInfo(metadata) {
        if (!metadata) return;
        
        const costValue = this.container.querySelector('.cost-value');
        costValue.textContent = `$${metadata.cost_usd?.toFixed(4) || '0.0000'}`;
    }

    // 工具方法
    toggleSection(section) {
        section.classList.toggle('collapsed');
        const collapseBtn = section.querySelector('.collapse-btn');
        if (collapseBtn) {
            collapseBtn.textContent = section.classList.contains('collapsed') ? '⬇️' : '⬆️';
        }
    }

    async copyContent(button) {
        const section = button.closest('section');
        const content = section.querySelector('.section-content').textContent.trim();
        
        try {
            await navigator.clipboard.writeText(content);
            const originalText = button.textContent;
            button.textContent = '✅';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1000);
        } catch (error) {
            console.error('复制失败:', error);
        }
    }

    playAudio() {
        const flashcardContent = this.container.querySelector('.flashcard-content').textContent;
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(flashcardContent);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }

    highlightSource(source) {
        // 在页面中高亮显示来源
        const elements = document.querySelectorAll(`[data-source-id="${source}"]`);
        elements.forEach(el => {
            el.classList.add('source-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                el.classList.remove('source-highlight');
            }, 3000);
        });
    }

    async saveToHistory() {
        if (!this.currentData) return;
        
        try {
            const { db } = await import('../storage/database.js');
            await db.saveProfile({
                profile_url: window.location.href,
                raw_data: this.currentData.raw_data,
                analyzed_data: this.currentData
            });
            
            const saveBtn = this.container.querySelector('.save-btn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✅ 已保存';
            setTimeout(() => {
                saveBtn.textContent = originalText;
            }, 2000);
            
        } catch (error) {
            console.error('保存失败:', error);
        }
    }

    refresh() {
        // 触发重新分析
        window.dispatchEvent(new CustomEvent('career-assistant-refresh'));
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.CareerSidebar = CareerSidebar;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CareerSidebar;
}
