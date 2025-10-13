// background.js - Chrome Built-in AI 后台服务
// 使用 Gemini Nano 本地模型，完全隐私保护

// Chrome AI 服务实例
let chromeAIManager = null;
let aiCapabilities = null;
let modelStatus = 'checking';
let database = null;
let initializationPromise = null;
let lastInitializationError = null;
let lastNotifiedStatus = null;

function getChromeAI() {
    if (typeof self !== 'undefined' && self.ai) {
        return self.ai;
    }
    if (typeof globalThis !== 'undefined' && globalThis.ai) {
        return globalThis.ai;
    }
    return null;
}

function safeNotify(options) {
    try {
        if (chrome?.notifications?.create) {
            chrome.notifications.create('', options);
        }
    } catch (error) {
        console.warn('Notification creation failed:', error);
    }
}

// 1. 初始化 Chrome AI 服务
async function initializeServices(force = false) {
    if (initializationPromise && !force) {
        return initializationPromise;
    }

    if (!force && (modelStatus === 'ready' || modelStatus === 'partial' || modelStatus === 'downloading') && chromeAIManager && database) {
        return Promise.resolve({ status: modelStatus });
    }

    initializationPromise = (async () => {
        try {
            console.log('🚀 初始化 SmartInsight Chrome AI 服务...');
            modelStatus = 'initializing';
            lastInitializationError = null;

            // 检查 Chrome AI 可用性
            const availability = await checkChromeAIAvailability();

            // 初始化 Chrome AI Manager（如果可用）
            await initializeChromeAI(availability);

            // 初始化本地数据库
            await initializeDatabase();

            if ((modelStatus === 'ready' || modelStatus === 'partial') && lastNotifiedStatus !== 'ready') {
                console.log('✅ SmartInsight Chrome AI 服务初始化完成');

                safeNotify({
                    type: 'basic',
                    title: 'SmartInsight 已就绪',
                    message: '🔒 隐私优先 | ⚡ 本地AI | 💰 完全免费'
                });
                lastNotifiedStatus = 'ready';
            } else if (modelStatus === 'downloading' && lastNotifiedStatus !== 'downloading') {
                safeNotify({
                    type: 'basic',
                    title: 'Gemini Nano 模型下载中',
                    message: '首次使用需要下载本地模型，请稍候...'
                });
                lastNotifiedStatus = 'downloading';
            } else if (modelStatus === 'unavailable' && lastNotifiedStatus !== 'unavailable') {
                safeNotify({
                    type: 'basic',
                    title: 'Chrome AI 需要设置',
                    message: '请按照设置指导启用 Chrome AI 功能'
                });
                lastNotifiedStatus = 'unavailable';
            }

            return { status: modelStatus, availability };
        } catch (error) {
            lastInitializationError = error;
            console.error('❌ Chrome AI 服务初始化失败:', error);
            modelStatus = 'error';
            chromeAIManager = createUnavailableManager(error);

            if (lastNotifiedStatus !== 'error') {
                safeNotify({
                    type: 'basic',
                    title: 'Chrome AI 初始化失败',
                    message: error.message || '请检查 Chrome AI 设置'
                });
                lastNotifiedStatus = 'error';
            }

            return { status: 'error', error };
        }
    })().finally(() => {
        initializationPromise = null;
    });

    return initializationPromise;
}

// 检查 Chrome AI 可用性
async function checkChromeAIAvailability() {
    console.log('🔍 检查 Chrome AI 可用性...');

    const chromeAI = getChromeAI();

    // 初始化能力占位
    aiCapabilities = {
        prompt: null,
        summarizer: null,
        translator: null,
        writer: null
    };

    if (!chromeAI) {
        modelStatus = 'unavailable';
        return {
            available: false,
            reason: 'Chrome AI API 不可用',
            prompt: null,
            summarizer: null
        };
    }

    const availability = { available: true, prompt: null, summarizer: null };

    try {
        if (chromeAI.canCreateTextSession) {
            aiCapabilities.prompt = await chromeAI.canCreateTextSession();
            availability.prompt = aiCapabilities.prompt;
            console.log('📝 Prompt API 状态:', aiCapabilities.prompt);
        }

        if (chromeAI.summarizer) {
            aiCapabilities.summarizer = await chromeAI.summarizer.capabilities();
            availability.summarizer = aiCapabilities.summarizer?.available;
            console.log('📄 Summarizer API 状态:', aiCapabilities.summarizer);
        }

        if (chromeAI.translator?.capabilities) {
            aiCapabilities.translator = await chromeAI.translator.capabilities();
        }

        if (chromeAI.writer?.capabilities) {
            aiCapabilities.writer = await chromeAI.writer.capabilities();
        }

        if (aiCapabilities.prompt === 'readily') {
            modelStatus = 'ready';
        } else if (aiCapabilities.prompt === 'after-download') {
            modelStatus = 'downloading';
        } else if (aiCapabilities.prompt) {
            modelStatus = 'partial';
        } else {
            modelStatus = 'unavailable';
        }
    } catch (error) {
        console.warn('部分 Chrome AI 功能不可用:', error);
        modelStatus = modelStatus === 'checking' ? 'partial' : modelStatus;
        availability.error = error;
    }

    return availability;
}

// 初始化 Chrome AI Manager
async function initializeChromeAI(availability) {
    try {
        console.log('🤖 初始化 Chrome AI Manager...');

        if (!availability?.available || modelStatus === 'unavailable') {
            chromeAIManager = createUnavailableManager(
                new Error('Chrome AI 不可用。请启用相关功能后重试。')
            );
            return;
        }

        if (aiCapabilities?.prompt === 'after-download') {
            await maybeWarmUpPromptModel();
        }

        chromeAIManager = {
            analyzeProfile: async (profileData) => {
                await ensurePromptReady();
                return await analyzeProfileWithChromeAI(profileData);
            },
            analyzeCompany: async (companyData) => {
                await ensurePromptReady();
                return await analyzeCompanyWithChromeAI(companyData);
            },
            summarizeContent: async (content) => {
                await ensurePromptReady();
                return await summarizeWithChromeAI(content);
            },
            getStats: async () => {
                return {
                    modelStatus,
                    capabilities: aiCapabilities,
                    cost: 0,
                    privacy: '100% 本地处理',
                    latency: '<1秒',
                    requests: 0,
                    lastError: lastInitializationError ? lastInitializationError.message : null
                };
            }
        };

        console.log('✅ Chrome AI Manager 初始化完成');
    } catch (error) {
        console.error('❌ Chrome AI Manager 初始化失败:', error);
        throw error;
    }
}

function createUnavailableManager(error) {
    const guidance = getSetupGuidance();
    const unavailableError = error || new Error('Chrome AI 不可用');

    const buildFailureResponse = () => {
        const err = new Error(
            unavailableError?.message || 'Chrome AI 暂不可用，请按照设置指导启用相关功能。'
        );
        err.guidance = guidance;
        return err;
    };

    return {
        analyzeProfile: async () => { throw buildFailureResponse(); },
        analyzeCompany: async () => { throw buildFailureResponse(); },
        summarizeContent: async () => { throw buildFailureResponse(); },
        getStats: async () => ({
            modelStatus,
            capabilities: aiCapabilities,
            cost: 0,
            privacy: '100% 本地处理',
            guidance,
            lastError: unavailableError?.message || null
        })
    };
}

async function maybeWarmUpPromptModel() {
    const chromeAI = getChromeAI();
    if (!chromeAI?.createTextSession) {
        return;
    }

    try {
        console.log('📥 触发 Gemini Nano 模型下载...');
        const warmupSession = await chromeAI.createTextSession({ temperature: 0.5, topK: 1 });
        await warmupSession.destroy();
        aiCapabilities.prompt = 'readily';
        modelStatus = 'ready';
        console.log('✅ Gemini Nano 模型已就绪');
    } catch (error) {
        console.warn('Gemini Nano 模型仍在下载:', error.message);
    }
}

async function ensurePromptReady() {
    if (modelStatus === 'ready') {
        return;
    }

    if (aiCapabilities?.prompt === 'after-download') {
        await maybeWarmUpPromptModel();
        if (aiCapabilities.prompt !== 'readily') {
            throw new Error('Gemini Nano 模型仍在下载中，请稍后重试。');
        }
    }

    if (modelStatus === 'unavailable') {
        const err = new Error('Chrome AI 不可用，请按照设置指导启用相关功能。');
        err.guidance = getSetupGuidance();
        throw err;
    }
}

// Chrome AI 分析函数
async function analyzeProfileWithChromeAI(profileData) {
    const startTime = performance.now();
    
    try {
        console.log('🔍 使用 Chrome AI 分析个人资料...');
        
        const prompt = buildProfileAnalysisPrompt(profileData);
        const result = await callChromeAIPrompt(prompt);
        
        const structuredResult = parseProfileAnalysis(result);
        
        const latency = performance.now() - startTime;
        console.log(`✅ 个人资料分析完成，耗时: ${Math.round(latency)}ms`);
        
        return {
            ...structuredResult,
            metadata: {
                ...structuredResult.metadata,
                processing_time: Math.round(latency),
                ai_model: 'Gemini Nano (Chrome Built-in)',
                privacy: '100% 本地处理，数据不离开设备'
            }
        };
        
    } catch (error) {
        console.error('Chrome AI 个人资料分析失败:', error);
        throw new Error(`分析失败: ${error.message}`);
    }
}

async function analyzeCompanyWithChromeAI(companyData) {
    const startTime = performance.now();
    
    try {
        console.log('🏢 使用 Chrome AI 分析公司信息...');
        
        const prompt = buildCompanyAnalysisPrompt(companyData);
        const result = await callChromeAIPrompt(prompt);
        
        const structuredResult = parseCompanyAnalysis(result);
        
        const latency = performance.now() - startTime;
        console.log(`✅ 公司分析完成，耗时: ${Math.round(latency)}ms`);
        
        return {
            ...structuredResult,
            metadata: {
                ...structuredResult.metadata,
                processing_time: Math.round(latency),
                ai_model: 'Gemini Nano (Chrome Built-in)',
                privacy: '100% 本地处理'
            }
        };
        
    } catch (error) {
        console.error('Chrome AI 公司分析失败:', error);
        throw new Error(`分析失败: ${error.message}`);
    }
}

async function summarizeWithChromeAI(content) {
    const chromeAI = getChromeAI();

    try {
        console.log('📄 使用 Chrome AI 总结内容...');

        // 优先使用 Summarization API
        if (aiCapabilities.summarizer?.available === 'readily' && chromeAI?.summarizer?.create) {
            const summarizer = await chromeAI.summarizer.create({
                type: 'key-points',
                format: 'markdown',
                length: 'medium'
            });

            const result = await summarizer.summarize(content);
            await summarizer.destroy();
            return result;
        }
        
        // 降级到 Prompt API
        if (chromeAI) {
            const prompt = `请总结以下内容的关键要点，用简洁的中文表达：\n\n${content}`;
            return await callChromeAIPrompt(prompt);
        }

        throw new Error('Chrome AI Summarizer 不可用。');

    } catch (error) {
        console.error('Chrome AI 内容总结失败:', error);
        throw new Error(`总结失败: ${error.message}`);
    }
}

// Chrome AI 核心调用函数
async function callChromeAIPrompt(prompt) {
    const chromeAI = getChromeAI();

    if (!chromeAI || aiCapabilities.prompt !== 'readily') {
        throw new Error('Chrome AI Prompt API 不可用。请检查设置。');
    }

    try {
        const session = await chromeAI.createTextSession({
            temperature: 0.8,
            topK: 3
        });

        const result = await session.prompt(prompt);
        await session.destroy();
        
        return result;
        
    } catch (error) {
        console.error('Chrome AI Prompt 调用失败:', error);
        throw error;
    }
}

// 构建分析提示词
function buildProfileAnalysisPrompt(profileData) {
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

**关键亮点** (3个要点)
**破冰开场白** (1-2句自然的对话开场)
**深度问题** (3个可以深入交流的问题)
**速记卡片** (3个关键记忆点)
**后续邮件模板** (专业的跟进邮件)

请确保建议实用、自然且专业。`;
}

function buildCompanyAnalysisPrompt(companyData) {
    return `作为求职分析师，请分析以下公司信息并提供面试准备建议：

公司名称：${companyData.companyName || '未提供'}
目标职位：${companyData.targetPosition || '未提供'}
公司网址：${companyData.companyUrl || '未提供'}
额外信息：${companyData.additionalInfo || '未提供'}

请提供以下分析：

**公司定位** (1句话概括)
**发展时间线** (关键发展阶段)
**核心团队** (领导层特点)
**竞争优势** (市场地位分析)
**面试建议** (具体准备要点)
**问题建议** (3个可以向面试官提问的问题)

请确保分析客观、实用且有针对性。`;
}

// 初始化本地数据库
async function initializeDatabase() {
    if (database) {
        return database;
    }

    try {
        console.log('💾 初始化本地数据库...');

        const HISTORY_KEY = 'analysis_history';
        const HISTORY_LIMIT = 50;

        const loadAllStorage = async () => {
            const result = await chrome.storage.local.get();
            return result || {};
        };

        const loadHistory = async () => {
            const result = await chrome.storage.local.get(HISTORY_KEY);
            const history = result[HISTORY_KEY];
            return Array.isArray(history) ? history : [];
        };

        database = {
            saveProfile: async (profile) => {
                const key = `profile_${Date.now()}`;
                await chrome.storage.local.set({ [key]: profile });
                console.log('✅ 个人资料已保存到本地');
            },

            getProfile: async (url) => {
                const result = await loadAllStorage();
                const profiles = Object.values(result).filter(item =>
                    item?.profile_url === url
                );
                return profiles.length > 0 ? profiles[0] : null;
            },

            saveCompany: async (company) => {
                const key = `company_${Date.now()}`;
                await chrome.storage.local.set({ [key]: company });
                console.log('✅ 公司信息已保存到本地');
            },

            getCompany: async (name) => {
                const result = await loadAllStorage();
                const companies = Object.values(result).filter(item =>
                    item?.company_name === name || item?.website_url === name
                );
                return companies.length > 0 ? companies[0] : null;
            },

            async saveHistoryEntry(entry) {
                const history = await loadHistory();
                const createdAt = entry?.created_at || Date.now();
                const normalizedEntry = {
                    id: entry?.id || `${entry?.type || 'analysis'}_${createdAt}`,
                    type: entry?.type || 'analysis',
                    created_at: createdAt,
                    source: entry?.source || null,
                    input: entry?.input || null,
                    output: entry?.output || null,
                    metadata: {
                        ...entry?.metadata,
                        ai_model: entry?.metadata?.ai_model || 'Gemini Nano (Chrome Built-in)',
                        privacy: '100% 本地处理'
                    }
                };

                const filteredHistory = history.filter(item => item.id !== normalizedEntry.id);
                filteredHistory.unshift(normalizedEntry);
                const trimmedHistory = filteredHistory.slice(0, HISTORY_LIMIT);

                await chrome.storage.local.set({ [HISTORY_KEY]: trimmedHistory });
                return normalizedEntry;
            },

            async getHistory(limit = 20) {
                const history = await loadHistory();
                return history.slice(0, limit);
            },

            async clearHistory() {
                await chrome.storage.local.set({ [HISTORY_KEY]: [] });
            },

            getCostSummary: async () => {
                return {
                    totalCost: 0, // Chrome AI 完全免费
                    requestCount: 0,
                    privacy: '100% 本地处理'
                };
            }
        };
        
        console.log('✅ 本地数据库初始化完成');

        return database;

    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
    }
}

// 结果解析函数
function parseProfileAnalysis(rawResult) {
    const sections = parseAIResponse(rawResult);
    
    return {
        flashcard: {
            key_points: extractKeyPoints(sections),
            golden_quote: extractGoldenQuote(sections),
            reading_time: 30
        },
        icebreaker: {
            icebreaker: extractIcebreaker(sections),
            tone: 'professional',
            based_on_sources: ['LinkedIn Profile', 'Chrome AI Analysis']
        },
        questions: extractQuestions(sections),
        email_draft: extractEmailDraft(sections),
        metadata: {
            cost_usd: 0, // Chrome AI 完全免费
            processing_time: 0,
            privacy: '100% 本地处理，数据不离开设备',
            ai_model: 'Gemini Nano (Chrome Built-in)'
        }
    };
}

function parseCompanyAnalysis(rawResult) {
    const sections = parseAIResponse(rawResult);
    
    return {
        positioning: extractPositioning(sections),
        timeline: extractTimeline(sections),
        keyPeople: extractKeyPeople(sections),
        competition: extractCompetition(sections),
        interviewTips: extractInterviewTips(sections),
        suggestedQuestions: extractSuggestedQuestions(sections),
        metadata: {
            cost_usd: 0,
            processing_time: 0,
            privacy: '100% 本地处理',
            ai_model: 'Gemini Nano (Chrome Built-in)'
        }
    };
}

function parseAIResponse(response) {
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

// 提取具体内容的辅助函数
function extractKeyPoints(sections) {
    const keyPointsText = sections['关键亮点'] || sections['key highlights'] || '';
    return keyPointsText.split('\n').filter(line => line.trim()).slice(0, 3);
}

function extractGoldenQuote(sections) {
    const icebreakerText = sections['破冰开场白'] || sections['icebreaker'] || '';
    return icebreakerText.split('\n')[0] || '准备充分的对话是成功网络建设的开始';
}

function extractIcebreaker(sections) {
    return sections['破冰开场白'] || sections['icebreaker'] || '很高兴认识您，我对您在该领域的经验很感兴趣。';
}

function extractQuestions(sections) {
    const questionsText = sections['深度问题'] || sections['deep questions'] || '';
    const questionLines = questionsText.split('\n').filter(line => line.trim());
    
    return questionLines.slice(0, 3).map((question, index) => ({
        text: question.replace(/^[-*]\s*/, ''),
        priority: index === 0 ? 'P0' : index === 1 ? 'P1' : 'P2',
        category: '专业交流',
        source: 'Chrome AI Analysis'
    }));
}

function extractEmailDraft(sections) {
    const emailText = sections['后续邮件模板'] || sections['follow-up email'] || '';
    return {
        subject: '很高兴认识您',
        body: emailText || '感谢今天的愉快交流，期待未来有机会进一步合作。',
        tone: 'professional',
        call_to_action: 'follow_up'
    };
}

function extractPositioning(sections) {
    return sections['公司定位'] || sections['company positioning'] || '创新型行业领先企业';
}

function extractTimeline(sections) {
    return sections['发展时间线'] || sections['timeline'] || '稳步发展，持续创新';
}

function extractKeyPeople(sections) {
    return sections['核心团队'] || sections['key people'] || '经验丰富的管理团队';
}

function extractCompetition(sections) {
    return sections['竞争优势'] || sections['competitive advantage'] || '在行业中具有独特优势';
}

function extractInterviewTips(sections) {
    return sections['面试建议'] || sections['interview tips'] || '展示相关技能和经验，表达对公司的兴趣';
}

function extractSuggestedQuestions(sections) {
    const questionsText = sections['问题建议'] || sections['suggested questions'] || '';
    return questionsText.split('\n').filter(line => line.trim()).slice(0, 3);
}

// 简化的工作流执行
async function executeSimplifiedWorkflow(workflowName, data, context) {
    try {
        if (workflowName === 'chat_prep') {
            return await chromeAIManager.analyzeProfile(data);
        } else if (workflowName === 'company_analysis') {
            return await chromeAIManager.analyzeCompany(data);
        }
        throw new Error(`Unknown workflow: ${workflowName}`);
    } catch (error) {
        console.error('Chrome AI workflow execution failed:', error);
        throw error;
    }
}

// Chrome AI 直接调用（兼容旧接口）
async function callLLMDirect(params) {
    try {
        console.log('🔄 使用 Chrome AI 替代外部 API...');
        
        const result = await callChromeAIPrompt(params.prompt);
        
        return {
            content: result,
            usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            },
            model: 'Gemini Nano (Chrome Built-in)',
            cost: 0,
            privacy: '100% 本地处理'
        };
        
    } catch (error) {
        console.error('Chrome AI call failed:', error);
        throw new Error(`Chrome AI 调用失败: ${error.message}`);
    }
}



// 2. 增强的消息处理器
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('DEBUG [BG]: Received action:', request.action);
    
    // 处理不同类型的请求
    switch (request.action) {
        case 'RUN_SUMMARY':
            handleSummaryRequest(request, sendResponse);
            break;
            
        case 'ANALYZE_PROFILE':
            handleProfileAnalysis(request, sendResponse);
            break;
            
        case 'ANALYZE_COMPANY':
            handleCompanyAnalysis(request, sendResponse);
            break;
            
        case 'ANALYZE_WEBSITE':
            handleWebsiteAnalysis(request, sendResponse);
            break;

        case 'GET_STATS':
            handleGetStats(request, sendResponse);
            break;

        case 'GET_LINKEDIN_PROFILE_DATA':
            handleGetLinkedInProfileData(request, sendResponse);
            break;

        case 'GET_ANALYSIS_HISTORY':
            handleGetAnalysisHistory(request, sendResponse);
            break;

        case 'CLEAR_ANALYSIS_HISTORY':
            handleClearAnalysisHistory(request, sendResponse);
            break;

        default:
            sendResponse({ status: 'ERROR', message: 'Unknown action: ' + request.action });
    }
    
    return true; // 保持消息通道开放
});

// 处理摘要请求（使用 Chrome AI）
async function handleSummaryRequest(request, sendResponse) {
    await initializeServices();

    if (modelStatus !== 'ready' && modelStatus !== 'partial') {
        sendResponse({
            status: 'ERROR',
            message: 'Chrome AI 未就绪。请检查设置并重试。',
            guidance: getSetupGuidance()
        });
        return;
    }
    
    try {
        console.log('📄 使用 Chrome AI 处理摘要请求...');

        const summary = await chromeAIManager.summarizeContent(request.text);

        if (database?.saveHistoryEntry) {
            await database.saveHistoryEntry({
                type: 'summary',
                source: request.context?.pageUrl || 'current_page',
                input: {
                    text_length: request.text?.length || 0,
                    preview: request.text?.slice(0, 280) || ''
                },
                output: summary,
                metadata: {
                    task: 'RUN_SUMMARY',
                    fromCache: false
                }
            });
        }

        sendResponse({
            status: 'SUCCESS',
            output: summary,
            metadata: {
                ai_model: 'Gemini Nano (Chrome Built-in)',
                cost: 0,
                privacy: '100% 本地处理'
            }
        });
        
    } catch (error) {
        console.error('Chrome AI 摘要失败:', error);
        sendResponse({
            status: 'ERROR',
            message: error.message || 'Chrome AI 摘要失败',
            suggestion: '请检查 Chrome AI 设置或尝试刷新页面',
            guidance: error.guidance || getSetupGuidance()
        });
    }
}

// 处理个人资料分析（使用 Chrome AI）
async function handleProfileAnalysis(request, sendResponse) {
    await initializeServices();

    try {
        console.log('👤 使用 Chrome AI 处理个人资料分析...');

        if (modelStatus === 'unavailable' || modelStatus === 'error') {
            const error = new Error('Chrome AI 未就绪，请先完成设置。');
            error.guidance = getSetupGuidance();
            throw error;
        }

        if (!chromeAIManager) {
            throw new Error('Chrome AI Manager 未初始化');
        }
        
        // 检查缓存
        const cachedResult = await database?.getProfile(request.data.metadata?.profile_url);
        if (cachedResult && !request.forceRefresh) {
            console.log('📋 使用缓存的分析结果');

            if (database?.saveHistoryEntry) {
                await database.saveHistoryEntry({
                    type: 'profile',
                    source: request.data.metadata?.profile_url || request.context?.pageUrl || null,
                    input: {
                        name: request.data.basic_info?.name || null,
                        headline: request.data.basic_info?.headline || null
                    },
                    output: cachedResult.analyzed_data,
                    metadata: {
                        task: 'ANALYZE_PROFILE',
                        fromCache: true,
                        requested_at: request.context?.timestamp || Date.now()
                    }
                });
            }

            sendResponse({
                status: 'SUCCESS',
                data: cachedResult.analyzed_data,
                fromCache: true,
                metadata: {
                    source: '本地缓存',
                    privacy: '100% 本地存储'
                }
            });
            return;
        }
        
        // 使用 Chrome AI 分析
        const result = await chromeAIManager.analyzeProfile(request.data);
        
        // 保存结果到本地数据库
        if (database && request.data.metadata?.profile_url) {
            await database.saveProfile({
                profile_url: request.data.metadata.profile_url,
                raw_data: request.data,
                analyzed_data: result,
                analyzed_at: Date.now()
            });
        }

        if (database?.saveHistoryEntry) {
            await database.saveHistoryEntry({
                type: 'profile',
                source: request.data.metadata?.profile_url || request.context?.pageUrl || null,
                input: {
                    name: request.data.basic_info?.name || null,
                    headline: request.data.basic_info?.headline || null
                },
                output: result,
                metadata: {
                    task: 'ANALYZE_PROFILE',
                    fromCache: false,
                    requested_at: request.context?.timestamp || Date.now()
                }
            });
        }
        
        sendResponse({ 
            status: 'SUCCESS', 
            data: result,
            metadata: {
                source: 'Chrome AI 实时分析',
                privacy: '100% 本地处理，数据不离开设备'
            }
        });
        
    } catch (error) {
        console.error('Chrome AI 个人资料分析失败:', error);
        sendResponse({
            status: 'ERROR',
            message: error.message,
            suggestion: '请检查 Chrome AI 设置或尝试刷新页面',
            guidance: error.guidance || getSetupGuidance()
        });
    }
}

// 处理公司分析（使用 Chrome AI）
async function handleCompanyAnalysis(request, sendResponse) {
    await initializeServices();

    try {
        console.log('🏢 使用 Chrome AI 处理公司分析...');

        if (modelStatus === 'unavailable' || modelStatus === 'error') {
            const error = new Error('Chrome AI 未就绪，请先完成设置。');
            error.guidance = getSetupGuidance();
            throw error;
        }

        if (!chromeAIManager) {
            throw new Error('Chrome AI Manager 未初始化');
        }
        
        // 检查缓存
        const cacheKey = request.data.companyUrl || request.data.companyName;
        const cachedResult = await database?.getCompany(cacheKey);
        if (cachedResult && !request.forceRefresh) {
            console.log('📋 使用缓存的公司分析结果');

            if (database?.saveHistoryEntry) {
                await database.saveHistoryEntry({
                    type: 'company',
                    source: cacheKey,
                    input: {
                        company: request.data.companyName || null,
                        url: request.data.companyUrl || null
                    },
                    output: cachedResult.analyzed_data,
                    metadata: {
                        task: 'ANALYZE_COMPANY',
                        fromCache: true,
                        requested_at: request.context?.timestamp || Date.now(),
                        trigger: request.initiatedBy || 'direct'
                    }
                });
            }

            sendResponse({
                status: 'SUCCESS',
                data: cachedResult.analyzed_data,
                fromCache: true,
                metadata: {
                    source: '本地缓存',
                    privacy: '100% 本地存储'
                }
            });
            return;
        }
        
        // 使用 Chrome AI 分析
        const result = await chromeAIManager.analyzeCompany(request.data);
        
        // 保存结果到本地数据库
        if (database) {
            await database.saveCompany({
                company_name: request.data.companyName,
                website_url: request.data.companyUrl,
                raw_data: request.data,
                analyzed_data: result,
                analyzed_at: Date.now()
            });
        }

        if (database?.saveHistoryEntry) {
            await database.saveHistoryEntry({
                type: 'company',
                source: cacheKey,
                input: {
                    company: request.data.companyName || null,
                    url: request.data.companyUrl || null
                },
                output: result,
                metadata: {
                    task: 'ANALYZE_COMPANY',
                    fromCache: false,
                    requested_at: request.context?.timestamp || Date.now(),
                    trigger: request.initiatedBy || 'direct'
                }
            });
        }
        
        sendResponse({ 
            status: 'SUCCESS', 
            data: result,
            metadata: {
                source: 'Chrome AI 实时分析',
                privacy: '100% 本地处理'
            }
        });
        
    } catch (error) {
        console.error('Chrome AI 公司分析失败:', error);
        sendResponse({
            status: 'ERROR',
            message: error.message,
            suggestion: '请检查 Chrome AI 设置或尝试刷新页面',
            guidance: error.guidance || getSetupGuidance()
        });
    }
}

// 处理网站分析
async function handleWebsiteAnalysis(request, sendResponse) {
    await initializeServices();

    try {
        // 使用公司分析工作流处理网站数据
        const companyData = {
            companyName: extractCompanyNameFromUrl(request.data.url),
            companyUrl: request.data.url,
            additionalInfo: request.data.content?.substring(0, 1000) // 限制长度
        };

        await handleCompanyAnalysis({
            data: companyData,
            context: request.context,
            initiatedBy: 'website'
        }, sendResponse);

    } catch (error) {
        console.error('Website analysis failed:', error);
        sendResponse({
            status: 'ERROR',
            message: error.message,
            guidance: error.guidance || getSetupGuidance()
        });
    }
}


// 获取分析历史
async function handleGetAnalysisHistory(request, sendResponse) {
    await initializeServices();

    try {
        if (!database?.getHistory) {
            throw new Error('本地数据库未就绪');
        }

        const limit = typeof request.limit === 'number' ? request.limit : 20;
        const history = await database.getHistory(limit);

        sendResponse({ status: 'SUCCESS', data: history });

    } catch (error) {
        console.error('Failed to fetch analysis history:', error);
        sendResponse({ status: 'ERROR', message: error.message || '历史记录获取失败' });
    }
}

// 清理分析历史
async function handleClearAnalysisHistory(request, sendResponse) {
    await initializeServices();

    try {
        if (!database?.clearHistory) {
            throw new Error('本地数据库未就绪');
        }

        await database.clearHistory();
        sendResponse({ status: 'SUCCESS' });

    } catch (error) {
        console.error('Failed to clear analysis history:', error);
        sendResponse({ status: 'ERROR', message: error.message || '清空历史记录失败' });
    }
}


// 获取统计信息
async function handleGetStats(request, sendResponse) {
    await initializeServices();

    try {
        const stats = {
            aiManager: chromeAIManager ? await chromeAIManager.getStats() : {
                modelStatus,
                capabilities: aiCapabilities,
                cost: 0,
                privacy: '100% 本地处理'
            },
            database: database ? await database.getCostSummary() : null
        };
        
        sendResponse({ status: 'SUCCESS', data: stats });
        
    } catch (error) {
        console.error('Failed to get stats:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}


// 处理LinkedIn个人资料数据获取
async function handleGetLinkedInProfileData(request, sendResponse) {
    try {
        // 获取当前活动标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.url.includes('linkedin.com/in/')) {
            throw new Error('请在LinkedIn个人资料页面使用此功能');
        }
        
        // 确保content script已加载
        await ensureContentScriptLoaded(tab.id);
        
        // 向content script发送消息获取LinkedIn数据，带重试机制
        const response = await sendMessageWithRetry(tab.id, {
            action: 'SCRAPE_LINKEDIN_PROFILE'
        }, 3);
        
        if (response && response.status === 'SUCCESS') {
            sendResponse({ status: 'SUCCESS', data: response.data });
        } else {
            throw new Error(response?.message || 'LinkedIn数据获取失败');
        }
        
    } catch (error) {
        console.error('LinkedIn profile data fetch failed:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}

// 确保content script已加载
async function ensureContentScriptLoaded(tabId) {
    try {
        // 首先测试content script是否已经可用
        try {
            const pingResponse = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
            if (pingResponse && pingResponse.status === 'PONG') {
                console.log('Content script already loaded and responsive');
                return;
            }
        } catch (error) {
            console.log('Content script not responsive, will rely on manifest injection');
        }
        
        // 等待一段时间让manifest中的content script加载
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 再次测试连接
        try {
            const testResponse = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
            if (testResponse && testResponse.status === 'PONG') {
                console.log('Content script loaded via manifest');
                return;
            }
        } catch (error) {
            console.log('Manifest content script not loaded, manual injection needed');
        }
        
        // 如果manifest加载失败，手动注入
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-script.js']
        });
        
        // 等待脚本初始化完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Content script manually injected');
        
    } catch (error) {
        console.error('Failed to ensure content script loaded:', error);
        throw new Error('请刷新LinkedIn页面后重试');
    }
}

// 带重试机制的消息发送
async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await chrome.tabs.sendMessage(tabId, message);
            return response;
        } catch (error) {
            console.log(`Message send attempt ${i + 1} failed:`, error.message);
            
            if (i === maxRetries - 1) {
                throw new Error('无法与页面建立连接，请刷新页面后重试');
            }
            
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
    }
}

// 辅助函数：从URL提取公司名称
function extractCompanyNameFromUrl(url) {
    try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        const mainPart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
        return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    } catch (error) {
        return 'Unknown Company';
    }
}

// 3. 启动所有服务初始化
initializeServices();

// 4. 监听扩展安装和更新事件
chrome.runtime.onInstalled.addListener((details) => {
    console.log('SmartInsight Chrome AI installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // 首次安装时配置 Chrome AI 环境
        autoSetupTestEnvironment();
    }
});

// Chrome AI 设置指导
function getSetupGuidance() {
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

// 自动配置 Chrome AI 环境
async function autoSetupTestEnvironment() {
    console.log('🚀 配置 Chrome AI 环境...');

    const chromeAIConfig = {
        chrome_ai_enabled: true,
        privacy_mode: true,
        offline_capable: true,
        cost_tracking: false, // Chrome AI 完全免费
        setup_completed: Date.now()
    };
    
    try {
        await chrome.storage.local.set(chromeAIConfig);
        console.log('✅ Chrome AI 配置已保存');
        
        // 检查 Chrome AI 可用性
        setTimeout(async () => {
            try {
                const chromeAI = getChromeAI();
                if (chromeAI?.canCreateTextSession) {
                    const capability = await chromeAI.canCreateTextSession();

                    if (capability === 'readily') {
                        console.log('✅ Chrome AI 已就绪!');

                        // 显示成功通知
                        safeNotify({
                            type: 'basic',
                            title: 'SmartInsight Chrome AI 就绪',
                            message: '🔒 隐私优先 | ⚡ 本地AI | 💰 完全免费'
                        });
                    } else if (capability === 'after-download') {
                        console.log('📥 Gemini Nano 模型下载中...');

                        safeNotify({
                            type: 'basic',
                            title: 'Chrome AI 模型下载中',
                            message: '请稍候，Gemini Nano 模型正在下载...'
                        });
                    } else {
                        console.log('❌ Chrome AI 不可用');

                        const guidance = getSetupGuidance();
                        safeNotify({
                            type: 'basic',
                            title: 'Chrome AI 需要设置',
                            message: '请按照指导启用 Chrome AI 功能'
                        });
                    }
                } else {
                    console.log('❌ Chrome AI API 不可用');

                    safeNotify({
                        type: 'basic',
                        title: 'Chrome AI 不支持',
                        message: '请使用 Chrome 127+ 并启用相关功能'
                    });
                }
            } catch (error) {
                console.error('❌ Chrome AI 检查失败:', error);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Chrome AI 配置失败:', error);
    }
}

// 5. 监听标签页更新（用于自动检测LinkedIn页面）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = new URL(tab.url);
        
        // 检测LinkedIn页面
        if (url.hostname === 'www.linkedin.com' && 
            (url.pathname.includes('/in/') || url.pathname.includes('/company/'))) {
            
            // LinkedIn 页面检测到，content script 会自动处理
            console.log('LinkedIn page detected:', url.pathname);
        }
    }
});
