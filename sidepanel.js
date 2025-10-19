// sidepanel.js - SmartInsight Chat Interface
// Conversational interface supporting Coffee Chat 和 Networking scenarios

// ========================================
// State Management
// ========================================
const AppState = {
  currentChatId: null,
  currentScenario: null, // 'coffee-chat' or 'networking'
  chats: [], // All conversation records
  currentTarget: null, // 当firstTarget Person Information
  isLoading: false
};

// ========================================
// DOM 元素引用
// ========================================
const elements = {
  // Chat List
  chatListPanel: document.getElementById('chatListPanel'),
  chatListContent: document.getElementById('chatListContent'),
  toggleListBtn: document.getElementById('toggleListBtn'),
  toggleListMobile: document.getElementById('toggleListMobile'),
  toggleClockBtn: document.getElementById('toggleClockBtn'),

  // Chat Area
  chatHeader: document.getElementById('chatHeader'),
  chatMessages: document.getElementById('chatMessages'),
  emptyState: document.getElementById('emptyState'),
  chatPanel: document.querySelector('.chat-panel'),

  // Target Information
  targetAvatar: document.getElementById('targetAvatar'),
  targetName: document.getElementById('targetName'),
  targetRole: document.getElementById('targetRole'),

  // scenarios按钮
  coffeeChatBtn: document.getElementById('coffeeChatBtn'),
  networkingBtn: document.getElementById('networkingBtn'),

  // scenarios工具栏
  scenarioToolbar: document.getElementById('scenarioToolbar'),
  scenarioIcon: document.getElementById('scenarioIcon'),
  scenarioTitle: document.getElementById('scenarioTitle'),
  scenarioContent: document.getElementById('scenarioContent'),
  closeToolbar: document.getElementById('closeToolbar'),

  // Input Area
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),

  // 其他
  newChatBtn: document.getElementById('newChatBtn')
};

// ========================================
// Initialization
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  bindEvents();
  loadChatHistory();
});

function initializeApp() {
  console.log('🚀 SmartInsight Chat Initialization...');

  // Listen for model download progress
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'MODEL_DOWNLOAD_PROGRESS') {
      const progress = message.progress || 0;
      if (progress < 100) {
        showToast(`📥 AIModel downloading: ${progress}%`, 'info', 3000);
      }
    } else if (message.action === 'MODEL_READY') {
      showToast('✅ AI model ready', 'success', 2000);
    }
  });

  // Proactively check model status
  checkModelStatus();

  // Load chat history from storage
  chrome.storage.local.get(['chats', 'pendingImport'], (result) => {
    if (result.chats) {
      AppState.chats = result.chats;
      renderChatList();
    }

    // Check for pending import
    if (result.pendingImport) {
      console.log('📥 Detected pending import:', result.pendingImport);

      // Delay import execution to ensure UI is loaded
      setTimeout(() => {
        handlePendingImport(result.pendingImport);
        // Clear pending import
        chrome.storage.local.remove('pendingImport');
      }, 500);
    }
  });

  // Check if on LinkedIn page
  checkLinkedInPage();

  // Proactively trigger model warmup (if not already done)
  setTimeout(() => {
    chrome.runtime.sendMessage({ action: 'OFFSCREEN_PING' })
      .then(() => console.log('✅ Offscreen document is alive'))
      .catch(() => console.log('⚠️ Offscreen document not responding'));
  }, 1000);
}

// Check model status
async function checkModelStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'CHECK_MODEL_STATUS' });
    console.log('🔍 Model status check result:', response);

    if (response && response.status === 'ready') {
      console.log('✅ Chrome AI model ready');
    } else if (response && response.status === 'checking') {
      showToast('⏳ Chrome AI model initializing...', 'info', 3000);
      // Check again in 3 seconds
      setTimeout(() => checkModelStatus(), 3000);
    } else {
      console.warn('⚠️ Model status unknown:', response?.status);
      showToast('⚠️ Checking Chrome AI model status...', 'warning', 2000);
    }
  } catch (error) {
    console.error('❌ Failed to check model status:', error);
  }
}

// Handle pending import
async function handlePendingImport(pendingImport) {
  try {
    console.log('🚀 Executing pending import...', pendingImport);

    // If no current conversation, create one first
    if (!AppState.currentChatId) {
      createNewChat();
      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Ensure current conversation exists
    if (!AppState.currentChatId) {
      throw new Error('Unable to create conversation');
    }

    // Trigger import
    await importLinkedInProfile();

    showToast('✅ LinkedIn data imported automatically', 'success');
  } catch (error) {
    console.error('Failed to handle pending import:', error);
    showToast('❌ Auto import failed: ' + error.message, 'error');
  }
}

// ========================================
// Event Binding
// ========================================
function bindEvents() {
  // New conversation
  elements.newChatBtn.addEventListener('click', createNewChat);

  // 切换Chat List
  elements.toggleListBtn.addEventListener('click', toggleChatList);
  elements.toggleListMobile.addEventListener('click', toggleChatList);
  if (elements.toggleClockBtn) {
    elements.toggleClockBtn.addEventListener('click', toggleChatList);
  }

  // sync toggle UI state initially
  updateToggleUI();

  // scenarios按钮
  elements.coffeeChatBtn.addEventListener('click', () => activateScenario('coffee-chat'));
  elements.networkingBtn.addEventListener('click', () => activateScenario('networking'));

  // Closescenarios工具栏
  elements.closeToolbar.addEventListener('click', closeScenarioToolbar);

  // Send message
  elements.sendBtn.addEventListener('click', sendMessage);
  elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  elements.chatInput.addEventListener('input', autoResizeTextarea);

  // Quick action cards
  document.querySelectorAll('.quick-action-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleQuickAction(action);
    });
  });
}

// ========================================
// Chat List管理
// ========================================
function renderChatList() {
  elements.chatListContent.innerHTML = '';

  if (AppState.chats.length === 0) {
    elements.chatListContent.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 13px;">
        No conversations yet<br>Click"New Chat"to start
      </div>
    `;
    return;
  }

  // Sort by time descending
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
  const preview = lastMessage ? lastMessage.content.substring(0, 50) : 'New Chat';

  const timeStr = formatTime(chat.updatedAt);

  div.innerHTML = `
    <div class="chat-item-header">
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="chat-item-icon">${icon}</span>
        <span class="chat-item-name">${chat.targetName || 'Unnamed conversation'}</span>
      </div>
      <button class="chat-delete-btn" title="Delete conversation" data-chat-id="${chat.id}">🗑</button>
    </div>
    <div class="chat-item-meta">${timeStr}</div>
    <div class="chat-item-preview">${preview}...</div>
  `;

  // clicking the item opens it
  div.addEventListener('click', () => loadChat(chat.id));

  // delete button handler (stop propagation so click doesn't open)
  const delBtn = div.querySelector('.chat-delete-btn');
  if (delBtn) {
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-chat-id');
      showDeleteConfirmation(id);
    });
  }

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

  showToast('✅ New conversation created', 'success');

  // Show empty state
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

  // Hide header info (don't show target person card)
  elements.chatHeader.style.display = 'none';

  // 更新scenarios按钮状态
  updateScenarioButtons();

  // Render messages
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

  // Scroll to bottom
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
      <div class="message-bubble">${message.content}</div>
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
// scenarios管理
// ========================================
async function activateScenario(scenario) {
  const chat = getCurrentChat();
  if (!chat) {
    // Create new chat if none exists
    createNewChat();
    // Wait for chat to be created
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const currentChat = getCurrentChat();
  if (!currentChat) {
    alert('Failed to create conversation');
    return;
  }

  AppState.currentScenario = scenario;
  currentChat.scenario = scenario;

  updateScenarioButtons();
  showScenarioToolbar(scenario);

  saveChats();

  // Auto-trigger LinkedIn import if no target data exists
  if (!currentChat.targetData) {
    showToast('📥 Importing LinkedIn data...', 'info', 2000);

    // Delay to ensure UI updates
    setTimeout(async () => {
      try {
        await importLinkedInProfile();
      } catch (error) {
        console.error('Auto-import failed:', error);
        showToast('⚠️ Please navigate to a LinkedIn profile page', 'warning', 3000);
      }
    }, 300);
  } else {
    // If target data already exists, generate scenario advice
    generateScenarioAdvice(scenario, currentChat.targetData);
  }
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
    elements.scenarioTitle.textContent = 'Coffee Chat Mode';
    elements.scenarioContent.innerHTML = `
      <strong>30-60minutesdeep conversation strategy</strong><br>
      • Layered question framework（Icebreaker→Industry Insights→Personal Advice）<br>
      • Real-time conversation prompts<br>
      • Post-meeting follow-up email
    `;
  } else if (scenario === 'networking') {
    elements.scenarioIcon.textContent = '🤝';
    elements.scenarioTitle.textContent = 'Networking Mode';
    elements.scenarioContent.innerHTML = `
      <strong>Career Fair 2-10minutesQuick Strategy</strong><br>
      • Elevator Pitch script<br>
      • Strategic Question Arsenal<br>
      • Contact Exchange Scripts
    `;
  }
}

// 在 UI 中展示已Import的 Name（可被用户Close）
function showImportedName(name) {
  if (!name) return;
  // Remove old banner
  const old = document.getElementById('imported-name-banner');
  if (old) old.remove();

  const banner = document.createElement('div');
  banner.id = 'imported-name-banner';
  banner.style.cssText = `
    background: #eef2ff; border: 1px solid #c7d2fe; padding: 8px 12px; border-radius: 8px; margin: 12px; display:flex; justify-content:space-between; align-items:center; gap:12px;
  `;
  banner.innerHTML = `
    <div style="font-size:14px;color:#1e293b">Imported Content: <strong>${escapeHtml(name)}</strong></div>
    <button id="imported-name-close" style="background:none;border:none;cursor:pointer;color:#6b7280">✕</button>
  `;

  const container = document.querySelector('.chat-panel');
  if (container) {
    // Insert at top of chat panel, before chatHeader
    container.insertBefore(banner, container.firstChild);
    const closeBtn = document.getElementById('imported-name-close');
    if (closeBtn) closeBtn.addEventListener('click', () => banner.remove());
    // auto dismiss after 10s
    setTimeout(() => banner.remove(), 10000);
  }
}

function closeScenarioToolbar() {
  elements.scenarioToolbar.classList.remove('active');
}

// Convert AI's HTML output back to plain text format
function convertHtmlToPlainText(htmlOutput) {
  try {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlOutput;

    let plainText = '';

    // Extract section titles and questions
    const sections = tempDiv.querySelectorAll('.timeline-section');

    sections.forEach(section => {
      const titleElement = section.querySelector('.section-title');
      const timeElement = section.querySelector('.time-badge');

      if (titleElement && timeElement) {
        const title = titleElement.textContent.trim();
        const time = timeElement.textContent.trim();
        plainText += `━━━ ${title} (${time}) ━━━\n\n`;
      }

      // Extract questions
      const questionElements = section.querySelectorAll('.question-text');
      questionElements.forEach(questionEl => {
        const questionText = questionEl.textContent.trim();
        if (questionText) {
          plainText += `• ${questionText}\n`;
        }
      });

      plainText += '\n';
    });

    // Add follow-up email if present
    const emailSection = tempDiv.querySelector('.followup-section');
    if (emailSection) {
      plainText += '📝 Follow-up Email:\n\n';
      const subject = emailSection.querySelector('.email-subject');
      const body = emailSection.querySelector('.email-body');

      if (subject) {
        plainText += subject.textContent.trim() + '\n\n';
      }
      if (body) {
        plainText += body.textContent.trim() + '\n';
      }
    }

    // Clean up any remaining HTML tags and entities
    plainText = plainText.replace(/<br\s*\/?>/gi, '\n');
    plainText = plainText.replace(/<\/?\w+[^>]*>/gi, ''); // Remove all HTML tags
    plainText = plainText.replace(/&nbsp;/gi, ' '); // Replace non-breaking spaces
    plainText = plainText.replace(/&amp;/gi, '&'); // Replace HTML entities
    plainText = plainText.replace(/&lt;/gi, '<');
    plainText = plainText.replace(/&gt;/gi, '>');
    plainText = plainText.replace(/\s+\n/g, '\n'); // Clean up extra spaces before newlines
    plainText = plainText.replace(/\n{3,}/g, '\n\n'); // Limit consecutive newlines

    console.log('✅ Successfully converted HTML to plain text');
    return plainText;

  } catch (error) {
    console.error('❌ Failed to convert HTML to plain text:', error);
    return 'Error: Could not process AI response';
  }
}

async function generateScenarioAdvice(scenario, targetData) {
  const chat = getCurrentChat();
  if (!chat) return;

  // Show loading state
  showTypingIndicator();

  try {
    // Call Chrome AI（background.js 会根据 scenario 和 targetData Building Prompt）
    const response = await chrome.runtime.sendMessage({
      action: 'GENERATE_SCENARIO_ADVICE',
      scenario: scenario,
      targetData: targetData
    });

    if (response && response.status === 'SUCCESS') {
      console.log('🔍 DEBUG: AI Raw Output:', response.output);

      // Clean any HTML tags from AI output
      let cleanOutput = response.output;

      // Check if AI returned HTML, convert to plain text
      if (response.output.includes('<div class="enhanced-question-timeline">')) {
        console.log('⚠️ AI returned HTML, converting to plain text...');
        cleanOutput = convertHtmlToPlainText(response.output);
      } else {
        console.log('✅ AI returned text, cleaning any HTML tags...');
        // Clean any HTML tags that might be embedded in the text
        cleanOutput = cleanOutput.replace(/<br\s*\/?>/gi, '\n');
        cleanOutput = cleanOutput.replace(/<\/?\w+[^>]*>/gi, ''); // Remove all HTML tags
        cleanOutput = cleanOutput.replace(/&nbsp;/gi, ' '); // Replace non-breaking spaces
        cleanOutput = cleanOutput.replace(/&amp;/gi, '&'); // Replace HTML entities
        cleanOutput = cleanOutput.replace(/&lt;/gi, '<');
        cleanOutput = cleanOutput.replace(/&gt;/gi, '>');
      }

      // Final cleanup before display - remove any remaining HTML tags
      cleanOutput = cleanOutput.replace(/<br\s*\/?>/gi, '\n');
      cleanOutput = cleanOutput.replace(/<[^>]+>/g, '');

      console.log('🔍 DEBUG: Clean output:', cleanOutput);
      console.log('🔍 DEBUG: Contains br tags?', cleanOutput.includes('<br>'));
      addMessage('assistant', cleanOutput.replace(/\n/g, '<br>'));
    } else {
      throw new Error(response?.message || 'Scenario advice generation failed');
    }
  } catch (error) {
    console.error('Scenario advice generation failed:', error);
    hideTypingIndicator();
    showToast('Generation failed: ' + error.message, 'error');
  } finally {
    hideTypingIndicator();
  }
}

// ========================================
// Prompt Building
// ========================================
function buildCoffeeChatPrompt(targetData) {
  return `You are a professional career networking consultant。Please provide for the following Coffee Chat scenario a detailed preparation plan：

【Target Person Information】
Name:${targetData.name || 'Not provided'}
Position:${targetData.headline || 'Not provided'}
公司：${targetData.company || 'Not provided'}
Work Experience:${formatExperiences(targetData.experiences)}
Education:${formatEducation(targetData.education)}

Please generate the following:

🎯 **Coffee Chat Smart Question Bank**

━━━ Layer 1:Icebreaker + Career Path（first15minutes）━━━

✨ **个性化Icebreaker**（Based on LinkedIn analysis）
• Provide2-3个开放式Icebreaker话题
• Show you did your homework
• Naturally lead to next topic

📍 **Career Development Key Milestones**
• 2-3个questions about career turning points

━━━ Layer 2:Industry Insights（middle20minutes）━━━

🔍 **行业趋势**
• 2-3个关于行业发展的Deep Questions

━━━ Layer 3:Personal Advice（last10minutes）━━━

🎓 **Targeted Consultation**
• 2个questions about personal development

⚠️ **Warning**
• List3 questions not to ask

📝 **Post-meeting Follow-up Email Template**
• Professional and sincere thank-you email（150 characters）

Please ensure:
- Questions are open-ended, not yes/no
- Show homework done (mention specific companies/projects)
- Clear hierarchy, don't skip levels`;
}

function buildNetworkingPrompt(targetData) {
  return `You are a Career Fair networking expert。Please provide for the following Networking scenario a quick strategy：

【Target Information】
${targetData.type === 'company' ? '公司' : '人物'}：${targetData.name || 'Not provided'}
${targetData.type === 'company' ? '行业' : '职位'}：${targetData.headline || targetData.industry || 'Not provided'}
最新动态：${targetData.recentNews || 'Not provided'}

Please generate the following:

🎯 **Networking Quick Strategy**

━━━ 2minutes Elevator Pitch ━━━
• Provide一个简洁有力的Self-introductionscript（200 characters）
• Include: background + skills + why interested in this company

━━━ Strategic Question Arsenal ━━━
• **Level 1**: Show you follow the company（1个问题）
• **Level 2**: Show you understand the industry（1个问题）
• **Level 3**: Show you want to join（1个问题）

Each question includes"why it works"explanation

━━━ Contact Exchange Scripts ━━━
Provide3 scripts for different situations:
• **Timing1**: After they introduce the company
• **Timing2**: When discussing your fit
• **Timing3**: When seeing others waiting

━━━ 24hour follow-up email ━━━
• Concise follow-up email template（150 characters）
• Mention specific conversation content

Please ensure:
- Pitch is concise and powerful,2minutes内说完
- Questions specific to company's recent news/projects
- Closing scripts are natural, not awkward`;
}

// ========================================
// Message Sending
// ========================================
async function sendMessage() {
  const content = elements.chatInput.value.trim();
  if (!content || AppState.isLoading) return;

  const chat = getCurrentChat();
  if (!chat) {
    alert('Please create a conversation first');
    return;
  }

  // Add user message
  addMessage('user', content);

  // Clear input box
  elements.chatInput.value = '';
  autoResizeTextarea();

  // Show loading state
  showTypingIndicator();
  AppState.isLoading = true;

  try {
    // Building上下文
    const context = buildContext(chat);

    // Call Chrome AI
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
      throw new Error(response?.message || 'Send failed');
    }

  } catch (error) {
    console.error('Message Sending失败:', error);
    addMessage('assistant', `❌ Send failed: ${error.message}`);

  // 改: “正在下载/未开放/超时”，给出更友好explanation
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
  // Building对话上下文
  const recentMessages = chat.messages.slice(-10); // Last 10 messages

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

function showDeleteConfirmation(chatId) {
  // Remove existing confirmation if present
  const existing = document.getElementById('delete-confirmation');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'delete-confirmation';
  overlay.style.cssText = `
    position: fixed; left: 0; top: 0; right: 0; bottom: 0;
    display:flex; align-items:center; justify-content:center; z-index:12000;
    background: rgba(0,0,0,0.35);
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white; padding: 18px; border-radius: 10px; width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  `;

  dialog.innerHTML = `
    <h3 style="margin:0 0 8px 0">Delete conversation</h3>
    <p style="margin:0 0 12px 0;color:#374151">This action cannot be undone. Press Confirm to delete.</p>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button id="delete-cancel" style="padding:8px 12px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;">Cancel</button>
      <button id="delete-confirm" style="padding:8px 12px;border-radius:6px;background:#ef4444;color:white;border:none;cursor:pointer;">Confirm</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const cancelBtn = document.getElementById('delete-cancel');
  const confirmBtn = document.getElementById('delete-confirm');

  cancelBtn.addEventListener('click', () => overlay.remove());

  confirmBtn.addEventListener('click', () => {
    overlay.remove();
    performDeleteChat(chatId);
  });
}

function performDeleteChat(chatId) {
  const chat = AppState.chats.find(c => c.id === chatId);
  if (!chat) return;

  AppState.chats = AppState.chats.filter(c => c.id !== chatId);

  if (AppState.currentChatId === chatId) {
    AppState.currentChatId = null;
  }

  saveChats();
  renderChatList();

  if (!AppState.currentChatId) {
    showEmptyState();
  }

  showToast('✅ Conversation deleted', 'success');
}

// ========================================
// Quick Actions
// ========================================
async function handleQuickAction(action) {
  switch (action) {
    case 'coffee-chat':
      await activateScenario('coffee-chat');
      break;
    case 'networking':
      await activateScenario('networking');
      break;
  }
}

async function importLinkedInProfile() {
  try {
    // Check if on LinkedIn page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      alert('Please use this feature on LinkedIn pages');
      return;
    }

    if (!tab.url.includes('linkedin.com')) {
      alert('Please open a LinkedIn page before importing.');
      return;
    }

    if (!tab.url.includes('linkedin.com/in/')) {
      showToast('⚠️ Currently only personal profile pages are supported', 'warning');
      return;
    }


    // Hide the import toast notification on the LinkedIn page
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'HIDE_IMPORT_TOAST' });
    } catch (e) {
      console.log('Could not hide import toast:', e);
    }

    // Show loading prompt
    showTypingIndicator();

    // Call background script to get LinkedIn data
    const response = await chrome.runtime.sendMessage({
      action: 'GET_LINKEDIN_PROFILE_DATA'
    });

    if (response && response.status === 'SUCCESS') {
      const data = response.data;

      // 更新当first对话的Target Information
      const chat = getCurrentChat();
      if (chat) {
        chat.targetName = data.basic_info?.name || 'Unknown';
        chat.targetRole = data.basic_info?.headline || '';
        chat.targetCompany = data.current_position?.company || '';
        chat.targetData = data;

        saveChats();
        renderCurrentChat();
        renderChatList();

        // 使用scenarios推荐系统
        const recommender = new SceneRecommender();
        const recommendation = recommender.recommendScene(data);

        console.log('🎯 AI推荐scenarios:', recommendation.recommended, 'Match confidence:', recommendation.confidence + '%');

        // 只在没有激活scenarios时才自动激活推荐的scenarios
        // 如果用户已经选择了scenarios（如networking），则保持当firstscenarios不变
        if (!chat.scenario) {
          // Delay activation to ensure data is saved
          setTimeout(() => {
            activateScenario(recommendation.recommended);
          }, 500);
        } else {
          console.log('⏭️ 已有scenarios:', chat.scenario, 'Keep unchanged');
          // 如果已有scenarios，重新生成该scenarios的建议（基于新Import的数据）
          setTimeout(() => {
            generateScenarioAdvice(chat.scenario, chat.targetData);
          }, 500);
        }
        // Show imported name banner in UI
        showImportedName(chat.targetName);
      }
    } else {
      throw new Error(response?.message || 'Import失败');
    }

  } catch (error) {
    console.error('LinkedIn Import失败:', error);
    alert('Import失败: ' + error.message);
    console.error('LinkedIn Import Failed:', error);
    alert('Import failed: ' + error.message);
  } finally {
    hideTypingIndicator();
  }
}

// ========================================
// UI Helper Functions
// ========================================
function toggleChatList() {
  const collapsed = elements.chatListPanel.classList.toggle('collapsed');

  // Update header button icon
  if (elements.toggleListBtn) {
    // header shows a thicker left-arrow character when the list is expanded
    elements.toggleListBtn.textContent = '◀';
  }

  // Update handle icon and visibility
  // floating handle removed; top clock button controls collapse

  if (elements.toggleClockBtn) {
    // reflect collapsed state on the clock button next to New Chat
    elements.toggleClockBtn.setAttribute('aria-pressed', String(collapsed));
    elements.toggleClockBtn.title = collapsed ? 'Open chat list' : 'Collapse chat list';
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


  // Update clock button next to New Chat to reflect collapsed state
  if (elements.toggleClockBtn) {
    elements.toggleClockBtn.setAttribute('aria-pressed', String(collapsed));
    // simple visual cue: change opacity when active
    elements.toggleClockBtn.style.opacity = collapsed ? '0.95' : '0.8';
  }

  // Mobile toggle should remain available for small screens
  if (elements.toggleListMobile) {
    elements.toggleListMobile.style.display = 'none';
  }
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
// Data Persistence
// ========================================
function saveChats() {
  chrome.storage.local.set({ chats: AppState.chats }, () => {
    console.log('💾 Chat history saved');
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
// Utility Functions
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

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'minutesfirst';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时first';
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天first';

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

function formatExperiences(experiences) {
  if (!experiences || experiences.length === 0) return 'Not provided';
  return experiences.slice(0, 3).map(exp => 
    `${exp.title} @ ${exp.company} (${exp.duration || ''})`
  ).join('; ');
}

function formatEducation(education) {
  if (!education || education.length === 0) return 'Not provided';
  return education.slice(0, 2).map(edu => 
    `${edu.school} - ${edu.degree || ''} ${edu.field || ''}`
  ).join('; ');
}

async function checkLinkedInPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('linkedin.com')) {
      console.log('✅ 当first在 LinkedIn 页面');
    }
  } catch (error) {
    console.log('无法检查当first页面');
  }
}

// 绑定scenarios推荐卡片的事件
function bindSceneRecommendationEvents() {
  // 绑定scenarios按钮 (支持新旧两种按钮Styles)
  const sceneButtons = document.querySelectorAll('.scene-btn, .scene-option-btn');
  sceneButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scene = btn.getAttribute('data-scene');
      if (scene) {
        activateScenario(scene);
      }
    });
  });

  // Bind manual selection link
  const manualLink = document.getElementById('manual-scene-select');
  if (manualLink) {
    manualLink.addEventListener('click', (e) => {
      e.preventDefault();
      showManualSceneSelector();
    });
  }
}

// 显示手动scenarios选择器
function showManualSceneSelector() {
  const chat = getCurrentChat();
  if (!chat) return;

  addMessage('assistant', `
    <div class="manual-scene-selector">
      <h3>请选择scenarios</h3>
      <div class="scene-options">
        <button class="scene-option" data-scene="coffee-chat">
          <span class="icon">☕</span>
          <div class="info">
            <div class="title">Coffee Chat</div>
            <div class="desc">30-60minutesdeep conversation, gain career insights</div>
          </div>
        </button>
        <button class="scene-option" data-scene="networking">
          <span class="icon">🤝</span>
          <div class="info">
            <div class="title">Networking</div>
            <div class="desc">2-10minutesquick networking, build connections</div>
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

// Copy follow-up email
function copyFollowUpEmail() {
  const emailSubject = document.querySelector('.email-subject').textContent.replace('Subject:', '').trim();
  const emailBody = document.querySelector('.email-body').textContent;
  const fullEmail = `${emailSubject}\n\n${emailBody}`;

  navigator.clipboard.writeText(fullEmail).then(() => {
    const btn = document.querySelector('.copy-email-btn');
    const originalText = btn.textContent;
    btn.textContent = '✅ Copied';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
}

// Improved: Local model not ready reminder
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
  let msg = 'Local model temporarily unavailable, please try again later.';

  if (s.includes('unavailable') || s.includes('api not available')) {
    msg = '❌ Local model not available (please confirm Chrome 127+ and enable relevant flags).';
  } else if (s.includes('downloading') || s.includes('downloadable') || s.includes('download')) {
    msg = '本地模型正在首次准备（下载/解压/Initialization），完成后将自动可用。';
  } else if (s.includes('smoke') || s.includes('timeout')) {
    msg = 'Initialization较慢（网络/磁盘/杀软可能导致），稍等片刻再试。';
  }

  // Reuse showToast
  showToast(msg, 'warning');
}

// Toast Notification
function showToast(message, type = 'info') {
  // Remove existing toast
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

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// 改：用户Click任意Chat Area时唤醒 Offscreen

document.addEventListener('DOMContentLoaded', () => {
  const chatPanel = document.querySelector('.chat-panel');
  if (!chatPanel) return;

  const wakeOffscreen = () => {
    chrome.runtime.sendMessage({ action: 'OFFSCREEN_PING' })
      .then(() => console.log('%c[SidePanel] ✅ Offscreen alive', 'color: #00c853'))
      .catch(() => console.log('%c[SidePanel] ❌ Offscreen ping failed', 'color: #d50000'));
  };

  // 仅在用户第一次Click时触发，防止频繁调用
  let hasPinged = false;
  chatPanel.addEventListener('click', () => {
    if (!hasPinged) {
      wakeOffscreen();
      hasPinged = true;
      // Can trigger again after 10 seconds
      setTimeout(() => (hasPinged = false), 10000);
    }
  });
});