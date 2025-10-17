// sidepanel.js - SmartInsight Chat Interface
// 对话式界面，支持 Coffee Chat 和 Networking 场景

// ========================================
// 状态管理
// ========================================
const AppState = {
  currentChatId: null,
  currentScenario: null, // 'coffee-chat' or 'networking'
  chats: [], // 所有对话记录
  currentTarget: null, // 当前目标人物信息
  isLoading: false
};

// ========================================
// DOM 元素引用
// ========================================
const elements = {
  // 聊天列表
  chatListPanel: document.getElementById('chatListPanel'),
  chatListContent: document.getElementById('chatListContent'),
  toggleListBtn: document.getElementById('toggleListBtn'),
  toggleListMobile: document.getElementById('toggleListMobile'),
  toggleListHandle: document.getElementById('toggleListHandle'),
  
  // 聊天区域
  chatHeader: document.getElementById('chatHeader'),
  chatMessages: document.getElementById('chatMessages'),
  emptyState: document.getElementById('emptyState'),
  chatPanel: document.querySelector('.chat-panel'),
  
  // 目标信息
  targetAvatar: document.getElementById('targetAvatar'),
  targetName: document.getElementById('targetName'),
  targetRole: document.getElementById('targetRole'),
  
  // 场景按钮
  coffeeChatBtn: document.getElementById('coffeeChatBtn'),
  networkingBtn: document.getElementById('networkingBtn'),
  
  // 场景工具栏
  scenarioToolbar: document.getElementById('scenarioToolbar'),
  scenarioIcon: document.getElementById('scenarioIcon'),
  scenarioTitle: document.getElementById('scenarioTitle'),
  scenarioContent: document.getElementById('scenarioContent'),
  closeToolbar: document.getElementById('closeToolbar'),
  
  // 输入区域
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),
  
  // 其他
  newChatBtn: document.getElementById('newChatBtn')
};

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  bindEvents();
  loadChatHistory();
});

function initializeApp() {
  console.log('🚀 SmartInsight Chat 初始化...');
  
  // 从 storage 加载聊天记录
  chrome.storage.local.get(['chats', 'pendingImport'], (result) => {
    if (result.chats) {
      AppState.chats = result.chats;
      renderChatList();
    }
    
    // 检查是否有待处理的导入
    if (result.pendingImport) {
      console.log('📥 检测到待处理的导入:', result.pendingImport);
      
      // 延迟执行导入，确保界面已加载
      setTimeout(() => {
        handlePendingImport(result.pendingImport);
        // 清除待处理的导入
        chrome.storage.local.remove('pendingImport');
      }, 500);
    }
  });
  
  // 检查是否在 LinkedIn 页面
  checkLinkedInPage();
}

// 处理待处理的导入
async function handlePendingImport(pendingImport) {
  try {
    console.log('🚀 执行待处理的导入...', pendingImport);
    
    // 如果没有当前对话，先创建一个
    if (!AppState.currentChatId) {
      createNewChat();
      // 等待DOM更新
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 确保有当前对话
    if (!AppState.currentChatId) {
      throw new Error('无法创建对话');
    }
    
    // 触发导入
    await importLinkedInProfile();
    
    showToast('✅ 已自动导入 LinkedIn 数据', 'success');
  } catch (error) {
    console.error('处理待处理导入失败:', error);
    showToast('❌ 自动导入失败: ' + error.message, 'error');
  }
}

// ========================================
// 事件绑定
// ========================================
function bindEvents() {
  // 新建对话
  elements.newChatBtn.addEventListener('click', createNewChat);
  
  // 切换聊天列表
  elements.toggleListBtn.addEventListener('click', toggleChatList);
  elements.toggleListMobile.addEventListener('click', toggleChatList);
  // handle that remains visible when list is collapsed
  if (elements.toggleListHandle) {
    elements.toggleListHandle.addEventListener('click', toggleChatList);
  }

  // sync toggle UI state initially
  updateToggleUI();
  
  // 场景按钮
  elements.coffeeChatBtn.addEventListener('click', () => activateScenario('coffee-chat'));
  elements.networkingBtn.addEventListener('click', () => activateScenario('networking'));
  
  // 关闭场景工具栏
  elements.closeToolbar.addEventListener('click', closeScenarioToolbar);
  
  // 发送消息
  elements.sendBtn.addEventListener('click', sendMessage);
  elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // 自动调整输入框高度
  elements.chatInput.addEventListener('input', autoResizeTextarea);
  
  // 快速操作卡片
  document.querySelectorAll('.quick-action-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleQuickAction(action);
    });
  });
}

// ========================================
// 聊天列表管理
// ========================================
function renderChatList() {
  elements.chatListContent.innerHTML = '';
  
  if (AppState.chats.length === 0) {
    elements.chatListContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 13px;">
        暂无对话记录<br>点击"新对话"开始
      </div>
    `;
    return;
  }
  
  // 按时间倒序排列
  const sortedChats = [...AppState.chats].sort((a, b) => b.updatedAt - a.updatedAt);
  
  sortedChats.forEach(chat => {
    const chatItem = createChatItem(chat);
    elements.chatListContent.appendChild(chatItem);
  });
}

function createChatItem(chat) {
  const div = document.createElement('div');
  div.className = 'chat-item';
  if (chat.id === AppState.currentChatId) {
    div.classList.add('active');
  }
  
  const icon = chat.scenario === 'coffee-chat' ? '☕' : 
               chat.scenario === 'networking' ? '🤝' : '💬';
  
  const lastMessage = chat.messages[chat.messages.length - 1];
  const preview = lastMessage ? lastMessage.content.substring(0, 50) : '新对话';
  
  const timeStr = formatTime(chat.updatedAt);
  
  div.innerHTML = `
    <div class="chat-item-header">
      <span class="chat-item-icon">${icon}</span>
      <span class="chat-item-name">${chat.targetName || '未命名对话'}</span>
    </div>
    <div class="chat-item-meta">${timeStr}</div>
    <div class="chat-item-preview">${preview}...</div>
  `;
  
  div.addEventListener('click', () => loadChat(chat.id));
  
  return div;
}

function createNewChat() {
  const newChat = {
    id: generateId(),
    targetName: null,
    targetRole: null,
    targetCompany: null,
    targetData: null,
    scenario: null,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  AppState.chats.unshift(newChat);
  AppState.currentChatId = newChat.id;
  
  saveChats();
  renderChatList();
  renderCurrentChat();
  
  // 显示空状态
  showEmptyState();
}

function loadChat(chatId) {
  const chat = AppState.chats.find(c => c.id === chatId);
  if (!chat) return;
  
  AppState.currentChatId = chatId;
  AppState.currentTarget = chat.targetData;
  AppState.currentScenario = chat.scenario;
  
  renderChatList();
  renderCurrentChat();
}

function renderCurrentChat() {
  const chat = getCurrentChat();
  if (!chat) {
    showEmptyState();
    return;
  }
  
  // 隐藏头部信息（不显示目标人物卡片）
  elements.chatHeader.style.display = 'none';
  
  // 更新场景按钮状态
  updateScenarioButtons();
  
  // 渲染消息
  renderMessages();
}

function renderMessages() {
  const chat = getCurrentChat();
  if (!chat || chat.messages.length === 0) {
    showEmptyState();
    return;
  }
  
  elements.emptyState.style.display = 'none';
  elements.chatMessages.innerHTML = '';
  
  chat.messages.forEach(message => {
    const messageEl = createMessageElement(message);
    elements.chatMessages.appendChild(messageEl);
  });
  
  // 滚动到底部
  scrollToBottom();
}

function createMessageElement(message) {
  const div = document.createElement('div');
  div.className = `message ${message.role}`;
  
  const avatar = message.role === 'user' ? '👤' : '🤖';
  const time = formatTime(message.timestamp);
  
  div.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(message.content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;
  
  return div;
}

function showEmptyState() {
  elements.emptyState.style.display = 'flex';
  elements.chatMessages.innerHTML = '';
  elements.chatMessages.appendChild(elements.emptyState);
}

// ========================================
// 场景管理
// ========================================
function activateScenario(scenario) {
  const chat = getCurrentChat();
  if (!chat) {
    alert('请先创建或选择一个对话');
    return;
  }
  
  AppState.currentScenario = scenario;
  chat.scenario = scenario;
  
  updateScenarioButtons();
  showScenarioToolbar(scenario);
  
  // 如果有目标人物信息，生成场景建议
  if (chat.targetData) {
    generateScenarioAdvice(scenario, chat.targetData);
  }
  
  saveChats();
}

function updateScenarioButtons() {
  elements.coffeeChatBtn.classList.remove('active');
  elements.networkingBtn.classList.remove('active');
  
  if (AppState.currentScenario === 'coffee-chat') {
    elements.coffeeChatBtn.classList.add('active');
  } else if (AppState.currentScenario === 'networking') {
    elements.networkingBtn.classList.add('active');
  }
}

function showScenarioToolbar(scenario) {
  elements.scenarioToolbar.classList.add('active');
  
  if (scenario === 'coffee-chat') {
    elements.scenarioIcon.textContent = '☕';
    elements.scenarioTitle.textContent = 'Coffee Chat 模式';
    elements.scenarioContent.innerHTML = `
      <strong>30-60分钟深度交流策略</strong><br>
      • 分层问题框架（破冰→行业洞察→个人建议）<br>
      • 实时对话提示<br>
      • 会后跟进邮件
    `;
  } else if (scenario === 'networking') {
    elements.scenarioIcon.textContent = '🤝';
    elements.scenarioTitle.textContent = 'Networking 模式';
    elements.scenarioContent.innerHTML = `
      <strong>Career Fair 2-10分钟快速攻略</strong><br>
      • Elevator Pitch 脚本<br>
      • 心机问题弹药库<br>
      • 要联系方式话术
    `;
  }
}

function closeScenarioToolbar() {
  elements.scenarioToolbar.classList.remove('active');
}

async function generateScenarioAdvice(scenario, targetData) {
  const chat = getCurrentChat();
  if (!chat) return;
  
  // 显示加载状态
  showTypingIndicator();
  
  try {
    // 调用 Chrome AI（background.js 会根据 scenario 和 targetData 构建 Prompt）
    const response = await chrome.runtime.sendMessage({
      action: 'GENERATE_SCENARIO_ADVICE',
      scenario: scenario,
      targetData: targetData
    });
    
    if (response && response.status === 'SUCCESS') {
      // 使用时间轴展示问题
      const timeline = new QuestionTimeline();
      const parsedData = timeline.parseQuestions(response.output, scenario);
      
      if (parsedData && parsedData.sections && parsedData.sections.length > 0) {
        // P1-5: 增强问题为交互式卡片
        const enhancedSections = questionCards.enhanceQuestionsWithCards(parsedData.sections, scenario);
        parsedData.sections = enhancedSections;
        
        // 生成增强版时间轴HTML
        const timelineHTML = questionCards.generateEnhancedTimelineHTML(parsedData.sections);
        addMessage('assistant', timelineHTML);
        
        // P1-4: 如果是Networking场景，添加Pitch练习器
        if (scenario === 'networking') {
          // 提取Elevator Pitch内容
          const pitchSection = parsedData.sections.find(s => 
            s.title.includes('Pitch') || s.title.includes('自我介绍')
          );
          
          if (pitchSection && pitchSection.questions.length > 0) {
            const pitchScript = pitchSection.questions[0].text;
            const trainerHTML = pitchTrainer.generateTrainerHTML(pitchScript, targetData);
            addMessage('assistant', trainerHTML);
          }
        }
        
        // 添加避雷警告和跟进邮件（如果有）
        if (parsedData.warnings && parsedData.warnings.length > 0) {
          const warningsHTML = `
            <div class="warnings-section">
              <h3>⚠️ 避雷警告</h3>
              <ul class="warnings-list">
                ${parsedData.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
              </ul>
            </div>
          `;
          addMessage('assistant', warningsHTML);
        }
        
        if (parsedData.followUp) {
          const followUpHTML = `
            <div class="followup-section">
              <h3>📧 跟进邮件模板</h3>
              <div class="email-preview">
                <div class="email-subject"><strong>主题：</strong>${escapeHtml(parsedData.followUp.subject)}</div>
                <div class="email-body">${escapeHtml(parsedData.followUp.body).replace(/\n/g, '<br>')}</div>
              </div>
              <button class="copy-email-btn" onclick="copyFollowUpEmail()">📋 复制邮件</button>
            </div>
            
            <style>
              .warnings-section {
                margin-top: 16px;
                padding: 20px;
                background: #fef2f2;
                border-radius: 12px;
                border-left: 4px solid #ef4444;
              }
              
              .warnings-section h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                color: #991b1b;
              }
              
              .warnings-list {
                margin: 0;
                padding-left: 20px;
              }
              
              .warnings-list li {
                color: #7f1d1d;
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 8px;
              }
              
              .followup-section {
                margin-top: 16px;
                padding: 20px;
                background: #f0f9ff;
                border-radius: 12px;
                border-left: 4px solid #3b82f6;
              }
              
              .followup-section h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
                color: #1e40af;
              }
              
              .email-preview {
                background: white;
                padding: 16px;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.6;
                margin-bottom: 12px;
              }
              
              .email-subject {
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 1px solid #e5e7eb;
                color: #1f2937;
              }
              
              .email-body {
                color: #4b5563;
              }
              
              .copy-email-btn {
                width: 100%;
                padding: 10px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              }
              
              .copy-email-btn:hover {
                background: #2563eb;
              }
            </style>
          `;
          addMessage('assistant', followUpHTML);
        }
      } else {
        // 如果解析失败，显示原始文本
        addMessage('assistant', response.output);
      }
    } else {
      throw new Error(response?.message || '生成失败');
    }
    
  } catch (error) {
    console.error('场景建议生成失败:', error);
    addMessage('assistant', `❌ 生成失败: ${error.message}`);
  // 改: “正在下载/未开放/超时”，给出更友好的解释
  if (isLMNotReadyReason(error?.message)) {
    showLMNotReady(error?.message);
  }
  } finally {
    hideTypingIndicator();
  }
}

// ========================================
// Prompt 构建
// ========================================
function buildCoffeeChatPrompt(targetData) {
  return `你是一位专业的职业社交顾问。请为以下 Coffee Chat 场景生成详细的准备方案：

【目标人物信息】
姓名：${targetData.name || '未提供'}
职位：${targetData.headline || '未提供'}
公司：${targetData.company || '未提供'}
工作经历：${formatExperiences(targetData.experiences)}
教育背景：${formatEducation(targetData.education)}

请生成以下内容：

🎯 **Coffee Chat 智能问题库**

━━━ 第一层：破冰 + 职业路径（前15分钟）━━━

✨ **个性化破冰**（基于LinkedIn分析）
• 提供2-3个开放式破冰话题
• 展示你做了功课
• 自然引出下一个话题

📍 **职业发展关键节点**
• 2-3个关于职业转折点的问题

━━━ 第二层：行业洞察（中间20分钟）━━━

🔍 **行业趋势**
• 2-3个关于行业发展的深度问题

━━━ 第三层：个人建议（最后10分钟）━━━

🎓 **针对性请教**
• 2个关于个人发展的问题

⚠️ **避雷警告**
• 列出3个不该问的问题

📝 **会后跟进邮件模板**
• 专业且真诚的感谢邮件（150字内）

请确保：
- 问题开放式，不能yes/no回答
- 展示做了功课（提到具体公司/项目）
- 层次分明，不越级询问`;
}

function buildNetworkingPrompt(targetData) {
  return `你是一位 Career Fair 社交专家。请为以下 Networking 场景生成快速攻略：

【目标信息】
${targetData.type === 'company' ? '公司' : '人物'}：${targetData.name || '未提供'}
${targetData.type === 'company' ? '行业' : '职位'}：${targetData.headline || targetData.industry || '未提供'}
最新动态：${targetData.recentNews || '未提供'}

请生成以下内容：

🎯 **Networking 快速攻略**

━━━ 2分钟 Elevator Pitch ━━━
• 提供一个简洁有力的自我介绍脚本（200字内）
• 包含：背景+技能+为什么对这家公司感兴趣

━━━ 心机问题弹药库 ━━━
• **Level 1**: 展示你关注公司（1个问题）
• **Level 2**: 展示你懂行业（1个问题）
• **Level 3**: 展示你想加入（1个问题）

每个问题附带"为什么有效"的解释

━━━ 要联系方式话术 ━━━
提供3种不同时机的话术：
• **时机1**: 对方介绍完公司
• **时机2**: 聊到你的匹配点
• **时机3**: 看到后面还有人排队

━━━ 24小时跟进邮件 ━━━
• 简洁的跟进邮件模板（150字内）
• 提及具体对话内容

请确保：
- Pitch简洁有力，2分钟内说完
- 问题具体到公司最近新闻/项目
- 结尾话术自然，不尴尬`;
}

// ========================================
// 消息发送
// ========================================
async function sendMessage() {
  const content = elements.chatInput.value.trim();
  if (!content || AppState.isLoading) return;
  
  const chat = getCurrentChat();
  if (!chat) {
    alert('请先创建一个对话');
    return;
  }
  
  // 添加用户消息
  addMessage('user', content);
  
  // 清空输入框
  elements.chatInput.value = '';
  autoResizeTextarea();
  
  // 显示加载状态
  showTypingIndicator();
  AppState.isLoading = true;
  
  try {
    // 构建上下文
    const context = buildContext(chat);
    
    // 调用 Chrome AI
    const response = await chrome.runtime.sendMessage({
      action: 'CHAT_MESSAGE',
      message: content,
      context: context,
      scenario: chat.scenario,
      targetData: chat.targetData
    });
    
    if (response && response.status === 'SUCCESS') {
      addMessage('assistant', response.output);
    } else {
      throw new Error(response?.message || '发送失败');
    }
    
  } catch (error) {
    console.error('消息发送失败:', error);
    addMessage('assistant', `❌ 发送失败: ${error.message}`);

  // 改: “正在下载/未开放/超时”，给出更友好的解释
  if (isLMNotReadyReason(error?.message)) {
    showLMNotReady(error?.message);
  }
  } finally {
    hideTypingIndicator();
    AppState.isLoading = false;
  }
}

function addMessage(role, content) {
  const chat = getCurrentChat();
  if (!chat) return;
  
  const message = {
    role: role,
    content: content,
    timestamp: Date.now()
  };
  
  chat.messages.push(message);
  chat.updatedAt = Date.now();
  
  saveChats();
  renderMessages();
  renderChatList();
}

function buildContext(chat) {
  // 构建对话上下文
  const recentMessages = chat.messages.slice(-10); // 最近10条消息
  
  return {
    targetName: chat.targetName,
    targetRole: chat.targetRole,
    targetCompany: chat.targetCompany,
    scenario: chat.scenario,
    recentMessages: recentMessages.map(m => ({
      role: m.role,
      content: m.content
    }))
  };
}

// ========================================
// 快速操作
// ========================================
async function handleQuickAction(action) {
  switch (action) {
    case 'linkedin-import':
      await importLinkedInProfile();
      break;
    case 'coffee-chat':
      activateScenario('coffee-chat');
      break;
    case 'networking':
      activateScenario('networking');
      break;
  }
}

async function importLinkedInProfile() {
  try {
    // 检查是否在 LinkedIn 页面
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linkedin.com')) {
      alert('请在 LinkedIn 页面使用此功能');
      return;
    }
    
    // 显示加载提示
    showTypingIndicator();
    
    // 调用 background script 获取 LinkedIn 数据
    const response = await chrome.runtime.sendMessage({
      action: 'GET_LINKEDIN_PROFILE_DATA'
    });
    
    if (response && response.status === 'SUCCESS') {
      const data = response.data;
      
      // 更新当前对话的目标信息
      const chat = getCurrentChat();
      if (chat) {
        chat.targetName = data.basic_info?.name || '未知';
        chat.targetRole = data.basic_info?.headline || '';
        chat.targetCompany = data.current_position?.company || '';
        chat.targetData = data;
        
        saveChats();
        renderCurrentChat();
        renderChatList();
        
        // 使用场景推荐系统
        const recommender = new SceneRecommender();
        const recommendation = recommender.recommendScene(data);
        
        // 自动激活推荐的场景（不显示选择界面）
        console.log('🎯 AI推荐场景:', recommendation.recommended, '匹配度:', recommendation.confidence + '%');
        
        // 延迟激活，确保数据已保存
        setTimeout(() => {
          activateScenario(recommendation.recommended);
        }, 500);
      }
    } else {
      throw new Error(response?.message || '导入失败');
    }
    
  } catch (error) {
    console.error('LinkedIn 导入失败:', error);
    alert('导入失败: ' + error.message);
  } finally {
    hideTypingIndicator();
  }
}

// ========================================
// UI 辅助函数
// ========================================
function toggleChatList() {
  const collapsed = elements.chatListPanel.classList.toggle('collapsed');

  // Update header button icon
  if (elements.toggleListBtn) {
    // header shows a thicker left-arrow character when the list is expanded
    elements.toggleListBtn.textContent = '◀';
  }

  // Update handle icon and visibility
  if (elements.toggleListHandle) {
    // when collapsed show the history (clock) icon on the handle; otherwise show a thicker arrow
    if (collapsed) {
      elements.toggleListHandle.innerHTML = getHistorySVG();
    } else {
      elements.toggleListHandle.textContent = '◀';
    }
    elements.toggleListHandle.setAttribute('aria-expanded', String(!collapsed));
  }

  // Sync which toggle controls are visible so only one toggle is shown at a time
  updateToggleUI();
}

// Ensure only one toggle control is visible at any time.
function updateToggleUI() {
  const collapsed = elements.chatListPanel.classList.contains('collapsed');

  // When collapsed: hide header toggle inside list header, show handle
  if (elements.toggleListBtn) {
    elements.toggleListBtn.style.display = collapsed ? 'none' : 'inline-block';
    // ensure header shows history icon when visible
    if (!collapsed) elements.toggleListBtn.textContent = '◀';
  }

  if (elements.toggleListHandle) {
    // CSS controls actual visibility; we set pointer/focusability
    elements.toggleListHandle.style.pointerEvents = collapsed ? 'auto' : 'none';
    elements.toggleListHandle.tabIndex = collapsed ? 0 : -1;
    // ensure handle shows clock when collapsed
    if (collapsed) elements.toggleListHandle.innerHTML = getHistorySVG();
  }

  // Mobile toggle should remain available for small screens
  if (elements.toggleListMobile) {
    elements.toggleListMobile.style.display = 'none';
  }
}

function getHistorySVG() {
  return `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"></circle>
      <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  `;
}

function autoResizeTextarea() {
  const textarea = elements.chatInput;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'message assistant';
  indicator.id = 'typing-indicator';
  indicator.innerHTML = `
    <div class="message-avatar">🤖</div>
    <div class="message-content">
      <div class="message-bubble">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  
  elements.chatMessages.appendChild(indicator);
  scrollToBottom();
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// ========================================
// 数据持久化
// ========================================
function saveChats() {
  chrome.storage.local.set({ chats: AppState.chats }, () => {
    console.log('💾 聊天记录已保存');
  });
}

function loadChatHistory() {
  chrome.storage.local.get(['chats'], (result) => {
    if (result.chats) {
      AppState.chats = result.chats;
      renderChatList();
    }
  });
}

// ========================================
// 工具函数
// ========================================
function getCurrentChat() {
  return AppState.chats.find(c => c.id === AppState.currentChatId);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
  
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

function formatExperiences(experiences) {
  if (!experiences || experiences.length === 0) return '未提供';
  return experiences.slice(0, 3).map(exp => 
    `${exp.title} @ ${exp.company} (${exp.duration || ''})`
  ).join('; ');
}

function formatEducation(education) {
  if (!education || education.length === 0) return '未提供';
  return education.slice(0, 2).map(edu => 
    `${edu.school} - ${edu.degree || ''} ${edu.field || ''}`
  ).join('; ');
}

async function checkLinkedInPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('linkedin.com')) {
      console.log('✅ 当前在 LinkedIn 页面');
    }
  } catch (error) {
    console.log('无法检查当前页面');
  }
}

// 绑定场景推荐卡片的事件
function bindSceneRecommendationEvents() {
  // 绑定场景按钮 (支持新旧两种按钮样式)
  const sceneButtons = document.querySelectorAll('.scene-btn, .scene-option-btn');
  sceneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scene = btn.getAttribute('data-scene');
      if (scene) {
        activateScenario(scene);
      }
    });
  });
  
  // 绑定手动选择链接
  const manualLink = document.getElementById('manual-scene-select');
  if (manualLink) {
    manualLink.addEventListener('click', (e) => {
      e.preventDefault();
      showManualSceneSelector();
    });
  }
}

// 显示手动场景选择器
function showManualSceneSelector() {
  const chat = getCurrentChat();
  if (!chat) return;
  
  addMessage('assistant', `
    <div class="manual-scene-selector">
      <h3>请选择场景</h3>
      <div class="scene-options">
        <button class="scene-option" data-scene="coffee-chat">
          <span class="icon">☕</span>
          <div class="info">
            <div class="title">Coffee Chat</div>
            <div class="desc">30-60分钟深度交流，获取职业洞察</div>
          </div>
        </button>
        <button class="scene-option" data-scene="networking">
          <span class="icon">🤝</span>
          <div class="info">
            <div class="title">Networking</div>
            <div class="desc">2-10分钟快速社交，建立联系</div>
          </div>
        </button>
      </div>
    </div>
    
    <style>
      .manual-scene-selector {
        padding: 16px;
      }
      
      .manual-scene-selector h3 {
        margin-bottom: 16px;
        color: #1f2937;
        font-size: 16px;
      }
      
      .scene-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .scene-option {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }
      
      .scene-option:hover {
        border-color: #667eea;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      }
      
      .scene-option .icon {
        font-size: 32px;
      }
      
      .scene-option .info {
        flex: 1;
      }
      
      .scene-option .title {
        font-weight: 600;
        font-size: 15px;
        color: #1f2937;
        margin-bottom: 4px;
      }
      
      .scene-option .desc {
        font-size: 13px;
        color: #6b7280;
      }
    </style>
  `);
  
  // 绑定事件
  setTimeout(() => {
    const options = document.querySelectorAll('.scene-option');
    options.forEach(opt => {
      opt.addEventListener('click', () => {
        const scene = opt.getAttribute('data-scene');
        if (scene) {
          activateScenario(scene);
        }
      });
    });
  }, 100);
}

// 复制跟进邮件
function copyFollowUpEmail() {
  const emailSubject = document.querySelector('.email-subject').textContent.replace('主题：', '').trim();
  const emailBody = document.querySelector('.email-body').textContent;
  const fullEmail = `${emailSubject}\n\n${emailBody}`;
  
  navigator.clipboard.writeText(fullEmail).then(() => {
    const btn = document.querySelector('.copy-email-btn');
    const originalText = btn.textContent;
    btn.textContent = '✅ 已复制';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
}

// 改: 本地模型未就绪提醒
function isLMNotReadyReason(reason = '') {
  const s = String(reason || '').toLowerCase();
  return (
    s.includes('languagemodel') ||
    s.includes('download') || s.includes('downloading') || s.includes('downloadable') ||
    s.includes('smoke') || s.includes('timeout') ||
    s.includes('api not available') || s.includes('unavailable')
  );
}

function showLMNotReady(reason = '') {
  const s = String(reason || '').toLowerCase();
  let msg = '本地模型暂不可用，请稍后重试。';

  if (s.includes('unavailable') || s.includes('api not available')) {
    msg = '❌ 本地模型未开放（请确认 Chrome 127+ 且启用相关 flags）。';
  } else if (s.includes('downloading') || s.includes('downloadable') || s.includes('download')) {
    msg = '本地模型正在首次准备（下载/解压/初始化），完成后将自动可用。';
  } else if (s.includes('smoke') || s.includes('timeout')) {
    msg = '初始化较慢（网络/磁盘/杀软可能导致），稍等片刻再试。';
  }

  // 复用showToast
  showToast(msg, 'warning');
}

// Toast 提示
function showToast(message, type = 'info') {
  // 移除已存在的 toast
  const existingToast = document.getElementById('sidepanel-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.id = 'sidepanel-toast';
  toast.textContent = message;
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        transform: translateX(-50%) translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  
  if (!document.querySelector('style[data-toast-styles]')) {
    style.setAttribute('data-toast-styles', 'true');
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // 3秒后自动消失
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// 改：用户点击任意聊天区域时唤醒 Offscreen

document.addEventListener('DOMContentLoaded', () => {
  const chatPanel = document.querySelector('.chat-panel');
  if (!chatPanel) return;

  const wakeOffscreen = () => {
    chrome.runtime.sendMessage({ action: 'OFFSCREEN_PING' })
      .then(() => console.log('%c[SidePanel] ✅ Offscreen alive', 'color: #00c853'))
      .catch(() => console.log('%c[SidePanel] ❌ Offscreen ping failed', 'color: #d50000'));
  };

  // 仅在用户第一次点击时触发，防止频繁调用
  let hasPinged = false;
  chatPanel.addEventListener('click', () => {
    if (!hasPinged) {
      wakeOffscreen();
      hasPinged = true;
      // 10秒后可重新触发一次
      setTimeout(() => (hasPinged = false), 10000);
    }
  });
});

