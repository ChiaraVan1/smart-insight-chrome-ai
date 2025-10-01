// background.js - 增强版后台服务
// 集成工作流引擎、AI管理器和数据存储

// 导入模块（需要在manifest中配置）
let summarizerInstance = null; 
let modelStatus = 'checking';
let workflowEngine = null;
let aiManager = null;
let database = null;

// 1. 初始化所有服务
async function initializeServices() {
    try {
        // 初始化原有的Summarizer
        await initializeSummarizer();
        
        // 初始化新的服务
        await initializeWorkflowEngine();
        await initializeAIManager();
        await initializeDatabase();
        
        console.log('All Career Assistant services initialized');
        
    } catch (error) {
        console.error('Failed to initialize services:', error);
    }
}

// 原有的Summarizer初始化
async function initializeSummarizer() {
    if (summarizerInstance) return;

    try {
        modelStatus = 'creating';
        const summarizer = await Summarizer.create(); 
        summarizerInstance = summarizer;
        modelStatus = 'ready';
        console.log('Summarizer model is ready! Background service active.');

    } catch (error) {
        modelStatus = 'error';
        console.error('Failed to initialize Summarizer API in background:', error);
    }
}

// 初始化工作流引擎
async function initializeWorkflowEngine() {
    try {
        // Service Worker中暂时禁用工作流引擎，使用简化版本
        console.log('Workflow engine initialization skipped in Service Worker');
        workflowEngine = {
            executeWorkflow: async (workflowName, data, context) => {
                // 简化的工作流执行
                return await executeSimplifiedWorkflow(workflowName, data, context);
            }
        };
    } catch (error) {
        console.error('Failed to initialize workflow engine:', error);
    }
}

// 初始化AI管理器
async function initializeAIManager() {
    try {
        // Service Worker中使用简化的AI管理器
        console.log('AI manager initialization skipped in Service Worker');
        aiManager = {
            callLLM: async (params) => {
                return await callLLMDirect(params);
            },
            getStats: async () => {
                return { requests: 0, cost: 0 };
            }
        };
    } catch (error) {
        console.error('Failed to initialize AI manager:', error);
    }
}

// 初始化数据库
async function initializeDatabase() {
    try {
        // Service Worker中使用chrome.storage代替IndexedDB
        console.log('Database initialization using chrome.storage');
        database = {
            saveProfile: async (profile) => {
                const key = `profile_${Date.now()}`;
                await chrome.storage.local.set({ [key]: profile });
            },
            getProfile: async (url) => {
                const result = await chrome.storage.local.get();
                const profiles = Object.values(result).filter(item => 
                    item.profile_url === url
                );
                return profiles.length > 0 ? profiles[0] : null;
            },
            saveCompany: async (company) => {
                const key = `company_${Date.now()}`;
                await chrome.storage.local.set({ [key]: company });
            },
            getCompany: async (name) => {
                const result = await chrome.storage.local.get();
                const companies = Object.values(result).filter(item => 
                    item.company_name === name
                );
                return companies.length > 0 ? companies[0] : null;
            },
            getCostSummary: async () => {
                return { totalCost: 0, requestCount: 0 };
            }
        };
        
        console.log('Database initialized with chrome.storage');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
}

// 简化的工作流执行
async function executeSimplifiedWorkflow(workflowName, data, context) {
    try {
        if (workflowName === 'chat_prep') {
            return await generateChatPrepContent(data);
        } else if (workflowName === 'company_analysis') {
            return await generateCompanyAnalysisContent(data);
        }
        throw new Error(`Unknown workflow: ${workflowName}`);
    } catch (error) {
        console.error('Simplified workflow execution failed:', error);
        throw error;
    }
}

// 直接LLM调用
async function callLLMDirect(params) {
    try {
        // 获取存储的API配置
        const config = await chrome.storage.local.get([
            'kimi_api_key', 'default_model'
        ]);
        
        if (!config.kimi_api_key) {
            throw new Error('请先在设置中配置API密钥');
        }
        
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.kimi_api_key}`
            },
            body: JSON.stringify({
                model: 'moonshot-v1-8k',
                messages: [{ role: 'user', content: params.prompt }],
                max_tokens: params.maxTokens || 1500,
                temperature: params.temperature || 0.4
            })
        });
        
        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage
        };
        
    } catch (error) {
        console.error('Direct LLM call failed:', error);
        throw error;
    }
}

// 生成聊天准备内容
async function generateChatPrepContent(data) {
    const prompt = `作为求职助手，请帮我准备与以下人员的闲聊内容：
姓名：${data.basic_info?.name || '未提供'}
职位：${data.basic_info?.headline || '未提供'}
公司：${data.current_position?.company || '未提供'}
经历：${data.experiences?.slice(0, 2).map(exp => `${exp.title} at ${exp.company}`).join(', ') || '未提供'}

请生成：
1. 破冰开场白（1-2句话）
2. 深入问题（3个）
3. 速记卡片（3个重点）

请确保内容自然、专业。`;

    const response = await callLLMDirect({ prompt });
    
    return {
        flashcard: {
            key_points: ['基于LinkedIn信息', '个性化聊天建议', '专业网络拓展'],
            golden_quote: response.content.split('\n')[0] || '准备充分的对话是成功的开始',
            reading_time: 30
        },
        icebreaker: {
            icebreaker: response.content,
            tone: 'professional',
            based_on_sources: ['LinkedIn Profile']
        },
        questions: [
            {
                text: '您在当前公司最有成就感的项目是什么？',
                priority: 'P0',
                category: '工作经历',
                source: 'LinkedIn Experience'
            }
        ],
        email_draft: {
            subject: '很高兴认识您',
            body: '感谢今天的交流，期待未来的合作机会。',
            tone: 'professional',
            call_to_action: 'follow_up'
        },
        metadata: {
            cost_usd: 0.001,
            processing_time: 2000
        }
    };
}

// 生成公司分析内容
async function generateCompanyAnalysisContent(data) {
    const prompt = `作为求职分析师，请分析以下公司：
公司名称：${data.companyName || '未提供'}
网址：${data.companyUrl || '未提供'}
目标职位：${data.targetPosition || '未提供'}

请生成公司分析报告，包括：
1. 公司定位（1句话）
2. 关键信息和亮点
3. 面试建议

请确保分析客观、实用。`;

    const response = await callLLMDirect({ prompt });
    
    return {
        positioning: response.content.split('\n')[0] || '创新型科技公司',
        timeline: '最近发展良好，业务稳定增长',
        keyPeople: '团队专业，注重人才发展',
        competition: '在行业中具有竞争优势',
        interviewTips: response.content,
        metadata: {
            cost_usd: 0.001,
            processing_time: 2000
        }
    };
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
            
        case 'CHAT_PREP':
            handleChatPrep(request, sendResponse);
            break;
            
        case 'COMPANY_ANALYSIS':
            handleCompanyAnalysisLegacy(request, sendResponse);
            break;
            
        case 'GET_STATS':
            handleGetStats(request, sendResponse);
            break;
            
        case 'SETUP_TEST_ENV':
            handleSetupTestEnvironment(request, sendResponse);
            break;
            
        case 'GET_LINKEDIN_PROFILE_DATA':
            handleGetLinkedInProfileData(request, sendResponse);
            break;
            
        default:
            sendResponse({ status: 'ERROR', message: 'Unknown action: ' + request.action });
    }
    
    return true; // 保持消息通道开放
});

// 处理原有的摘要请求
async function handleSummaryRequest(request, sendResponse) {
    if (!summarizerInstance) {
        sendResponse({ status: 'ERROR', message: 'AI model is not yet initialized. Please wait.' });
        return;
    }
    
    try {
        const promptInstruction = "Summarize the text into short, easy-to-understand key points for a general user.";
        const summary = await summarizerInstance.summarize(request.text, { context: promptInstruction });
        
        let rawOutputString = "";
        if (summary && typeof summary === 'object' && summary !== null) {
            const characterArray = Object.values(summary);
            if (characterArray.length > 0) {
                rawOutputString = characterArray.join('');
            } else {
                rawOutputString = summary.output ? String(summary.output) : "";
            }
        } else if (typeof summary === 'string') {
            rawOutputString = summary;
        }
        
        const finalOutput = rawOutputString.length > 0 ? 
            rawOutputString.replace(/\s+/g, ' ').trim() : "";
        
        sendResponse({ status: 'SUCCESS', output: finalOutput });
        
    } catch (error) {
        sendResponse({ status: 'ERROR', message: error.message || 'Summarization failed.' });
    }
}

// 处理个人资料分析
async function handleProfileAnalysis(request, sendResponse) {
    try {
        if (!workflowEngine || !aiManager) {
            throw new Error('Services not initialized');
        }
        
        // 检查缓存
        const cachedResult = await database?.getProfile(request.data.metadata.profile_url);
        if (cachedResult && !request.forceRefresh) {
            sendResponse({ status: 'SUCCESS', data: cachedResult.analyzed_data, fromCache: true });
            return;
        }
        
        // 执行分析工作流
        const context = {
            aiManager: aiManager,
            database: database,
            ...request.context
        };
        
        const result = await workflowEngine.executeWorkflow('chat_prep', request.data, context);
        
        // 保存结果到数据库
        if (database) {
            await database.saveProfile({
                profile_url: request.data.metadata.profile_url,
                raw_data: request.data,
                analyzed_data: result
            });
        }
        
        sendResponse({ status: 'SUCCESS', data: result });
        
    } catch (error) {
        console.error('Profile analysis failed:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}

// 处理公司分析
async function handleCompanyAnalysis(request, sendResponse) {
    try {
        if (!workflowEngine || !aiManager) {
            throw new Error('Services not initialized');
        }
        
        // 检查缓存
        const cacheKey = request.data.companyUrl || request.data.companyName;
        const cachedResult = await database?.getCompany(cacheKey);
        if (cachedResult && !request.forceRefresh) {
            sendResponse({ status: 'SUCCESS', data: cachedResult.analyzed_data, fromCache: true });
            return;
        }
        
        // 执行公司分析工作流
        const context = {
            aiManager: aiManager,
            database: database,
            ...request.context
        };
        
        const result = await workflowEngine.executeWorkflow('company_analysis', request.data, context);
        
        // 保存结果
        if (database) {
            await database.saveCompany({
                company_name: request.data.companyName,
                website_url: request.data.companyUrl,
                raw_data: request.data,
                analyzed_data: result
            });
        }
        
        sendResponse({ status: 'SUCCESS', data: result });
        
    } catch (error) {
        console.error('Company analysis failed:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}

// 处理网站分析
async function handleWebsiteAnalysis(request, sendResponse) {
    try {
        // 使用公司分析工作流处理网站数据
        const companyData = {
            companyName: extractCompanyNameFromUrl(request.data.url),
            companyUrl: request.data.url,
            additionalInfo: request.data.content?.substring(0, 1000) // 限制长度
        };
        
        await handleCompanyAnalysis({ data: companyData, context: request.context }, sendResponse);
        
    } catch (error) {
        console.error('Website analysis failed:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}

// 处理聊天准备（兼容原有接口）
async function handleChatPrep(request, sendResponse) {
    try {
        if (!aiManager) {
            throw new Error('AI Manager not initialized');
        }
        
        const response = await aiManager.callLLM({
            prompt: request.prompt,
            model: 'claude-sonnet',
            temperature: 0.4,
            maxTokens: 1500,
            metadata: { taskType: 'chat_prep' }
        });
        
        sendResponse({ status: 'SUCCESS', output: response.content });
        
    } catch (error) {
        console.error('Chat prep failed:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}

// 处理公司分析（兼容原有接口）
async function handleCompanyAnalysisLegacy(request, sendResponse) {
    try {
        if (!aiManager) {
            throw new Error('AI Manager not initialized');
        }
        
        const response = await aiManager.callLLM({
            prompt: request.prompt,
            model: 'claude-sonnet',
            temperature: 0.3,
            maxTokens: 2000,
            metadata: { taskType: 'company_analysis' }
        });
        
        sendResponse({ status: 'SUCCESS', output: response.content });
        
    } catch (error) {
        console.error('Company analysis failed:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}

// 获取统计信息
async function handleGetStats(request, sendResponse) {
    try {
        const stats = {
            aiManager: aiManager ? await aiManager.getStats() : null,
            database: database ? await database.getCostSummary() : null,
            workflowEngine: workflowEngine ? {
                executionHistory: workflowEngine.executionHistory.length
            } : null
        };
        
        sendResponse({ status: 'SUCCESS', data: stats });
        
    } catch (error) {
        console.error('Failed to get stats:', error);
        sendResponse({ status: 'ERROR', message: error.message });
    }
}

// 处理测试环境设置
async function handleSetupTestEnvironment(request, sendResponse) {
    try {
        await autoSetupTestEnvironment();
        sendResponse({ status: 'SUCCESS', message: '测试环境配置完成' });
    } catch (error) {
        console.error('Setup test environment failed:', error);
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
    console.log('Career Assistant installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // 首次安装时自动配置测试环境
        autoSetupTestEnvironment();
    }
});

// 自动配置测试环境
async function autoSetupTestEnvironment() {
    console.log('🚀 自动配置测试环境...');
    
    const testConfig = {
        kimi_api_key: 'sk-6XIKPL62k421SxW5QHmqcJAMSqPX13jP2a3GzqcNq5E6kNEk',
        default_model: 'kimi',
        max_concurrent_requests: 2,
        enable_caching: true,
        daily_cost_limit: 5.00,
        daily_request_limit: 100,
        privacy_mode: false,
        developer_mode: true
    };
    
    try {
        await chrome.storage.local.set(testConfig);
        console.log('✅ 测试配置已自动保存');
        console.log('📋 配置详情:', testConfig);
        
        // 测试API连接
        setTimeout(async () => {
            try {
                const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${testConfig.kimi_api_key}`
                    },
                    body: JSON.stringify({
                        model: 'moonshot-v1-8k',
                        messages: [{ role: 'user', content: '你好，请简单介绍一下你自己。' }],
                        max_tokens: 50,
                        temperature: 0.3
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Kimi API连接测试成功!');
                    console.log('🤖 AI回复:', data.choices[0].message.content);
                    
                    // 显示成功通知
                    chrome.notifications.create({
                        type: 'basic',
                        title: 'SmartInsight 测试环境就绪',
                        message: 'Kimi API已配置完成，可以开始测试LinkedIn分析功能！'
                    });
                } else {
                    console.error('❌ API连接测试失败:', response.status);
                }
            } catch (error) {
                console.error('❌ API测试出错:', error);
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ 自动配置失败:', error);
    }
}

// 5. 监听标签页更新（用于自动检测LinkedIn页面）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const url = new URL(tab.url);
        
        // 检测LinkedIn页面
        if (url.hostname === 'www.linkedin.com' && 
            (url.pathname.includes('/in/') || url.pathname.includes('/company/'))) {
            
            // 注入必要的脚本
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: [
                    'src/scrapers/linkedin-scraper.js',
                    'src/ui/sidebar.js'
                ]
            }).catch(error => {
                console.log('Script injection failed (expected for some pages):', error);
            });
        }
    }
});
