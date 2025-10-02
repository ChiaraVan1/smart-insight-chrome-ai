// chrome-ai-setup-guide.js - Chrome AI 设置指导组件
// 检测 Chrome AI 可用性并提供用户友好的设置指导

class ChromeAISetupGuide {
    constructor() {
        this.setupModal = null;
        this.currentStep = 0;
        this.checkInterval = null;
        
        this.setupSteps = [
            {
                title: '检查 Chrome 版本',
                description: '确保使用 Chrome 127+ (Dev/Canary 版本)',
                icon: '🌐',
                action: 'checkChromeVersion',
                autoCheck: true
            },
            {
                title: '启用设备端模型',
                description: '访问 chrome://flags/#optimization-guide-on-device-model',
                icon: '🧠',
                action: 'enableDeviceModel',
                flagUrl: 'chrome://flags/#optimization-guide-on-device-model',
                setting: 'Enabled BypassPrefRequirement'
            },
            {
                title: '启用 Prompt API',
                description: '访问 chrome://flags/#prompt-api-for-gemini-nano',
                icon: '💬',
                action: 'enablePromptAPI',
                flagUrl: 'chrome://flags/#prompt-api-for-gemini-nano',
                setting: 'Enabled'
            },
            {
                title: '重启浏览器',
                description: '重启 Chrome 以应用设置',
                icon: '🔄',
                action: 'restartBrowser'
            },
            {
                title: '等待模型下载',
                description: 'Gemini Nano 模型正在下载...',
                icon: '📥',
                action: 'waitForModel',
                autoCheck: true
            }
        ];
    }

    // 检查 Chrome AI 可用性
    async checkChromeAIAvailability() {
        const status = {
            chromeVersion: this.getChromeVersion(),
            aiSupported: !!window.ai,
            promptAPI: null,
            summarizerAPI: null,
            modelReady: false,
            needsSetup: false
        };

        try {
            if (window.ai) {
                // 检查 Prompt API
                if (window.ai.canCreateTextSession) {
                    status.promptAPI = await window.ai.canCreateTextSession();
                    status.modelReady = status.promptAPI === 'readily';
                }

                // 检查 Summarizer API
                if (window.ai.summarizer) {
                    const capabilities = await window.ai.summarizer.capabilities();
                    status.summarizerAPI = capabilities.available;
                }
            }

            status.needsSetup = !status.modelReady;
            
        } catch (error) {
            console.warn('Chrome AI 检查失败:', error);
            status.needsSetup = true;
        }

        return status;
    }

    // 获取 Chrome 版本
    getChromeVersion() {
        const userAgent = navigator.userAgent;
        const match = userAgent.match(/Chrome\/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    // 显示设置指导
    async showSetupGuide() {
        const status = await this.checkChromeAIAvailability();
        
        if (!status.needsSetup) {
            this.showSuccessMessage();
            return;
        }

        this.createSetupModal(status);
        this.startSetupProcess(status);
    }

    // 创建设置模态框
    createSetupModal(status) {
        // 移除已存在的模态框
        if (this.setupModal) {
            this.setupModal.remove();
        }

        this.setupModal = document.createElement('div');
        this.setupModal.className = 'chrome-ai-setup-modal';
        this.setupModal.innerHTML = `
            <div class="setup-overlay"></div>
            <div class="setup-container">
                <div class="setup-header">
                    <h2>🤖 启用 Chrome AI 功能</h2>
                    <p>SmartInsight 需要 Chrome 内置 AI 来提供隐私保护的分析服务</p>
                    <button class="close-btn" onclick="this.closest('.chrome-ai-setup-modal').remove()">×</button>
                </div>
                
                <div class="setup-content">
                    <div class="status-overview">
                        <div class="status-item ${status.chromeVersion >= 127 ? 'success' : 'error'}">
                            <span class="status-icon">${status.chromeVersion >= 127 ? '✅' : '❌'}</span>
                            <span>Chrome 版本: ${status.chromeVersion}</span>
                        </div>
                        <div class="status-item ${status.aiSupported ? 'success' : 'error'}">
                            <span class="status-icon">${status.aiSupported ? '✅' : '❌'}</span>
                            <span>AI API 支持: ${status.aiSupported ? '已支持' : '不支持'}</span>
                        </div>
                        <div class="status-item ${status.modelReady ? 'success' : 'warning'}">
                            <span class="status-icon">${status.modelReady ? '✅' : '⏳'}</span>
                            <span>模型状态: ${this.getModelStatusText(status.promptAPI)}</span>
                        </div>
                    </div>

                    <div class="setup-steps">
                        ${this.setupSteps.map((step, index) => this.renderSetupStep(step, index, status)).join('')}
                    </div>

                    <div class="setup-actions">
                        <button class="btn-secondary" onclick="this.closest('.chrome-ai-setup-modal').remove()">
                            稍后设置
                        </button>
                        <button class="btn-primary" onclick="chromeAIGuide.startAutoSetup()">
                            🚀 自动设置指导
                        </button>
                    </div>
                </div>

                <div class="setup-benefits">
                    <h3>🌟 Chrome AI 优势</h3>
                    <div class="benefits-grid">
                        <div class="benefit-item">
                            <span class="benefit-icon">🔒</span>
                            <span>完全隐私保护</span>
                        </div>
                        <div class="benefit-item">
                            <span class="benefit-icon">💰</span>
                            <span>完全免费</span>
                        </div>
                        <div class="benefit-item">
                            <span class="benefit-icon">⚡</span>
                            <span>瞬时响应</span>
                        </div>
                        <div class="benefit-item">
                            <span class="benefit-icon">📴</span>
                            <span>离线可用</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        this.addSetupStyles();
        
        document.body.appendChild(this.setupModal);
    }

    // 渲染设置步骤
    renderSetupStep(step, index, status) {
        const isCompleted = this.isStepCompleted(step, status);
        const isCurrent = index === this.currentStep;
        
        return `
            <div class="setup-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}" data-step="${index}">
                <div class="step-icon">${step.icon}</div>
                <div class="step-content">
                    <h4>${step.title}</h4>
                    <p>${step.description}</p>
                    ${step.flagUrl ? `
                        <div class="step-actions">
                            <button class="btn-flag" onclick="chromeAIGuide.openFlag('${step.flagUrl}')">
                                打开设置页面
                            </button>
                            <span class="setting-hint">设置为: <code>${step.setting}</code></span>
                        </div>
                    ` : ''}
                </div>
                <div class="step-status">
                    ${isCompleted ? '✅' : isCurrent ? '⏳' : '⭕'}
                </div>
            </div>
        `;
    }

    // 判断步骤是否完成
    isStepCompleted(step, status) {
        switch (step.action) {
            case 'checkChromeVersion':
                return status.chromeVersion >= 127;
            case 'enableDeviceModel':
            case 'enablePromptAPI':
                return status.aiSupported;
            case 'waitForModel':
                return status.modelReady;
            default:
                return false;
        }
    }

    // 获取模型状态文本
    getModelStatusText(promptAPI) {
        switch (promptAPI) {
            case 'readily':
                return '已就绪';
            case 'after-download':
                return '下载中';
            case 'no':
                return '不可用';
            default:
                return '未知';
        }
    }

    // 开始自动设置流程
    async startAutoSetup() {
        this.currentStep = 0;
        await this.processCurrentStep();
    }

    // 处理当前步骤
    async processCurrentStep() {
        if (this.currentStep >= this.setupSteps.length) {
            this.showCompletionMessage();
            return;
        }

        const step = this.setupSteps[this.currentStep];
        const stepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        
        if (stepElement) {
            stepElement.classList.add('current');
        }

        switch (step.action) {
            case 'checkChromeVersion':
                await this.checkChromeVersionStep();
                break;
            case 'enableDeviceModel':
            case 'enablePromptAPI':
                await this.enableFlagStep(step);
                break;
            case 'restartBrowser':
                await this.restartBrowserStep();
                break;
            case 'waitForModel':
                await this.waitForModelStep();
                break;
        }
    }

    // Chrome 版本检查步骤
    async checkChromeVersionStep() {
        const version = this.getChromeVersion();
        
        if (version >= 127) {
            this.completeStep();
        } else {
            this.showError('请升级到 Chrome 127+ (Dev/Canary 版本)');
        }
    }

    // 启用 Flag 步骤
    async enableFlagStep(step) {
        this.showMessage(`请在新标签页中设置 ${step.title}`);
        
        // 自动打开 Flag 页面
        if (step.flagUrl) {
            this.openFlag(step.flagUrl);
        }

        // 等待用户确认
        this.waitForUserConfirmation();
    }

    // 重启浏览器步骤
    async restartBrowserStep() {
        this.showMessage('请重启 Chrome 浏览器以应用设置');
        
        // 提供重启提醒
        setTimeout(() => {
            if (confirm('设置完成后，请重启 Chrome 浏览器。\n\n点击确定继续，取消稍后重启。')) {
                this.completeStep();
            }
        }, 2000);
    }

    // 等待模型下载步骤
    async waitForModelStep() {
        this.showMessage('正在检查 Gemini Nano 模型状态...');
        
        // 定期检查模型状态
        this.checkInterval = setInterval(async () => {
            const status = await this.checkChromeAIAvailability();
            
            if (status.modelReady) {
                clearInterval(this.checkInterval);
                this.completeStep();
            } else if (status.promptAPI === 'after-download') {
                this.showMessage('Gemini Nano 模型正在下载，请稍候...');
            }
        }, 3000);
    }

    // 完成当前步骤
    completeStep() {
        const stepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (stepElement) {
            stepElement.classList.add('completed');
            stepElement.classList.remove('current');
        }

        this.currentStep++;
        setTimeout(() => this.processCurrentStep(), 1000);
    }

    // 等待用户确认
    waitForUserConfirmation() {
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '我已完成设置';
        confirmButton.className = 'btn-confirm';
        confirmButton.onclick = () => {
            confirmButton.remove();
            this.completeStep();
        };

        const stepElement = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (stepElement) {
            stepElement.appendChild(confirmButton);
        }
    }

    // 打开 Chrome Flag 页面
    openFlag(flagUrl) {
        try {
            chrome.tabs.create({ url: flagUrl });
        } catch (error) {
            // 如果在 content script 中，使用 window.open
            window.open(flagUrl, '_blank');
        }
    }

    // 显示消息
    showMessage(message) {
        console.log('Chrome AI Setup:', message);
        
        // 更新 UI 中的消息
        const messageElement = document.querySelector('.setup-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    // 显示错误
    showError(error) {
        console.error('Chrome AI Setup Error:', error);
        alert(`设置错误: ${error}`);
    }

    // 显示成功消息
    showSuccessMessage() {
        if (this.setupModal) {
            this.setupModal.innerHTML = `
                <div class="setup-overlay"></div>
                <div class="setup-container success">
                    <div class="success-content">
                        <div class="success-icon">🎉</div>
                        <h2>Chrome AI 已就绪！</h2>
                        <p>SmartInsight 现在可以使用完全隐私保护的本地 AI 分析</p>
                        <div class="success-features">
                            <div class="feature">🔒 数据不离开设备</div>
                            <div class="feature">⚡ 瞬时响应</div>
                            <div class="feature">💰 完全免费</div>
                        </div>
                        <button class="btn-primary" onclick="this.closest('.chrome-ai-setup-modal').remove()">
                            开始使用
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // 显示完成消息
    showCompletionMessage() {
        this.showMessage('设置完成！正在验证 Chrome AI 状态...');
        
        setTimeout(async () => {
            const status = await this.checkChromeAIAvailability();
            if (status.modelReady) {
                this.showSuccessMessage();
            } else {
                this.showError('设置可能未完全生效，请重启浏览器后重试');
            }
        }, 2000);
    }

    // 添加样式
    addSetupStyles() {
        if (document.getElementById('chrome-ai-setup-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'chrome-ai-setup-styles';
        styles.textContent = `
            .chrome-ai-setup-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .setup-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }

            .setup-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }

            .setup-header {
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                color: white;
                padding: 30px;
                border-radius: 20px 20px 0 0;
                position: relative;
            }

            .setup-header h2 {
                margin: 0 0 10px 0;
                font-size: 1.8em;
            }

            .setup-header p {
                margin: 0;
                opacity: 0.9;
            }

            .close-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .setup-content {
                padding: 30px;
            }

            .status-overview {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 30px;
            }

            .status-item {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                font-size: 14px;
            }

            .status-item:last-child {
                margin-bottom: 0;
            }

            .status-icon {
                margin-right: 10px;
                font-size: 16px;
            }

            .setup-steps {
                margin-bottom: 30px;
            }

            .setup-step {
                display: flex;
                align-items: flex-start;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 15px;
                border: 2px solid #e9ecef;
                transition: all 0.3s ease;
            }

            .setup-step.current {
                border-color: #4A90E2;
                background: #f8fbff;
            }

            .setup-step.completed {
                border-color: #28a745;
                background: #f8fff8;
            }

            .step-icon {
                font-size: 24px;
                margin-right: 15px;
                flex-shrink: 0;
            }

            .step-content {
                flex: 1;
            }

            .step-content h4 {
                margin: 0 0 5px 0;
                color: #333;
            }

            .step-content p {
                margin: 0 0 10px 0;
                color: #666;
                font-size: 14px;
            }

            .step-actions {
                margin-top: 10px;
            }

            .btn-flag {
                background: #4A90E2;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                margin-right: 10px;
            }

            .btn-flag:hover {
                background: #357ABD;
            }

            .setting-hint {
                font-size: 12px;
                color: #666;
            }

            .setting-hint code {
                background: #f1f3f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
            }

            .step-status {
                font-size: 20px;
                flex-shrink: 0;
            }

            .setup-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-bottom: 30px;
            }

            .btn-primary, .btn-secondary {
                padding: 12px 24px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .btn-primary {
                background: linear-gradient(135deg, #4A90E2, #357ABD);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(74, 144, 226, 0.3);
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .btn-secondary:hover {
                background: #5a6268;
            }

            .setup-benefits {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
            }

            .setup-benefits h3 {
                margin: 0 0 15px 0;
                text-align: center;
            }

            .benefits-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }

            .benefit-item {
                display: flex;
                align-items: center;
                font-size: 14px;
            }

            .benefit-icon {
                margin-right: 8px;
                font-size: 16px;
            }

            .setup-container.success {
                text-align: center;
            }

            .success-content {
                padding: 50px 30px;
            }

            .success-icon {
                font-size: 4em;
                margin-bottom: 20px;
            }

            .success-content h2 {
                color: #28a745;
                margin-bottom: 15px;
            }

            .success-features {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin: 30px 0;
                flex-wrap: wrap;
            }

            .success-features .feature {
                background: #f8fff8;
                color: #28a745;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
            }

            .btn-confirm {
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            }

            .btn-confirm:hover {
                background: #218838;
            }

            @media (max-width: 768px) {
                .setup-container {
                    width: 95%;
                    margin: 20px;
                }

                .setup-header, .setup-content {
                    padding: 20px;
                }

                .benefits-grid {
                    grid-template-columns: 1fr;
                }

                .success-features {
                    flex-direction: column;
                    align-items: center;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // 清理资源
    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        if (this.setupModal) {
            this.setupModal.remove();
        }
    }
}

// 创建全局实例
window.chromeAIGuide = new ChromeAISetupGuide();

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChromeAISetupGuide;
}
