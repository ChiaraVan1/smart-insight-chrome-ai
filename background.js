/* background.js - Chrome Built-in AI 后台服务（移除 SW 中的 self.ai，统一转发到 Offscreen/LanguageModel） */


let chromeAIManager = null;
let aiCapabilities = null;           
let modelStatus = 'checking';        
let database = null;

const ICON = 'icon128.png';          

// Offscreen：只在需要时创建一次；所有 AI 调用一律转发过去
async function ensureOffscreen() {
  const has = await chrome.offscreen.hasDocument?.();
  if (!has) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['IFRAME_SCRIPTING'],        
      justification: 'Run on-device LanguageModel in a page context'
    });
  }
}
// 
function callOffscreen(action, payload = {}, timeoutMs = 60000) {
  return new Promise(async (resolve) => {
    await ensureOffscreen();
    let done = false;
    const timer = setTimeout(() => {
      if (!done) resolve({ ok: false, error: 'OFFSCREEN_TIMEOUT' });
    }, timeoutMs);

    chrome.runtime.sendMessage({ action, ...payload }, (resp) => {
      done = true;
      clearTimeout(timer);

      // 消息通道错误
      const le = chrome.runtime.lastError;
      if (le) {
        resolve({ ok: false, error: le.message || 'Message channel error' });
        return;
      }

      // 正常返回
      resolve(resp);
    });
  });
}


// 1. 初始化 Chrome AI 服务
async function initializeServices() {
  try {
    console.log('🚀 初始化 SmartInsight Chrome AI 服务...');
    // 改：不再在 SW 里触碰 self.ai，统一用 offscreen 的 SMOKE 测试
    await checkChromeAIAvailability();      
    await initializeChromeAI();             
    await initializeDatabase();             

    console.log('✅ SmartInsight Chrome AI 服务初始化完成');
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: ICON,
        title: 'SmartInsight 已就绪',
        message: '🔒 隐私优先 | ⚡ 本地AI | 💰 完全免费'
      });
    } catch (_) {}
  } catch (error) {
    console.error('❌ Chrome AI 服务初始化失败:', error);
    modelStatus = 'error';
    try {
      chrome.notifications.create({
        type: 'basic',
        title: 'Chrome AI 需要设置',
        message: '请启用 Chrome AI 功能以使用完整分析'
      });
    } catch (_) {}
  }
}

// 改：检查 Chrome AI 可用性（替换为 Offscreen 自检）
async function checkChromeAIAvailability() {
  console.log('🔍 检查 Chrome AI 可用性（通过 Offscreen）...');
  aiCapabilities = { prompt: null, summarizer: null, translator: null, writer: null };

  try {
    const smoke = await callOffscreen('OFFSCREEN_SMOKE');
    if (smoke?.ok) {
      modelStatus = 'ready';
      aiCapabilities.prompt = 'readily';   
      // 不查细节 只查LanguageModel availability()
    } else {
      modelStatus = 'unavailable';
    }
  } catch (e) {
    modelStatus = 'error';
    console.warn('Offscreen smoke failed:', e?.message || e);
  }
}

// 初始化 Chrome AI Manager
async function initializeChromeAI() {
  try {
    console.log('🤖 初始化 Chrome AI Manager...');
    chromeAIManager = {
      // 分析 LinkedIn 个人资料 
      analyzeProfile: async (profileData) => analyzeProfileWithChromeAI(profileData),
      // 分析公司信息
      analyzeCompany: async (companyData) => analyzeCompanyWithChromeAI(companyData),
      // 总结内容
      summarizeContent: async (content)   => summarizeWithChromeAI(content),
      // 获取性能统计
      getStats: async () => ({
        modelStatus,
        capabilities: aiCapabilities,
        cost: 0,
        privacy: '100% 本地处理',
        latency: '<1秒',
        requests: 0
      })
    };
    console.log('✅ Chrome AI Manager 初始化完成');
  } catch (error) {
    console.error('❌ Chrome AI Manager 初始化失败:', error);
    throw error;
  }
}

// Chrome AI 分析函数（内部统一转发到 Offscreen 使用 LanguageModel）
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
    console.log('🏢 使用 Chrome AI 分析公司信息（经 Offscreen/LanguageModel）...');
    const prompt = buildCompanyAnalysisPrompt(companyData);
    const result = await callChromeAIPrompt(prompt);              // 【标注】改：转发
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
  try {
    console.log('📄 使用 Chrome AI 总结内容...');
    // 改：优先尝试 OFFSCREEN_SUMMARY；若 offscreen 未实现，降级到 OFFSCREEN_PROMPT
    const resp = await callOffscreen('OFFSCREEN_SUMMARY', { text: content });
    if (resp?.ok) return resp.data;

    // 降级：构造一个简洁的英文指令，让 LM 输出要点
    const prompt = `Summarize the following content into concise bullet points:\n\n${content}`;
    return await callChromeAIPrompt(prompt);
  } catch (error) {
    console.error('Chrome AI 内容总结失败:', error);
    throw new Error(`总结失败: ${error.message}`);
  }
}


// 改：Chrome AI 核心调用函数（从 SW 改为转发至 Offscreen/LanguageModel）

async function callChromeAIPrompt(prompt) {
  if (modelStatus !== 'ready') {
    throw new Error('Chrome AI 未就绪（Offscreen smoke 未通过）。');
  }
  const resp = await callOffscreen('OFFSCREEN_PROMPT', { text: prompt });
  if (resp?.ok) return resp.data;
  throw new Error(resp?.error || 'OFFSCREEN_PROMPT failed');
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
  try {
    console.log('💾 初始化本地数据库...');
    database = {
      saveProfile: async (profile) => {
        const key = `profile_${Date.now()}`;
        await chrome.storage.local.set({ [key]: profile });
        console.log('✅ 个人资料已保存到本地');
      },
      getProfile: async (url) => {
        const result = await chrome.storage.local.get();
        const profiles = Object.values(result).filter(item => item.profile_url === url);
        return profiles.length > 0 ? profiles[0] : null;
      },
      saveCompany: async (company) => {
        const key = `company_${Date.now()}`;
        await chrome.storage.local.set({ [key]: company });
        console.log('✅ 公司信息已保存到本地');
      },
      getCompany: async (name) => {
        const result = await chrome.storage.local.get();
        const companies = Object.values(result).filter(item => item.company_name === name);
        return companies.length > 0 ? companies[0] : null;
      },
      getCostSummary: async () => ({
        totalCost: 0, requestCount: 0, privacy: '100% 本地处理'
      })
    };
    console.log('✅ 本地数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  }
}

// 结果解析与辅助函数
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
      cost_usd: 0,
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
      if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
      currentSection = line.replace(/[*#]/g, '').trim().toLowerCase();
      currentContent = [];
    } else if (line.trim()) {
      currentContent.push(line.trim());
    }
  }
  if (currentSection) sections[currentSection] = currentContent.join('\n').trim();
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


// 简化的工作流执行（原样保留）

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


// Chrome AI 直接调用（兼容旧接口）改：把“外部 LLM 调用”替换为本地 LM（转发）

async function callLLMDirect(params) {
  try {
    console.log('🔄 使用 Chrome 本地 AI 替代外部 API...');
    const result = await callChromeAIPrompt(params.prompt);
    return {
      content: result,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model: 'Gemini Nano (Chrome Built-in)',
      cost: 0,
      privacy: '100% 本地处理'
    };
  } catch (error) {
    console.error('Chrome AI call failed:', error);
    throw new Error(`Chrome AI 调用失败: ${error.message}`);
  }
}


// 2. 增强的消息处理器（改：把 AI 动作路由到 offscreen）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('DEBUG [BG]: Received action:', request.action);
  (async () => {
    // 处理不同类型的请求
    switch (request.action) {
      case 'RUN_SUMMARY': {
        const r = await callOffscreen('OFFSCREEN_SUMMARY', { text: request.text, url: request.url });
        if (r?.ok) sendResponse({ status: 'SUCCESS', output: r.data });
        else sendResponse({ status: 'ERROR', message: r?.error || 'OFFSCREEN_SUMMARY failed' });
        break;
      }

      case 'ANALYZE_PROFILE':
        await handleProfileAnalysis(request, sendResponse);
        break;

      case 'ANALYZE_COMPANY':
        await handleCompanyAnalysis(request, sendResponse);
        break;

      case 'ANALYZE_WEBSITE':
        await handleWebsiteAnalysis(request, sendResponse);
        break;

      case 'GET_STATS':
        await handleGetStats(request, sendResponse);
        break;

      case 'GET_LINKEDIN_PROFILE_DATA':
        await handleGetLinkedInProfileData(request, sendResponse);
        break;
      
      // 双名 popup
      case 'CHAT_PREP':
      case 'ANALYZE_PROFILE': {
        const d = request?.data || {};
        const hasProfile = !!(d.basic_info || d.experiences || d.education);

        // 1) 优先：现成结构化分析
        let text = '';
        if (hasProfile) {
          console.log('[BG][PATH] profile:structured -> chromeAIManager.analyzeProfile');
          try {
            const r = await chromeAIManager.analyzeProfile(d);

            // 判空：没内容时走兜底
            const hasAny =
              (Array.isArray(r?.flashcard?.key_points) && r.flashcard.key_points.length) ||
              (r?.icebreaker?.icebreaker) ||
              (Array.isArray(r?.questions) && r.questions.length) ||
              (r?.email_draft?.body);

            if (hasAny) {
              const keyPoints = Array.isArray(r.flashcard?.key_points) ? r.flashcard.key_points : [];
              const qs = Array.isArray(r.questions) ? r.questions.map(q => `- ${q.text}`).join('\n') : '';
              const ice = r.icebreaker?.icebreaker || '';
              const email = r.email_draft?.body || '';
              text =
                (keyPoints.length ? `**关键亮点**\n${keyPoints.map(x=>`- ${x}`).join('\n')}\n\n` : '') +
                (ice ? `**破冰开场白**\n${ice}\n\n` : '') +
                (qs ? `**深度问题**\n${qs}\n\n` : '') +
                (email ? `**后续邮件模板**\n${email}\n` : '');
            }
          } catch (e) {
            console.warn('[BG] analyzeProfile failed, will fallback:', e?.message || e);
          }
        }

        // 2) 兜底：自由回答（极简上下文 → 一句话 prompt）
        if (!text) {
          console.log('[BG][PATH] profile:fallback-prompt -> callChromeAIPrompt');
          const ctx = [
            d.basic_info?.name && `姓名：${d.basic_info.name}`,
            d.basic_info?.headline && `头衔：${d.basic_info.headline}`,
            d.current_position?.company && `当前公司：${d.current_position.company}`,
            Array.isArray(d.experiences) && d.experiences.length &&
              `经历：\n${d.experiences.slice(0,3).map(e=>`- ${e.title} @ ${e.company} (${e.duration||''})`).join('\n')}`,
            Array.isArray(d.education) && d.education.length &&
              `教育：\n${d.education.slice(0,2).map(e=>`- ${e.degree} ${e.field||''} — ${e.school}`).join('\n')}`,
            d.notes && `备注：${d.notes}`
          ].filter(Boolean).join('\n');

          const prompt =
            `你是求职社交助手。基于以下上下文，直接给出结果（不要解释）：
            - 3句自然的寒暄开场
            - 3个深入问题
            - 1句跟进建议
            要求：中文、分点、具体自然。

      ${ctx || '（无上下文）'}`;

          text = await callChromeAIPrompt(prompt);
        }

        sendResponse({ status: 'SUCCESS', output: text || 'No analysis.' });
        break;
      }


      // popup 不建新函数
      case 'COMPANY_ANALYSIS':
      case 'ANALYZE_COMPANY': {
        const d = request?.data || {};
        const hasInput = !!(d.companyName || d.companyUrl || d.additionalInfo);

        // 1) 优先：现成结构化分析
        let text = '';
        if (hasInput) {
          console.log('[BG][PATH] company:structured -> chromeAIManager.analyzeCompany');
          try {
            const r = await chromeAIManager.analyzeCompany(d);

            // 判空：没内容时走兜底
            const hasAny =
              r?.positioning ||
              (Array.isArray(r?.timeline) && r.timeline.length) ||
              (Array.isArray(r?.keyPeople) && r.keyPeople.length) ||
              (Array.isArray(r?.competition) && r.competition.length) ||
              (Array.isArray(r?.interviewTips) && r.interviewTips.length) ||
              (Array.isArray(r?.suggestedQuestions) && r.suggestedQuestions.length);

            if (hasAny) {
              const sec = (t, b) => b ? `**${t}**\n${b}\n\n` : '';
              const list = a => Array.isArray(a)&&a.length ? a.map(x=>`- ${x}`).join('\n') : '';

              text =
                sec('公司定位', r.positioning || '') +
                sec('关键时间线', list(r.timeline)) +
                sec('核心团队', list(r.keyPeople)) +
                sec('竞争优势', list(r.competition)) +
                sec('面试建议', list(r.interviewTips)) +
                sec('可提问题', list(r.suggestedQuestions));
            }
          } catch (e) {
            console.warn('[BG] analyzeCompany failed, will fallback:', e?.message || e);
          }
        }

        // 2) 兜底：自由回答（极简上下文 → 一句话 prompt）
        if (!text) {
          console.log('[BG][PATH] company:fallback-prompt -> callChromeAIPrompt');
          const ctx = [
            d.companyName && `公司：${d.companyName}`,
            d.companyUrl && `网址：${d.companyUrl}`,
            d.targetPosition && `目标职位：${d.targetPosition}`,
            d.additionalInfo && `补充：${(d.additionalInfo||'').slice(0,500)}`
          ].filter(Boolean).join('\n');

          const prompt =
            `请用中文、要点式，基于上下文给出面试准备：
            - 公司一句话定位
            - 关键时间线（3-5点）
            - 竞争优势（2-3点）
            - 面试准备建议（3-5条）
            - 可问面试官的问题（3个）
            没有信息也请给出通用建议，避免空话。

      ${ctx || '（无上下文）'}`;

          text = await callChromeAIPrompt(prompt);
        }

        sendResponse({ status: 'SUCCESS', output: text || 'No analysis.' });
        break;
      }



      // 自检：把 SMOKE 也交给 offscreen
      case 'SMOKE_TEST': {
        const resp = await callOffscreen('OFFSCREEN_SMOKE');
        if (resp?.ok) sendResponse({ ok: true, out: resp.data });
        else sendResponse({ ok: false, err: resp?.error || 'OFFSCREEN_SMOKE failed' });
        break;
      }

      default:
        sendResponse({ status: 'ERROR', message: 'Unknown action: ' + request.action });
    }
  })().catch(e => sendResponse({ status: 'ERROR', message: String(e?.message || e) }));
  return true;
});

// 处理摘要请求（改：仅检查状态→调用本地 LM via offscreen）
async function handleSummaryRequest(request, sendResponse) {
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
      suggestion: '请检查 Chrome AI 设置或尝试刷新页面'
    });
  }
}

// 处理个人资料分析
async function handleProfileAnalysis(request, sendResponse) {
  try {
    console.log('👤 使用 Chrome AI 处理个人资料分析…');
    if (!chromeAIManager) throw new Error('Chrome AI Manager 未初始化');

    const cached = await database?.getProfile(request.data.metadata?.profile_url);
    if (cached && !request.forceRefresh) {
      console.log('📋 使用缓存的分析结果');
      sendResponse({
        status: 'SUCCESS',
        data: cached.analyzed_data,
        fromCache: true,
        metadata: { source: '本地缓存', privacy: '100% 本地存储' }
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
    sendResponse({
      status: 'SUCCESS',
      data: result,
      metadata: { source: 'Chrome AI 实时分析', privacy: '100% 本地处理，数据不离开设备' }
    });
  } catch (error) {
    console.error('Chrome AI 个人资料分析失败:', error);
    sendResponse({ status: 'ERROR', message: error.message, suggestion: '请检查 Chrome AI 设置或刷新页面' });
  }
}

// 处理公司分析
async function handleCompanyAnalysis(request, sendResponse) {
  try {
    console.log('🏢 使用 Chrome AI 处理公司分析…');
    if (!chromeAIManager) throw new Error('Chrome AI Manager 未初始化');

    const cacheKey = request.data.companyUrl || request.data.companyName;
    const cached = await database?.getCompany(cacheKey);
    if (cached && !request.forceRefresh) {
      console.log('📋 使用缓存的公司分析结果');
      sendResponse({
        status: 'SUCCESS', data: cached.analyzed_data, fromCache: true,
        metadata: { source: '本地缓存', privacy: '100% 本地存储' }
      });
      return;
    }

    const result = await chromeAIManager.analyzeCompany(request.data);
    if (database) {
      await database.saveCompany({
        company_name: request.data.companyName,
        website_url: request.data.companyUrl,
        raw_data: request.data,
        analyzed_data: result,
        analyzed_at: Date.now()
      });
    }
    sendResponse({
      status: 'SUCCESS', data: result,
      metadata: { source: 'Chrome AI 实时分析', privacy: '100% 本地处理' }
    });
  } catch (error) {
    console.error('Chrome AI 公司分析失败:', error);
    sendResponse({ status: 'ERROR', message: error.message, suggestion: '请检查 Chrome AI 设置或刷新页面' });
  }
}

// 处理网站分析
async function handleWebsiteAnalysis(request, sendResponse) {
  try {
    const companyData = {
      companyName: extractCompanyNameFromUrl(request.data.url),
      companyUrl: request.data.url,
      additionalInfo: request.data.content?.substring(0, 1000)
    };
    await handleCompanyAnalysis({ data: companyData, context: request.context }, sendResponse);
  } catch (error) {
    console.error('Website analysis failed:', error);
    sendResponse({ status: 'ERROR', message: error.message });
  }
}

// 获取统计数据
async function handleGetStats(_request, sendResponse) {
  try {
    const stats = {
      aiManager: chromeAIManager ? await chromeAIManager.getStats() : {
        modelStatus, capabilities: aiCapabilities, cost: 0, privacy: '100% 本地处理'
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
async function handleGetLinkedInProfileData(_request, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes('linkedin.com/in/')) {
      throw new Error('请在LinkedIn个人资料页面使用此功能');
    }
    await ensureContentScriptLoaded(tab.id);

    const response = await sendMessageWithRetry(tab.id, { action: 'SCRAPE_LINKEDIN_PROFILE' }, 3);
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
    try {
      const ping = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      if (ping && ping.status === 'PONG') return;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 2000));
    try {
      const test = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
      if (test && test.status === 'PONG') return;
    } catch (_) {}
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content-script.js'] });
    await new Promise(r => setTimeout(r, 1000));
  } catch (error) {
    console.error('Failed to ensure content script loaded:', error);
    throw new Error('请刷新LinkedIn页面后重试');
  }
}

// 带重试的消息发送
async function sendMessageWithRetry(tabId, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (error) {
      if (i === maxRetries - 1) throw new Error('无法与页面建立连接，请刷新页面后重试');
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
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
  } catch (_) {
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

// 自动配置 Chrome AI 环境（改：不再触碰 self.ai，统一用 offscreen smoke）
async function autoSetupTestEnvironment() {
  console.log('🚀 配置 Chrome AI 环境...');
  const chromeAIConfig = {
    chrome_ai_enabled: true,
    privacy_mode: true,
    offline_capable: true,
    cost_tracking: false,
    setup_completed: Date.now()
  };
  try {
    await chrome.storage.local.set(chromeAIConfig);
    console.log('✅ Chrome AI 配置已保存');

    setTimeout(async () => {
      try {
        const smoke = await callOffscreen('OFFSCREEN_SMOKE'); // 改
        if (smoke?.ok) {
          console.log('✅ Chrome AI 已就绪!');
          try {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: ICON,
              title: 'SmartInsight Chrome AI 就绪',
              message: '🔒 隐私优先 | ⚡ 本地AI | 💰 完全免费'
            });
          } catch (_) {}
        } else {
          console.log('📥 模型尚未可用或正在下载…');
          try {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: ICON,
              title: 'Chrome AI 模型准备中',
              message: '如首次使用，请等待本地模型准备就绪'
            });
          } catch (_) {}
        }
      } catch (error) {
        console.error('❌ Chrome AI 自检失败:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('❌ Chrome AI 配置失败:', error);
  }
}


// 5) 监听标签页更新

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    if (url.hostname === 'www.linkedin.com' && (url.pathname.includes('/in/') || url.pathname.includes('/company/'))) {
      console.log('LinkedIn page detected:', url.pathname);
    }
  }
});
