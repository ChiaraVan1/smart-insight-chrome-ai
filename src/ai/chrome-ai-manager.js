// chrome-ai-manager.js - Chrome Built-in AI Manager
// 使用 Gemini Nano 本地模型，完全隐私保护，零成本运营

class ChromeAIManager {
    constructor() {
        this.capabilities = null;
        this.promptSession = null;
        this.summarizerSession = null;
        this.translatorSession = null;
        this.writerSession = null;
        
        // 本地缓存系统
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小时
        
        // 性能监控
        this.performanceMetrics = {
            totalRequests: 0,
            totalLatency: 0,
            cacheHits: 0,
            errors: 0
        };
        
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 初始化 Chrome AI 服务...');
            
            // 检查 Chrome AI 可用性
            if (!window.ai) {
                throw new Error('Chrome AI 不可用。请确保使用 Chrome 127+ 并启用相关功能。');
            }

            // 检查各种 AI 能力
            await this.checkCapabilities();
            
            // 初始化各种 AI 会话
            await this.initializeSessions();
            
            this.isInitialized = true;
            console.log('✅ Chrome AI 初始化完成');
            
            return {
                status: 'success',
                capabilities: this.capabilities,
                message: 'Chrome AI 已就绪'
            };
            
        } catch (error) {
            console.error('❌ Chrome AI 初始化失败:', error);
            return {
                status: 'error',
                error: error.message,
                guidance: this.getSetupGuidance()
            };
        }
    }

    async checkCapabilities() {
        console.log('🔍 检查 Chrome AI 能力...');
        
        this.capabilities = {
            prompt: null,
            summarizer: null,
            translator: null,
            writer: null
        };

        // 检查 Prompt API
        if (window.ai && window.ai.canCreateTextSession) {
            this.capabilities.prompt = await window.ai.canCreateTextSession();
            console.log('📝 Prompt API 状态:', this.capabilities.prompt);
        }

        // 检查 Summarization API
        if (window.ai && window.ai.summarizer) {
            this.capabilities.summarizer = await window.ai.summarizer.capabilities();
            console.log('📄 Summarizer API 状态:', this.capabilities.summarizer);
        }

        // 检查 Translation API
        if (window.ai && window.ai.translator) {
            this.capabilities.translator = await window.ai.translator.capabilities();
            console.log('🌍 Translator API 状态:', this.capabilities.translator);
        }

        // 检查 Writer API
        if (window.ai && window.ai.writer) {
            this.capabilities.writer = await window.ai.writer.capabilities();
            console.log('✍️ Writer API 状态:', this.capabilities.writer);
        }
    }

    async initializeSessions() {
        console.log('🔧 初始化 AI 会话...');

        // 初始化 Prompt 会话
        if (this.capabilities.prompt === 'readily') {
            this.promptSession = await window.ai.createTextSession({
                temperature: 0.8,
                topK: 3
            });
            console.log('✅ Prompt 会话已创建');
        }

        // 初始化 Summarizer 会话
        if (this.capabilities.summarizer?.available === 'readily') {
            this.summarizerSession = await window.ai.summarizer.create({
                type: 'key-points',
                format: 'markdown',
                length: 'medium'
            });
            console.log('✅ Summarizer 会话已创建');
        }

        // 初始化其他会话...
        // Translation 和 Writer 会话可以按需创建
    }

    // 主要的 AI 分析接口
    async analyzeProfile(profileData) {
        const startTime = performance.now();
        
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // 检查缓存
            const cacheKey = this.generateCacheKey('profile', profileData);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.performanceMetrics.cacheHits++;
                return cached;
            }

            const prompt = this.buildProfileAnalysisPrompt(profileData);
            const result = await this.callPromptAPI(prompt);
            
            // 解析和结构化结果
            const structuredResult = this.parseProfileAnalysis(result);
            
            // 缓存结果
            this.setCache(cacheKey, structuredResult);
            
            // 记录性能
            const latency = performance.now() - startTime;
            this.recordPerformance(latency);
            
            return structuredResult;
            
        } catch (error) {
            this.performanceMetrics.errors++;
            console.error('Profile analysis failed:', error);
            throw error;
        }
    }

    async analyzeCompany(companyData) {
        const startTime = performance.now();
        
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const cacheKey = this.generateCacheKey('company', companyData);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.performanceMetrics.cacheHits++;
                return cached;
            }

            const prompt = this.buildCompanyAnalysisPrompt(companyData);
            const result = await this.callPromptAPI(prompt);
            
            const structuredResult = this.parseCompanyAnalysis(result);
            this.setCache(cacheKey, structuredResult);
            
            const latency = performance.now() - startTime;
            this.recordPerformance(latency);
            
            return structuredResult;
            
        } catch (error) {
            this.performanceMetrics.errors++;
            console.error('Company analysis failed:', error);
            throw error;
        }
    }

    async summarizeContent(content, options = {}) {
        try {
            if (!this.summarizerSession) {
                if (this.capabilities.summarizer?.available === 'readily') {
                    this.summarizerSession = await window.ai.summarizer.create({
                        type: options.type || 'key-points',
                        format: options.format || 'markdown',
                        length: options.length || 'medium'
                    });
                } else {
                    // 降级到 Prompt API
                    const prompt = `请总结以下内容的关键要点：\n\n${content}`;
                    return await this.callPromptAPI(prompt);
                }
            }

            return await this.summarizerSession.summarize(content);
            
        } catch (error) {
            console.error('Summarization failed:', error);
            throw error;
        }
    }

    async callPromptAPI(prompt) {
        if (!this.promptSession) {
            throw new Error('Prompt API 不可用。请检查 Chrome AI 设置。');
        }

        try {
            const result = await this.promptSession.prompt(prompt);
            this.performanceMetrics.totalRequests++;
            return result;
        } catch (error) {
            console.error('Prompt API call failed:', error);
            throw new Error(`AI 分析失败: ${error.message}`);
        }
    }

    buildProfileAnalysisPrompt(profileData) {
        return `作为专业的求职顾问，请分析以下LinkedIn个人资料并提供求职建议：

个人信息：
- 姓名：${profileData.basic_info?.name || '未提供'}
- 职位：${profileData.basic_info?.headline || '未提供'}
- 当前公司：${profileData.current_position?.company || '未提供'}

工作经历：
${profileData.experiences?.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})`).join('\n') || '未提供'}

教育背景：
${profileData.education?.map(edu => `- ${edu.degree} in ${edu.field} from ${edu.school}`).join('\n') || '未提供'}

请提供以下分析：

1. **关键亮点** (3个要点)
2. **破冰开场白** (1-2句自然的对话开场)
3. **深度问题** (3个可以深入交流的问题)
4. **速记卡片** (3个关键记忆点)
5. **后续邮件模板** (专业的跟进邮件)

请确保建议实用、自然且专业。`;
    }

    buildCompanyAnalysisPrompt(companyData) {
        return `作为求职分析师，请分析以下公司信息并提供面试准备建议：

公司名称：${companyData.companyName || '未提供'}
目标职位：${companyData.targetPosition || '未提供'}
公司网址：${companyData.companyUrl || '未提供'}
额外信息：${companyData.additionalInfo || '未提供'}

请提供以下分析：

1. **公司定位** (1句话概括)
2. **发展时间线** (关键发展阶段)
3. **核心团队** (领导层特点)
4. **竞争优势** (市场地位分析)
5. **面试建议** (具体准备要点)
6. **问题建议** (3个可以向面试官提问的问题)

请确保分析客观、实用且有针对性。`;
    }

    parseProfileAnalysis(rawResult) {
        // 解析 AI 返回的文本，结构化为标准格式
        const sections = this.parseAIResponse(rawResult);
        
        return {
            flashcard: {
                key_points: this.extractKeyPoints(sections),
                golden_quote: this.extractGoldenQuote(sections),
                reading_time: 30
            },
            icebreaker: {
                icebreaker: this.extractIcebreaker(sections),
                tone: 'professional',
                based_on_sources: ['LinkedIn Profile', 'Chrome AI Analysis']
            },
            questions: this.extractQuestions(sections),
            email_draft: this.extractEmailDraft(sections),
            metadata: {
                cost_usd: 0, // Chrome AI 完全免费
                processing_time: performance.now(),
                privacy: '100% 本地处理，数据不离开设备',
                ai_model: 'Gemini Nano (Chrome Built-in)'
            }
        };
    }

    parseCompanyAnalysis(rawResult) {
        const sections = this.parseAIResponse(rawResult);
        
        return {
            positioning: this.extractPositioning(sections),
            timeline: this.extractTimeline(sections),
            keyPeople: this.extractKeyPeople(sections),
            competition: this.extractCompetition(sections),
            interviewTips: this.extractInterviewTips(sections),
            suggestedQuestions: this.extractSuggestedQuestions(sections),
            metadata: {
                cost_usd: 0,
                processing_time: performance.now(),
                privacy: '100% 本地处理',
                ai_model: 'Gemini Nano (Chrome Built-in)'
            }
        };
    }

    parseAIResponse(response) {
        // 简单的文本解析逻辑
        const sections = {};
        const lines = response.split('\n');
        let currentSection = null;
        let currentContent = [];

        for (const line of lines) {
            if (line.includes('**') || line.includes('#')) {
                if (currentSection) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                currentSection = line.replace(/[*#]/g, '').trim().toLowerCase();
                currentContent = [];
            } else if (line.trim()) {
                currentContent.push(line.trim());
            }
        }

        if (currentSection) {
            sections[currentSection] = currentContent.join('\n').trim();
        }

        return sections;
    }

    extractKeyPoints(sections) {
        const keyPointsText = sections['关键亮点'] || sections['key highlights'] || '';
        return keyPointsText.split('\n').filter(line => line.trim()).slice(0, 3);
    }

    extractGoldenQuote(sections) {
        const icebreakerText = sections['破冰开场白'] || sections['icebreaker'] || '';
        return icebreakerText.split('\n')[0] || '准备充分的对话是成功网络建设的开始';
    }

    extractIcebreaker(sections) {
        return sections['破冰开场白'] || sections['icebreaker'] || '很高兴认识您，我对您在该领域的经验很感兴趣。';
    }

    extractQuestions(sections) {
        const questionsText = sections['深度问题'] || sections['deep questions'] || '';
        const questionLines = questionsText.split('\n').filter(line => line.trim());
        
        return questionLines.slice(0, 3).map((question, index) => ({
            text: question.replace(/^[-*]\s*/, ''),
            priority: index === 0 ? 'P0' : index === 1 ? 'P1' : 'P2',
            category: '专业交流',
            source: 'Chrome AI Analysis'
        }));
    }

    extractEmailDraft(sections) {
        const emailText = sections['后续邮件模板'] || sections['follow-up email'] || '';
        return {
            subject: '很高兴认识您',
            body: emailText || '感谢今天的愉快交流，期待未来有机会进一步合作。',
            tone: 'professional',
            call_to_action: 'follow_up'
        };
    }

    extractPositioning(sections) {
        return sections['公司定位'] || sections['company positioning'] || '创新型行业领先企业';
    }

    extractTimeline(sections) {
        return sections['发展时间线'] || sections['timeline'] || '稳步发展，持续创新';
    }

    extractKeyPeople(sections) {
        return sections['核心团队'] || sections['key people'] || '经验丰富的管理团队';
    }

    extractCompetition(sections) {
        return sections['竞争优势'] || sections['competitive advantage'] || '在行业中具有独特优势';
    }

    extractInterviewTips(sections) {
        return sections['面试建议'] || sections['interview tips'] || '展示相关技能和经验，表达对公司的兴趣';
    }

    extractSuggestedQuestions(sections) {
        const questionsText = sections['问题建议'] || sections['suggested questions'] || '';
        return questionsText.split('\n').filter(line => line.trim()).slice(0, 3);
    }

    // 缓存管理
    generateCacheKey(type, data) {
        const str = JSON.stringify({ type, data });
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `chrome_ai_${Math.abs(hash)}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // 性能监控
    recordPerformance(latency) {
        this.performanceMetrics.totalRequests++;
        this.performanceMetrics.totalLatency += latency;
    }

    getPerformanceStats() {
        const avgLatency = this.performanceMetrics.totalRequests > 0 
            ? this.performanceMetrics.totalLatency / this.performanceMetrics.totalRequests 
            : 0;

        return {
            totalRequests: this.performanceMetrics.totalRequests,
            averageLatency: Math.round(avgLatency),
            cacheHitRate: this.performanceMetrics.totalRequests > 0 
                ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests * 100).toFixed(1)
                : 0,
            errorRate: this.performanceMetrics.totalRequests > 0
                ? (this.performanceMetrics.errors / this.performanceMetrics.totalRequests * 100).toFixed(1)
                : 0,
            cacheSize: this.cache.size,
            capabilities: this.capabilities,
            cost: 0, // Chrome AI 完全免费
            privacy: '100% 本地处理'
        };
    }

    // 设置指导
    getSetupGuidance() {
        return {
            title: '启用 Chrome AI 功能',
            steps: [
                '1. 确保使用 Chrome 127+ (Dev/Canary 版本)',
                '2. 访问 chrome://flags/#optimization-guide-on-device-model',
                '3. 设置为 "Enabled BypassPrefRequirement"',
                '4. 访问 chrome://flags/#prompt-api-for-gemini-nano',
                '5. 设置为 "Enabled"',
                '6. 重启浏览器',
                '7. 等待 Gemini Nano 模型下载完成'
            ],
            benefits: [
                '🔒 完全隐私保护 - 数据不离开设备',
                '⚡ 极速响应 - 本地处理无延迟',
                '💰 完全免费 - 无需任何 API 密钥',
                '📴 离线可用 - 无需网络连接'
            ]
        };
    }

    // 清理资源
    async cleanup() {
        if (this.promptSession) {
            await this.promptSession.destroy();
        }
        if (this.summarizerSession) {
            await this.summarizerSession.destroy();
        }
        this.cache.clear();
        console.log('Chrome AI Manager 已清理');
    }
}

// 单例模式
let chromeAIManagerInstance = null;

export async function getChromeAIManager() {
    if (!chromeAIManagerInstance) {
        chromeAIManagerInstance = new ChromeAIManager();
        await chromeAIManagerInstance.initialize();
    }
    return chromeAIManagerInstance;
}

export { ChromeAIManager };
