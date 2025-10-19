/* background.js - Chrome Built-in AI Background Service（移除 SW 中的 self.ai，统一转发到 Offscreen/LanguageModel） */

// ========================================
// Extension icon click event - Open Side Panel
// ========================================
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open Side Panel
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('✅ Side Panel opened');
  } catch (error) {
    console.error('❌ Open Side Panel 失败:', error);
    // If open fails, try setting and opening
    try {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: 'sidepanel.html',
        enabled: true
      });
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (retryError) {
      console.error('❌ 重试Open Side Panel 失败:', retryError);
    }
  }
});

let chromeAIManager = null;
let aiCapabilities = null;           
let modelStatus = 'checking';        
let database = null;

const ICON = 'icon128.png';          

// Offscreen：Create only once when needed; forward all AI calls
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

// Improved: Proactive warmup (with retry)
async function prewarmLM() {
  console.log('[BG] 🔥 Starting model prewarm...');
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await ensureOffscreen();
      console.log(`[BG] 🔥 Prewarm attempt ${attempt}/3...`);
      
      const result = await chrome.runtime.sendMessage({ action: 'OFFSCREEN_PREWARM' });
      
      if (result?.ok) {
        console.log('[BG] ✅ Model prewarmed successfully');
        modelStatus = 'ready';
        return;
      } else {
        console.warn(`[BG] ⚠️ Prewarm attempt ${attempt} returned not ok:`, result?.error);
      }
    } catch (e) {
      console.warn(`[BG] ⚠️ Prewarm attempt ${attempt} failed:`, e?.message || e);
      
      // If first attempt fails, wait longer (model may be downloading)
      if (attempt < 3) {
        const waitTime = attempt === 1 ? 5000 : 3000;
        console.log(`[BG] ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.warn('[BG] ⚠️ Model prewarm failed after 3 attempts. Will retry on first use.');
}


// 
function callOffscreen(action, payload = {}, timeoutMs = 120000) {
  return new Promise(async (resolve) => {
    await ensureOffscreen();
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        console.error(`⏱️ Offscreen timeout (${timeoutMs}ms):`, action);
        resolve({ ok: false, error: 'OFFSCREEN_TIMEOUT' });
      }
    }, timeoutMs);

    chrome.runtime.sendMessage({ action, ...payload }, (resp) => {
      done = true;
      clearTimeout(timer);

      // Message channel error
      const le = chrome.runtime.lastError;
      if (le) {
        resolve({ ok: false, error: le.message || 'Message channel error' });
        return;
      }

      // Normal return
      resolve(resp);
    });
  });
}


// 1. Initialization Chrome AI 服务
async function initializeServices() {
  try {
    console.log('🚀 Initialization SmartInsight Chrome AI 服务...');
    // Improved: No longer touch self.ai in SW, use offscreen SMOKE test
    await checkChromeAIAvailability();      
    await initializeChromeAI();             
    await initializeDatabase();             

    console.log('✅ SmartInsight Chrome AI 服务Initialization完成');
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: ICON,
        title: 'SmartInsight Ready',
        message: '🔒 Privacy First | ⚡ Local AI | 💰 Completely Free'
      });
    } catch (_) {}
  } catch (error) {
    console.error('❌ Chrome AI 服务Initialization失败:', error);
    modelStatus = 'error';
    try {
      chrome.notifications.create({
        type: 'basic',
        title: 'Chrome AI Setup Required',
        message: 'Please enable Chrome AI features for full analysis'
      });
    } catch (_) {}
  }
}

// Improved: Check Chrome AI availability (replaced with Offscreen self-check)
async function checkChromeAIAvailability() {
  console.log('🔍 Checking Chrome AI availability (via Offscreen)...');
  aiCapabilities = { prompt: null, summarizer: null, translator: null, writer: null };

  try {
    const smoke = await callOffscreen('OFFSCREEN_SMOKE');
    if (smoke?.ok) {
      modelStatus = 'ready';
      aiCapabilities.prompt = 'readily';   
      // Don't check details, only check LanguageModel availability()
    } else {
      modelStatus = 'unavailable';
    }
  } catch (e) {
    modelStatus = 'error';
    console.warn('Offscreen smoke failed:', e?.message || e);
  }
}

// Initialization Chrome AI Manager
async function initializeChromeAI() {
  try {
    console.log('🤖 Initialization Chrome AI Manager...');
    chromeAIManager = {
      // 分析 LinkedIn Profile 
      analyzeProfile: async (profileData) => analyzeProfileWithChromeAI(profileData),
      // Analyze company info
      analyzeCompany: async (companyData) => analyzeCompanyWithChromeAI(companyData),
      // Summarize content
      summarizeContent: async (content)   => summarizeWithChromeAI(content),
      // Get performance stats
      getStats: async () => ({
        modelStatus,
        capabilities: aiCapabilities,
        cost: 0,
        privacy: '100% Local processing',
        latency: '<1秒',
        requests: 0
      })
    };
    console.log('✅ Chrome AI Manager Initialization完成');
  } catch (error) {
    console.error('❌ Chrome AI Manager Initialization失败:', error);
    throw error;
  }
}

// Chrome AI analysis functions (internally forward to Offscreen using LanguageModel)
async function analyzeProfileWithChromeAI(profileData) {
  const startTime = performance.now();
  try {
    console.log('🔍 使用 Chrome AI 分析Profile...');
    const prompt = buildProfileAnalysisPrompt(profileData);
    const result = await callChromeAIPrompt(prompt);              
    const structuredResult = parseProfileAnalysis(result);
    const latency = performance.now() - startTime;
    console.log(`✅ Profile分析完成，耗时: ${Math.round(latency)}ms`);
    return {
      ...structuredResult,
      metadata: {
        ...structuredResult.metadata,
        processing_time: Math.round(latency),
        ai_model: 'Gemini Nano (Chrome Built-in)',
        privacy: '100% Local processing，数据不离开设备'
      }
    };
  } catch (error) {
    console.error('Chrome AI ProfileAnalysis failed:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

async function analyzeCompanyWithChromeAI(companyData) {
  const startTime = performance.now();
  try {
    console.log('🏢 使用 Chrome AI Analyze company info（经 Offscreen/LanguageModel）...');
    const prompt = buildCompanyAnalysisPrompt(companyData);
    const result = await callChromeAIPrompt(prompt);              // 【标注】改：转发
    const structuredResult = parseCompanyAnalysis(result);
    const latency = performance.now() - startTime;
    console.log(`✅ Company analysis complete, time: ${Math.round(latency)}ms`);
    return {
      ...structuredResult,
      metadata: {
        ...structuredResult.metadata,
        processing_time: Math.round(latency),
        ai_model: 'Gemini Nano (Chrome Built-in)',
        privacy: '100% Local processing'
      }
    };
  } catch (error) {
    console.error('Chrome AI 公司Analysis failed:', error);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

async function summarizeWithChromeAI(content) {
  try {
    console.log('📄 使用 Chrome AI Summarize content...');
    // Improved: Try OFFSCREEN_SUMMARY first; fallback to OFFSCREEN_PROMPT if not implemented
    const resp = await callOffscreen('OFFSCREEN_SUMMARY', { text: content });
    if (resp?.ok) return resp.data;

    // Fallback: Construct concise English instruction for LM to output key points
    const prompt = `Summarize the following content into concise bullet points:\n\n${content}`;
    return await callChromeAIPrompt(prompt);
  } catch (error) {
    console.error('Chrome AI content summarization failed:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}


// Improved: Chrome AI core call function (changed from SW to forward to Offscreen/LanguageModel)

async function callChromeAIPrompt(prompt) {
  if (modelStatus !== 'ready') {
    throw new Error('Chrome AI not ready (Offscreen smoke failed).');
  }
  const resp = await callOffscreen('OFFSCREEN_PROMPT', { text: prompt });
  if (resp?.ok) return resp.data;
  throw new Error(resp?.error || 'OFFSCREEN_PROMPT failed');
}


// Building分析Notification词

function buildProfileAnalysisPrompt(profileData) {
  return `As a professional career consultant, please analyze the following LinkedIn profile and provide career advice:

Personal Information:
- Name:${profileData.basic_info?.name || 'Not provided'}
- Position:${profileData.basic_info?.headline || 'Not provided'}
- Current Company:${profileData.current_position?.company || 'Not provided'}

Work Experience:
${profileData.experiences?.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})`).join('\n') || 'Not provided'}

Education:
${profileData.education?.map(edu => `- ${edu.degree} in ${edu.field} from ${edu.school}`).join('\n') || 'Not provided'}

Please provide the following analysis:

**Key Highlights** (3 key points)
**Icebreaker** (1-2 natural conversation opener)
**Deep Questions** (3 questions for deep discussion)
**Quick Notes** (3 key memory points)
**Follow-up Email Template** (professional follow-up email)

Please ensure advice is practical, natural and professional.`;
}

function buildCompanyAnalysisPrompt(companyData) {
  return `As a career analyst, please analyze the following company information and provide interview preparation advice:

Company Name:${companyData.companyName || 'Not provided'}
目标Position:${companyData.targetPosition || 'Not provided'}
Company Website:${companyData.companyUrl || 'Not provided'}
Additional Info:${companyData.additionalInfo || 'Not provided'}

Please provide the following analysis:

**Company Positioning** (1 sentence summary)
**Development Timeline** (key development stages)
**Core Team** (leadership characteristics)
**Competitive Advantage** (market position analysis)
**Interview Tips** (specific preparation points)
**Suggested Questions** (3 questions to ask the interviewer)

Please ensure analysis is objective, practical and targeted.`;
}

// InitializationLocal database
async function initializeDatabase() {
  try {
    console.log('💾 InitializationLocal database...');
    database = {
      saveProfile: async (profile) => {
        const key = `profile_${Date.now()}`;
        await chrome.storage.local.set({ [key]: profile });
        console.log('✅ Profile已保存到本地');
      },
      getProfile: async (url) => {
        const result = await chrome.storage.local.get();
        const profiles = Object.values(result).filter(item => item.profile_url === url);
        return profiles.length > 0 ? profiles[0] : null;
      },
      saveCompany: async (company) => {
        const key = `company_${Date.now()}`;
        await chrome.storage.local.set({ [key]: company });
        console.log('✅ Company info saved locally');
      },
      getCompany: async (name) => {
        const result = await chrome.storage.local.get();
        const companies = Object.values(result).filter(item => item.company_name === name);
        return companies.length > 0 ? companies[0] : null;
      },
      getCostSummary: async () => ({
        totalCost: 0, requestCount: 0, privacy: '100% Local processing'
      })
    };
    console.log('✅ Local databaseInitialization完成');
  } catch (error) {
    console.error('❌ 数据库Initialization失败:', error);
  }
}

// Result parsing and helper functions
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
      privacy: '100% Local processing，数据不离开设备',
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
      privacy: '100% Local processing',
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
  const keyPointsText = sections['Key Highlights'] || sections['key highlights'] || '';
  return keyPointsText.split('\n').filter(line => line.trim()).slice(0, 3);
}
function extractGoldenQuote(sections) {
  const icebreakerText = sections['Icebreaker'] || sections['icebreaker'] || '';
  return icebreakerText.split('\n')[0] || '准备充分的对话是成功网络建设的to start';
}
function extractIcebreaker(sections) {
  return sections['Icebreaker'] || sections['icebreaker'] || '很高兴认识您，我对您在该领域的经验很感兴趣。';
}
function extractQuestions(sections) {
  const questionsText = sections['Deep Questions'] || sections['deep questions'] || '';
  const questionLines = questionsText.split('\n').filter(line => line.trim());
  return questionLines.slice(0, 3).map((question, index) => ({
    text: question.replace(/^[-*]\s*/, ''),
    priority: index === 0 ? 'P0' : index === 1 ? 'P1' : 'P2',
    category: '专业交流',
    source: 'Chrome AI Analysis'
  }));
}
function extractEmailDraft(sections) {
  const emailText = sections['Follow-up Email Template'] || sections['follow-up email'] || '';
  return {
    subject: '很高兴认识您',
    body: emailText || '感谢今天的愉快交流，期待未来有机会进一步合作。',
    tone: 'professional',
    call_to_action: 'follow_up'
  };
}
function extractPositioning(sections) {
  return sections['Company Positioning'] || sections['company positioning'] || '创新型行业领先企业';
}
function extractTimeline(sections) {
  return sections['Development Timeline'] || sections['timeline'] || '稳步发展，持续创新';
}
function extractKeyPeople(sections) {
  return sections['Core Team'] || sections['key people'] || '经验丰富的管理团队';
}
function extractCompetition(sections) {
  return sections['Competitive Advantage'] || sections['competitive advantage'] || '在行业中具有独特优势';
}
function extractInterviewTips(sections) {
  return sections['Interview Tips'] || sections['interview tips'] || '展示相关技能和经验，表达对公司的兴趣';
}
function extractSuggestedQuestions(sections) {
  const questionsText = sections['Suggested Questions'] || sections['suggested questions'] || '';
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
      privacy: '100% Local processing'
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
      // Listen for model download progress
      case 'MODEL_DOWNLOAD_PROGRESS': {
        const progress = request.progress || 0;
        console.log(`📥 Model downloading: ${progress}%`);
        
        // 第一次下载时显示通知
        if (progress === 0 || progress === 1) {
          try {
            chrome.notifications.create('model-download', {
              type: 'basic',
              iconUrl: ICON,
              title: 'Chrome AI 模型下载中',
              message: 'First use requires model download, please wait...',
              priority: 2
            });
          } catch (_) {}
        }
        
        // 下载完成时更新通知
        if (progress >= 100) {
          try {
            chrome.notifications.create('model-ready', {
              type: 'basic',
              iconUrl: ICON,
              title: 'Chrome AI Model Ready',
              message: '✅ Model download complete, ready to use!',
              priority: 2
            });
          } catch (_) {}
        }
        
        sendResponse({ status: 'SUCCESS' });
        break;
      }
      
      // 监听模型就绪事件
      case 'MODEL_READY': {
        console.log('✅ Chrome AI 模型已就绪');
        modelStatus = 'ready';
        sendResponse({ status: 'SUCCESS' });
        break;
      }
      
      // Check model status
      case 'CHECK_MODEL_STATUS': {
        console.log('[BG] Received model status check request, current status:', modelStatus);
        sendResponse({ status: modelStatus });
        break;
      }
      
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
        return true; // 改：异步响应 

      // 新增：scenarios建议生成
      case 'GENERATE_SCENARIO_ADVICE':
        await handleScenarioAdvice(request, sendResponse);
        break;

      // 新增：聊天消息处理
      case 'CHAT_MESSAGE':
        await handleChatMessage(request, sendResponse);
        break;

      // 新增：Open Side Panel
      case 'OPEN_SIDE_PANEL':
        await handleOpenSidePanel(request, sender, sendResponse);
        break;

      // 新增：自动Import LinkedIn
      case 'AUTO_IMPORT_LINKEDIN':
        await handleAutoImportLinkedIn(request, sender, sendResponse);
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
                (keyPoints.length ? `**Key Highlights**\n${keyPoints.map(x=>`- ${x}`).join('\n')}\n\n` : '') +
                (ice ? `**Icebreaker**\n${ice}\n\n` : '') +
                (qs ? `**Deep Questions**\n${qs}\n\n` : '') +
                (email ? `**Follow-up Email Template**\n${email}\n` : '');
            }
          } catch (e) {
            console.warn('[BG] analyzeProfile failed, will fallback:', e?.message || e);
          }
        }

        // 2) 兜底：自由回答（极简上下文 → 一句话 prompt）
        if (!text) {
          console.log('[BG][PATH] profile:fallback-prompt -> callChromeAIPrompt');
          const ctx = [
            d.basic_info?.name && `Name: ${d.basic_info.name}`,
            d.basic_info?.headline && `Title: ${d.basic_info.headline}`,
            d.current_position?.company && `Current Company: ${d.current_position.company}`,
            Array.isArray(d.experiences) && d.experiences.length &&
              `Experience:\n${d.experiences.slice(0,3).map(e=>`- ${e.title} @ ${e.company} (${e.duration||''})`).join('\n')}`,
            Array.isArray(d.education) && d.education.length &&
              `Education:\n${d.education.slice(0,2).map(e=>`- ${e.degree} ${e.field||''} — ${e.school}`).join('\n')}`,
            d.notes && `Notes: ${d.notes}`
          ].filter(Boolean).join('\n');

          const prompt =
            `You are a career networking assistant. Based on the context below, provide direct results (no explanations):
            - 3 natural icebreaker conversation starters
            - 3 in-depth questions
            - 1 follow-up suggestion
            Requirements: English, bullet points, specific and natural.

      ${ctx || '(No context provided)'}`;

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
                sec('Company Positioning', r.positioning || '') +
                sec('关键时间线', list(r.timeline)) +
                sec('Core Team', list(r.keyPeople)) +
                sec('Competitive Advantage', list(r.competition)) +
                sec('Interview Tips', list(r.interviewTips)) +
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
            d.companyName && `Company: ${d.companyName}`,
            d.companyUrl && `Website: ${d.companyUrl}`,
            d.targetPosition && `Target Position: ${d.targetPosition}`,
            d.additionalInfo && `Additional Info: ${(d.additionalInfo||'').slice(0,500)}`
          ].filter(Boolean).join('\n');

          const prompt =
            `Provide interview preparation in English, bullet-point format, based on the context:
            - Company positioning (one sentence)
            - Key timeline (3-5 points)
            - Competitive advantages (2-3 points)
            - Interview preparation tips (3-5 items)
            - Questions to ask the interviewer (3 questions)
            Provide general advice even if limited information is available.

      ${ctx || '(No context provided)'}`;

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
        privacy: '100% Local processing'
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

// 处理Profile分析
async function handleProfileAnalysis(request, sendResponse) {
  try {
    console.log('👤 使用 Chrome AI 处理Profile分析…');
    if (!chromeAIManager) throw new Error('Chrome AI Manager 未Initialization');

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
    // 保存结果到Local database
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
      metadata: { source: 'Chrome AI 实时分析', privacy: '100% Local processing，数据不离开设备' }
    });
  } catch (error) {
    console.error('Chrome AI ProfileAnalysis failed:', error);
    sendResponse({ status: 'ERROR', message: error.message, suggestion: '请检查 Chrome AI 设置或刷新页面' });
  }
}

// 处理公司分析
async function handleCompanyAnalysis(request, sendResponse) {
  try {
    console.log('🏢 使用 Chrome AI 处理公司分析…');
    if (!chromeAIManager) throw new Error('Chrome AI Manager 未Initialization');

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
      metadata: { source: 'Chrome AI 实时分析', privacy: '100% Local processing' }
    });
  } catch (error) {
    console.error('Chrome AI 公司Analysis failed:', error);
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
        modelStatus, capabilities: aiCapabilities, cost: 0, privacy: '100% Local processing'
      },
      database: database ? await database.getCostSummary() : null
    };
    sendResponse({ status: 'SUCCESS', data: stats });
  } catch (error) {
    console.error('Failed to get stats:', error);
    sendResponse({ status: 'ERROR', message: error.message });
  }
}

// 处理LinkedInProfile数据获取
async function handleGetLinkedInProfileData(_request, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url.includes('linkedin.com/in/')) {
      throw new Error('请在LinkedInProfile页面使用此功能');
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

// 带重试的Message Sending
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

// 3. 启动所有服务Initialization
initializeServices();

// 4. 监听扩展安装和更新事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SmartInsight Chrome AI installed/updated:', details.reason);
  if (details.reason === 'install') {		
    // 首次安装时配置 Chrome AI 环境
    autoSetupTestEnvironment();
  }
  // 改: 安装/更新后主动预热一次
  prewarmLM();
});

// 浏览器重启后也预热
chrome.runtime.onStartup?.addListener(() => {
  prewarmLM();
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
      '7. 等待 Gemini Nano Model download complete'
    ],
    benefits: [
      '🔒 完全隐私保护 - 数据不离开设备',
      '⚡ 极速响应 - Local processing无延迟',
      '💰 Completely Free - 无需任何 API 密钥',
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
              message: '🔒 Privacy First | ⚡ Local AI | 💰 Completely Free'
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

// ========================================
// 新增：scenarios建议和聊天处理函数
// ========================================

// 处理scenarios建议生成
async function handleScenarioAdvice(request, sendResponse) {
  try {
    console.log(`🎯 生成 ${request.scenario} scenarios建议...`);
    console.log('📊 Target Data:', request.targetData);
    
    const prompt = request.prompt || buildScenarioPrompt(request.scenario, request.targetData);
    console.log('📝 Generated Prompt:', prompt.substring(0, 200) + '...');
    
    const result = await callChromeAIPrompt(prompt);
    
    sendResponse({
      status: 'SUCCESS',
      output: result,
      metadata: {
        scenario: request.scenario,
        ai_model: 'Gemini Nano (Chrome Built-in)',
        cost: 0,
        privacy: '100% Local processing'
      }
    });
  } catch (error) {
    console.error('scenarios建议Generation failed:', error);
    sendResponse({
      status: 'ERROR',
      message: error.message || 'scenarios建议Generation failed'
    });
  }
}

// 处理聊天消息
async function handleChatMessage(request, sendResponse) {
  try {
    console.log('💬 处理聊天消息...');
    
    // Building包含上下文的 prompt
    const prompt = buildChatPrompt(request.message, request.context, request.scenario, request.targetData);
    const result = await callChromeAIPrompt(prompt);
    
    sendResponse({
      status: 'SUCCESS',
      output: result,
      metadata: {
        ai_model: 'Gemini Nano (Chrome Built-in)',
        cost: 0,
        privacy: '100% Local processing'
      }
    });
  } catch (error) {
    console.error('聊天消息处理失败:', error);
    sendResponse({
      status: 'ERROR',
      message: error.message || '消息处理失败'
    });
  }
}

// 处理Open Side Panel
async function handleOpenSidePanel(request, sender, sendResponse) {
  try {
    console.log('📂 Open Side Panel...');
    
    // 获取发送者的窗口 ID
    const windowId = sender.tab?.windowId;
    
    if (!windowId) {
      throw new Error('无法获取窗口ID');
    }
    
    // Open Side Panel
    await chrome.sidePanel.open({ windowId });
    
    sendResponse({
      status: 'SUCCESS',
      message: 'Side Panel opened'
    });
  } catch (error) {
    console.error('Open Side Panel 失败:', error);
    sendResponse({
      status: 'ERROR',
      message: error.message || '打开失败'
    });
  }
}

// 处理自动Import LinkedIn
async function handleAutoImportLinkedIn(request, sender, sendResponse) {
  try {
    console.log('📥 自动Import LinkedIn 数据...');
    
    // 向 Side Panel 发送Import指令
    // 注意：这里需要找到 Side Panel 的 tab 并Send message
    const tabs = await chrome.tabs.query({});
    const sidePanelTab = tabs.find(tab => tab.url?.includes('sidepanel.html'));
    
    if (sidePanelTab) {
      await chrome.tabs.sendMessage(sidePanelTab.id, {
        action: 'TRIGGER_IMPORT',
        type: request.type,
        url: request.url
      });
      
      sendResponse({
        status: 'SUCCESS',
        message: '已Trigger import'
      });
    } else {
      // Side Panel 可能还没完全加载，使用 storage 传递指令
      await chrome.storage.local.set({
        pendingImport: {
          type: request.type,
          url: request.url,
          timestamp: Date.now()
        }
      });
      
      sendResponse({
        status: 'SUCCESS',
        message: 'Import指令已保存'
      });
    }
  } catch (error) {
    console.error('Auto import failed:', error);
    sendResponse({
      status: 'ERROR',
      message: error.message || 'Import失败'
    });
  }
}

// Buildingscenarios Prompt
function buildScenarioPrompt(scenario, targetData) {
  if (scenario === 'coffee-chat') {
    return buildCoffeeChatPrompt(targetData);
  } else if (scenario === 'networking') {
    return buildNetworkingPrompt(targetData);
  }
  return 'Please provide scenario advice in English.';
}

// Coffee Chat Prompt
function buildCoffeeChatPrompt(targetData) {
  const name = targetData?.basic_info?.name || targetData?.name || 'the person';
  const headline = targetData?.basic_info?.headline || targetData?.headline || '';
  const currentCompany = targetData?.current_position?.company || targetData?.company || '';
  
  const experiences = targetData?.experiences?.slice(0, 3).map(exp => 
    `- ${exp.title} @ ${exp.company} (${exp.duration || ''})`
  ).join('\n') || '';
  
  const education = targetData?.education?.slice(0, 2).map(edu => 
    `- ${edu.school} - ${edu.degree || ''} ${edu.field || ''}`
  ).join('\n') || '';

  // 提取关键信息用于生成具体问题
  const latestCompany = targetData?.experiences?.[0]?.company || currentCompany;
  const latestTitle = targetData?.experiences?.[0]?.title || headline;
  const previousCompany = targetData?.experiences?.[1]?.company || '';
  const school = targetData?.education?.[0]?.school || '';

  return `IMPORTANT: RESPOND WITH PLAIN TEXT ONLY. DO NOT GENERATE HTML CODE OR MARKUP.

You are a career networking expert. Generate personalized Coffee Chat questions.

TARGET INFORMATION:
Name: ${name}
Current Role: ${headline} at ${currentCompany}
${latestCompany && latestCompany !== currentCompany ? `Previous Role: ${latestTitle} at ${latestCompany}` : ''}
${previousCompany ? `Earlier Experience: ${previousCompany}` : ''}
${school ? `Education: ${school}` : ''}

Generate 3 specific, personalized questions for each section. Use EXACTLY this format:

━━━ Icebreaker (0-15 min) ━━━

• Question 1 based on their career path
• Question 2 about their current role
• Question 3 about their transition or company

━━━ Industry Insights (15-35 min) ━━━

• Question 1 about industry challenges
• Question 2 about company positioning
• Question 3 about future trends

━━━ Career Advice (35-45 min) ━━━

• Question 1 about joining their company
• Question 2 about skill development
• Question 3 about career advice

⚠️ Avoid:
• Salary questions
• Referral requests (first meeting)
• Personal questions

📝 Follow-up Email:

Subject: Thank you for the Coffee Chat

Dear ${name},

Thank you for taking the time to meet with me today. Your insights about ${currentCompany} were invaluable.

Add 1-2 sentences referencing specific topics discussed.

Looking forward to staying in touch!

Best,
[Your Name]

CRITICAL FORMATTING RULES:
- Output PLAIN TEXT ONLY - NO HTML, NO CODE, NO MARKUP
- DO NOT use asterisks, brackets, or any markdown formatting
- DO NOT generate HTML tags like <div>, <style>, or any code
- Each question MUST start with • on a new line
- Write questions as complete sentences in quotes
- Questions should reference REAL data from the target information above
- Be specific and natural, not generic
- Output in English only
- DO NOT include phrases like "Question 1:" or "based on" - write the actual questions directly
- This is a TEXT-ONLY response, not HTML or code`;
}

// Networking Prompt
function buildNetworkingPrompt(targetData) {
  const name = targetData?.basic_info?.name || targetData?.name || 'the person';
  const headline = targetData?.basic_info?.headline || targetData?.headline || '';
  const currentCompany = targetData?.current_position?.company || targetData?.company || '';
  const latestCompany = targetData?.experiences?.[0]?.company || currentCompany;
  const latestTitle = targetData?.experiences?.[0]?.title || headline;
  
  return `IMPORTANT: RESPOND WITH PLAIN TEXT ONLY. DO NOT GENERATE HTML CODE OR MARKUP.

You are a career fair networking expert. Generate quick networking strategy.

TARGET INFORMATION:
Name: ${name}
Current Role: ${headline} at ${currentCompany}
${latestCompany && latestCompany !== currentCompany ? `Previous Role: ${latestTitle} at ${latestCompany}` : ''}

Generate content for a 2-10 minute Career Fair interaction. Use EXACTLY this format:

━━━ Elevator Pitch (2 min) ━━━

• Write a concise 150-word elevator pitch mentioning your background, why interested in ${currentCompany}, and what role you're targeting

━━━ Smart Questions ━━━

• Question showing you follow ${currentCompany} - mention recent news or initiatives
• Question showing you understand the industry
• Question showing genuine interest in working there

━━━ Get Contact ━━━

• After intro: Natural way to ask for contact after they introduce ${currentCompany}
• When matched: How to exchange contact when your experience aligns
• Time limited: Quick way to get contact when others are waiting

━━━ Follow-up Email ━━━

Subject: Great meeting you at the Career Fair

Dear ${name},

Thank you for taking the time to speak with me about ${currentCompany}. Your insights about ${latestTitle ? `the ${latestTitle} role` : 'the company'} were very valuable.

Add 1-2 sentences about specific topics discussed.

Looking forward to staying in touch!

Best,
[Your Name]

CRITICAL FORMATTING RULES:
- Output PLAIN TEXT ONLY - NO HTML, NO CODE, NO MARKUP
- DO NOT use asterisks, brackets, or any markdown formatting
- DO NOT generate HTML tags like <div>, <style>, or any code
- Each item MUST start with • on a new line
- Write complete sentences, not instructions
- Be specific to ${currentCompany} and ${name}'s role
- Keep it concise and actionable
- Output in English only
- DO NOT include labels like "Question 1:" - write the actual content directly
- This is a TEXT-ONLY response, not HTML or code`;
}

// Building Chat Prompt
function buildChatPrompt(message, context, scenario, targetData) {
  let systemPrompt = 'You are a professional career networking assistant. Always respond in English.';
  
  if (scenario === 'coffee-chat') {
    systemPrompt += ' Current scenario: Coffee Chat (30-60 minute deep conversation). Provide in-depth, layered advice.';
  } else if (scenario === 'networking') {
    systemPrompt += ' Current scenario: Networking (2-10 minute quick interaction). Provide concise, practical advice.';
  }
  
  // Add Target Person Information
  let contextInfo = '';
  if (targetData) {
    contextInfo = `\n\n[Target Person Information]\n`;
    contextInfo += `Name: ${targetData.name || 'Unknown'}\n`;
    contextInfo += `Position: ${targetData.headline || 'Unknown'}\n`;
    contextInfo += `Company: ${targetData.company || 'Unknown'}\n`;
  }
  
  // Add conversation history
  let conversationHistory = '';
  if (context?.recentMessages && context.recentMessages.length > 0) {
    conversationHistory = '\n\n[Recent Conversation]\n';
    context.recentMessages.forEach(msg => {
      conversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
  }
  
  return `${systemPrompt}${contextInfo}${conversationHistory}\n\n[Current Question]\n${message}\n\nProvide a professional, practical response in English. Be direct and address the user's specific request.\n\nIMPORTANT: Output PLAIN TEXT ONLY - NO HTML, NO CODE, NO MARKUP. Do not generate HTML tags or any code.`;
}
