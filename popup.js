// popup.js - 求职助手扩展

// 1. 全局变量
let summaryButton;
let statusMessage;
let outputDiv;

// 新增求职助手相关变量
let chatPrepButton;
let chatPrepStatus;
let chatPrepOutput;
let companyAnalysisButton;
let companyAnalysisStatus;
let companyAnalysisOutput;
let analyzeCurrentPageButton;


// ==========================================================
// A. 标签页切换功能
// ==========================================================

function initTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // 添加当前标签的活动状态
            tab.classList.add('active');
            const targetTab = tab.getAttribute('data-tab');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// ==========================================================
// B. 辅助函数
// ==========================================================

// 辅助函数 1: 获取内容 
function extractPageContent() {
    const textContent = document.body.innerText;
    return textContent;
}

// 辅助函数 2: 获取当前页面内容
async function getPageContent() {
    try {
        const [tab] = await chrome.tabs.query({ 
            active: true, 
            currentWindow: true 
        });

        if (!tab || !tab.id) return null;

        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractPageContent, 
        });
        
        if (injectionResults && injectionResults[0] && injectionResults[0].result !== undefined) {
             return injectionResults[0].result;
        } else {
             throw new Error("Script injection failed or returned null result.");
        }

    } catch (error) {
        console.error('Failed to get page content:', error);
        const forbiddenUrls = ['chrome://', 'chrome-extension://']; 
        // 错误处理
        if (error.message.includes('Cannot access a chrome') || forbiddenUrls.some(prefix => tab.url.startsWith(prefix))) {
            statusMessage.textContent = '⚠️ Error: Page restricted by Chrome security. Cannot fetch content.';
        } else {
            statusMessage.textContent = 'Error: Failed to fetch page content. Check manifest permissions.';
        }
        return null;
    }
}

// TTS

let isSpeaking = false; 

function handleAudioClick(summaryText) {
    const audioButton = document.getElementById('audio-button');
    if (!audioButton) return;

    if (isSpeaking) {
        // 停止朗读
        chrome.tts.stop();
        isSpeaking = false;
        audioButton.textContent = '▶️ Start Audio Mode';
        audioButton.disabled = false;
        statusMessage.textContent = 'Audio stopped.';
        return;
    }

    // 开始朗读
    isSpeaking = true;
    audioButton.textContent = '⏹️ Stop Audio Mode';
    audioButton.disabled = true; // 播放开始时禁用，防止多次触发
    statusMessage.textContent = 'Starting audio playback...';

    const options = {
        rate: 1.0, // 语速 
        pitch: 1.0, // 音高 
        onEvent: (event) => {
            // 监听 TTS 事件
            if (event.type === 'end' || event.type === 'interrupted' || event.type === 'error') {
                isSpeaking = false;
                audioButton.textContent = '▶️ Start Audio Mode';
                audioButton.disabled = false;
                if (event.type === 'end') {
                    statusMessage.textContent = 'Audio playback finished.';
                } else if (event.type === 'error') {
                    statusMessage.textContent = `TTS Error: ${event.errorMessage}`;
                    console.error('TTS Error:', event.errorMessage);
                } else {
                    statusMessage.textContent = 'Audio stopped.';
                }
            }
        }
    };

    // 调用 Chrome TTS API
    chrome.tts.speak(summaryText, options);
}



// ==========================================================
// B. 核心函数：runSummaryWorkflow
// ==========================================================

async function runSummaryWorkflow() {
    statusMessage.textContent = 'Fetching page content...';
    summaryButton.disabled = true;
    outputDiv.innerHTML = '';

    // 1. 获取网页内容
    const pageContent = await getPageContent();
    if (!pageContent || pageContent.length === 0) {
        statusMessage.textContent = 'Error: Could not fetch page content.';
        summaryButton.disabled = false;
        return;
    }

    // 检查内容长度
    if (pageContent.length < 100) {
        statusMessage.textContent = '⚠️ Warning: Content is too short. Cannot summarize.';
        summaryButton.disabled = false;
        return;
    }
    
    // 2. 语言检测 
    let languageCode = 'auto'; 
    if ('LanguageDetector' in self) {
        try {
            // 实际检测逻辑省略
            statusMessage.textContent = 'Sending task to Service Worker...';
        } catch (error) {
             // 忽略错误，继续摘要
        }
    } else {
         statusMessage.textContent = 'Sending task to Service Worker...';
    }


    // 3. 核心：发送消息给 Service Worker，并等待结果
    try {
        const messageToSend = {
            action: 'RUN_SUMMARY', 
            text: pageContent,
        };
        
        // 发送消息并等待 Service Worker 的异步回复
        const response = await chrome.runtime.sendMessage(messageToSend);

        // 4. 处理 Service Worker 的响应
        if (response && response.status === 'SUCCESS') {
            const summaryText = response.output;

            // 检查并处理 'undefined' 或空内容的情况 
            if (!summaryText || summaryText.length === 0) {
                outputDiv.innerHTML = `<h4>⚠️ AI Returned No Content</h4><p>The model initialized successfully, but returned an empty summary. The text might be too short or complex.</p>`;
                statusMessage.textContent = 'Summary returned empty.';
                return;
            }

            // 最终显示结果
            outputDiv.innerHTML = `
                <h4> Summary Results (via Service Worker)</h4>
                <div id="summary-text-content" style="border: 1px solid #ddd; padding: 10px; background-color: #f9f9f9;">${summaryText}</div>
                <button id="audio-button" style="margin-top: 10px;">▶️ Start Audio Mode</button>
            `;
            statusMessage.textContent = 'Summary generated successfully.';
            
            // 绑定音频按钮
            const audioButton = document.getElementById('audio-button');
            if (audioButton) {
                // 将摘要文本传递给处理函数
                audioButton.addEventListener('click', () => handleAudioClick(summaryText)); 
                audioButton.disabled = false;
            }
            
        } else if (response && response.status === 'ERROR') {
            // 收到 Service Worker 报告的错误
            throw new Error(response.message || 'Unknown error from Service Worker.');
        } else {
            // Service Worker 可能未启动或没有返回有效的状态
            throw new Error('Service Worker failed to return a valid response object.');
        }

    } catch (error) {
        console.error('Final Workflow Failed (Message Send/Receive):', error);
        outputDiv.innerHTML = `<h4>❌ Final Summary Failed</h4><p>Reason: ${error.message || 'Model initialization failed in background.'}</p>`;
        statusMessage.textContent = 'AI model processing failed.';
    } finally {
        // 确保无论成功还是失败，按钮都能恢复点击
        summaryButton.disabled = false;
    }
}



// ==========================================================
// C. 求职助手核心功能
// ==========================================================

// 自动填充LinkedIn个人信息
async function autoFillLinkedInProfile() {
    const autoFillButton = document.getElementById('auto-fill-profile');
    autoFillButton.disabled = true;
    autoFillButton.textContent = '获取中...';
    
    try {
        // 检查当前页面是否为LinkedIn个人资料页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.url.includes('linkedin.com/in/')) {
            throw new Error('请在LinkedIn个人资料页面使用此功能');
        }
        
        // 发送消息给background script，由它转发给content script
        const response = await chrome.runtime.sendMessage({
            action: 'GET_LINKEDIN_PROFILE_DATA'
        });
        
        if (response && response.status === 'SUCCESS') {
            const data = response.data;
            
            // 自动填充表单
            if (data.basic_info?.name) {
                document.getElementById('person-name').value = data.basic_info.name;
            }
            if (data.basic_info?.headline) {
                document.getElementById('person-position').value = data.basic_info.headline;
            }
            if (data.current_position?.company) {
                document.getElementById('person-company').value = data.current_position.company;
            }
            
            // 填充完整工作经历
            if (data.experiences && data.experiences.length > 0) {
                const workText = data.experiences.map(exp => {
                    let expText = `📍 ${exp.title} @ ${exp.company}`;
                    if (exp.duration) expText += `\n   时间: ${exp.duration}`;
                    if (exp.location) expText += `\n   地点: ${exp.location}`;
                    if (exp.description) expText += `\n   描述: ${exp.description}`;
                    return expText;
                }).join('\n\n');
                document.getElementById('work-experience').value = workText;
            }
            
            // 填充教育经历
            if (data.education && data.education.length > 0) {
                const eduText = data.education.map(edu => {
                    let text = `🎓 ${edu.school}`;
                    if (edu.degree) text += ` - ${edu.degree}`;
                    if (edu.field) text += ` (${edu.field})`;
                    if (edu.duration) text += ` ${edu.duration}`;
                    return text;
                }).join('\n');
                document.getElementById('education-background').value = eduText;
            }
            
            // 填充最近动态
            if (data.recent_activity && data.recent_activity.length > 0) {
                const activityText = data.recent_activity.map(activity => {
                    const typeEmoji = {
                        'post': '📝',
                        'comment': '💬', 
                        'share': '🔄',
                        'like': '👍'
                    };
                    return `${typeEmoji[activity.type] || '📱'} ${activity.content.substring(0, 100)}...`;
                }).join('\n\n');
                document.getElementById('recent-activity').value = activityText;
            }
            
            // 填充共同点信息
            const commonText = [];
            
            if (data.commonalities) {
                if (data.commonalities.mutual_connections > 0) {
                    commonText.push(`🤝 ${data.commonalities.mutual_connections}个共同连接`);
                }
                if (data.commonalities.mutual_companies?.length > 0) {
                    commonText.push(`🏢 共同公司: ${data.commonalities.mutual_companies.join(', ')}`);
                }
                if (data.commonalities.mutual_schools?.length > 0) {
                    commonText.push(`🎓 共同学校: ${data.commonalities.mutual_schools.join(', ')}`);
                }
            }
            
            // 填充关注信息
            if (data.following && data.following.length > 0) {
                const companies = data.following.filter(f => f.type === 'company').map(f => f.name);
                const people = data.following.filter(f => f.type === 'person').map(f => f.name);
                
                const followingText = [];
                if (companies.length > 0) {
                    followingText.push(`🏢 关注的公司:\n${companies.map(c => `  • ${c}`).join('\n')}`);
                }
                if (people.length > 0) {
                    followingText.push(`👥 关注的人员:\n${people.map(p => `  • ${p}`).join('\n')}`);
                }
                
                document.getElementById('following-info').value = followingText.join('\n\n');
            }
            
            // 添加个人座右铭信息
            if (data.basic_info?.personal_motto) {
                commonText.push(`💡 个人座右铭: ${data.basic_info.personal_motto}`);
            }
            
            document.getElementById('common-points').value = commonText.join('\n');
            
            chatPrepStatus.textContent = '✅ LinkedIn信息已自动填充';
            chatPrepStatus.className = 'status-message success';
            chatPrepStatus.style.display = 'block';
            
        } else {
            throw new Error(response?.message || '获取LinkedIn信息失败');
        }
        
    } catch (error) {
        console.error('Auto-fill failed:', error);
        chatPrepStatus.textContent = '❌ ' + error.message;
        chatPrepStatus.className = 'status-message error';
        chatPrepStatus.style.display = 'block';
    } finally {
        autoFillButton.disabled = false;
        autoFillButton.textContent = '📋 自动填充LinkedIn信息';
    }
}

// 处理简历文件上传
async function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const userBackgroundTextarea = document.getElementById('user-background');
    
    try {
        if (file.type === 'text/plain') {
            const text = await file.text();
            userBackgroundTextarea.value = text.substring(0, 1000); // 限制长度
        } else {
            // 对于PDF和Word文档，提示用户手动输入
            userBackgroundTextarea.placeholder = `已选择文件: ${file.name}。请手动输入关键背景信息，或使用文本文件上传。`;
        }
    } catch (error) {
        console.error('文件读取失败:', error);
        userBackgroundTextarea.placeholder = '文件读取失败，请手动输入背景信息';
    }
}

// 求职者闲聊准备功能
async function generateChatPrep() {
    const name = document.getElementById('person-name').value.trim();
    const position = document.getElementById('person-position').value.trim();
    const company = document.getElementById('person-company').value.trim();
    const workExperience = document.getElementById('work-experience').value.trim();
    const education = document.getElementById('education-background').value.trim();
    const recentActivity = document.getElementById('recent-activity').value.trim();
    const followingInfo = document.getElementById('following-info').value.trim();
    const commonPoints = document.getElementById('common-points').value.trim();
    const context = document.getElementById('chat-context').value;
    
    if (!name && !position && !company) {
        chatPrepStatus.textContent = '请至少填写姓名、职位或公司信息，或点击"自动填充LinkedIn信息"';
        chatPrepStatus.style.display = 'block';
        return;
    }
    
    chatPrepButton.disabled = true;
    chatPrepStatus.textContent = '正在生成闲聊准备内容...';
    chatPrepStatus.style.display = 'block';
    chatPrepOutput.innerHTML = '';
    
    try {
        const userBackground = document.getElementById('user-background').value.trim();
        
        const prompt = `作为专业的人际交往顾问，请帮我准备与以下人员的自然、真诚的交流内容：

【目标人员信息】
姓名：${name || '未提供'}
当前职位：${position || '未提供'}
当前公司：${company || '未提供'}
交流场合：${context}

【详细背景】
工作经历：${workExperience || '未提供'}
教育背景：${education || '未提供'}
最近动态：${recentActivity || '未提供'}
关注信息：${followingInfo || '未提供'}
共同点分析：${commonPoints || '未提供'}

【我的背景信息】
${userBackground || '未提供用户背景信息'}

请生成自然、真诚的交流准备内容，避免过于正式或生硬的表达：

📊 **信息重要性排序**
- 按高/中/低优先级排序，说明为什么重要

💬 **破冰开场白**
- 基于真实共同点或有趣细节
- 语调自然、友好，避免过于正式
- 体现真诚的兴趣和好奇心

❓ **深入对话问题**
- 3-5个开放性问题
- 基于对方的具体经历和兴趣
- 能引发有意义的讨论

📧 **跟进邮件草稿**
- 温暖、专业但不失个人色彩
- 提及具体的对话细节
- 自然地建立进一步联系

📋 **速记卡片**
- 3个关键记忆点
- 1句能体现对方个性的真实引用或特点
- 便于记忆和后续提及

**重要要求：**
- 语言自然、真诚，避免商务套话
- 基于具体信息，不要泛泛而谈
- 体现对对方的真正兴趣和尊重
- 适合${context}的交流氛围`;

        const response = await chrome.runtime.sendMessage({
            action: 'CHAT_PREP',
            prompt: prompt,
            data: { 
                name, 
                position, 
                company, 
                workExperience, 
                education, 
                recentActivity, 
                followingInfo, 
                commonPoints, 
                context 
            }
        });
        
        if (response && response.status === 'SUCCESS') {
            displayChatPrepResults(response.output);
            chatPrepStatus.textContent = '闲聊准备内容生成成功';
        } else {
            throw new Error(response?.message || '生成失败');
        }
        
    } catch (error) {
        console.error('Chat prep generation failed:', error);
        chatPrepOutput.innerHTML = `<div class="card"><h4>❌ 生成失败</h4><p>${error.message}</p></div>`;
        chatPrepStatus.textContent = '生成失败，请重试';
    } finally {
        chatPrepButton.disabled = false;
    }
}

// 显示闲聊准备结果
function displayChatPrepResults(content) {
    const sections = parseChatPrepContent(content);
    
    let html = '';
    
    // 信息重要性排序
    if (sections.priorities) {
        html += `<div class="card priority-high">
            <h4>📊 信息重要性排序</h4>
            <p>${sections.priorities}</p>
        </div>`;
    }
    
    // 破冰开场白
    if (sections.icebreaker) {
        html += `<div class="card priority-high">
            <h4>💬 破冰开场白</h4>
            <p>${sections.icebreaker}</p>
            <div class="action-buttons">
                <button class="btn" onclick="copyToClipboard('${sections.icebreaker.replace(/'/g, "\\'")}')">复制</button>
            </div>
        </div>`;
    }
    
    // 深入问题
    if (sections.questions) {
        html += `<div class="card priority-medium">
            <h4>❓ 深入问题</h4>
            <p>${sections.questions}</p>
            <div class="action-buttons">
                <button class="btn" onclick="copyToClipboard('${sections.questions.replace(/'/g, "\\'")}')">复制</button>
            </div>
        </div>`;
    }
    
    // 跟进邮件
    if (sections.followUp) {
        html += `<div class="card priority-medium">
            <h4>📧 跟进邮件草稿</h4>
            <p>${sections.followUp}</p>
            <div class="action-buttons">
                <button class="btn" onclick="copyToClipboard('${sections.followUp.replace(/'/g, "\\'")}')">复制</button>
            </div>
        </div>`;
    }
    
    // 速记卡片
    if (sections.quickCard) {
        html += `<div class="card priority-low">
            <h4>📋 速记卡片</h4>
            <p>${sections.quickCard}</p>
            <div class="action-buttons">
                <button class="btn" onclick="copyToClipboard('${sections.quickCard.replace(/'/g, "\\'")}')">复制</button>
                <button class="btn btn-secondary" onclick="speakText('${sections.quickCard.replace(/'/g, "\\'")}')">语音播放</button>
            </div>
        </div>`;
    }
    
    chatPrepOutput.innerHTML = html;
}

// 公司信息分析功能
async function analyzeCompany() {
    const companyName = document.getElementById('company-name').value.trim();
    const companyUrl = document.getElementById('company-url').value.trim();
    const targetPosition = document.getElementById('target-position').value.trim();
    const additionalInfo = document.getElementById('additional-info').value.trim();
    
    if (!companyName && !companyUrl) {
        companyAnalysisStatus.textContent = '请至少填写公司名称或网址';
        companyAnalysisStatus.style.display = 'block';
        return;
    }
    
    companyAnalysisButton.disabled = true;
    companyAnalysisStatus.textContent = '正在分析公司信息...';
    companyAnalysisStatus.style.display = 'block';
    companyAnalysisOutput.innerHTML = '';
    
    try {
        const prompt = `作为求职分析师，请分析以下公司信息：
公司名称：${companyName || '未提供'}
公司网址：${companyUrl || '未提供'}
目标职位：${targetPosition || '未提供'}
额外信息：${additionalInfo || '未提供'}

请按以下格式生成分析报告：
1. 公司简单定位（1句话）
2. 最近6-12个月大事时间线
3. 关键人物和热门招聘技能
4. 竞争对手和公司亮点
5. 面试重点和匹配度建议

请确保分析客观、准确且实用。`;

        const response = await chrome.runtime.sendMessage({
            action: 'COMPANY_ANALYSIS',
            prompt: prompt,
            data: { companyName, companyUrl, targetPosition, additionalInfo }
        });
        
        if (response && response.status === 'SUCCESS') {
            displayCompanyAnalysisResults(response.output);
            companyAnalysisStatus.textContent = '公司分析完成';
        } else {
            throw new Error(response?.message || '分析失败');
        }
        
    } catch (error) {
        console.error('Company analysis failed:', error);
        companyAnalysisOutput.innerHTML = `<div class="card"><h4>❌ 分析失败</h4><p>${error.message}</p></div>`;
        companyAnalysisStatus.textContent = '分析失败，请重试';
    } finally {
        companyAnalysisButton.disabled = false;
    }
}

// 分析当前页面
async function analyzeCurrentPage() {
    analyzeCurrentPageButton.disabled = true;
    companyAnalysisStatus.textContent = '正在获取当前页面内容...';
    companyAnalysisStatus.style.display = 'block';
    
    try {
        const pageContent = await getPageContent();
        if (!pageContent) {
            throw new Error('无法获取页面内容');
        }
        
        // 自动填充公司信息
        const url = await getCurrentTabUrl();
        document.getElementById('company-url').value = url;
        document.getElementById('additional-info').value = pageContent.substring(0, 500) + '...';
        
        companyAnalysisStatus.textContent = '页面内容已获取，请点击"分析公司信息"继续';
        
    } catch (error) {
        companyAnalysisStatus.textContent = '获取页面内容失败：' + error.message;
    } finally {
        analyzeCurrentPageButton.disabled = false;
    }
}

// 显示公司分析结果
function displayCompanyAnalysisResults(content) {
    const sections = parseCompanyAnalysisContent(content);
    
    let html = '';
    
    // 公司定位
    if (sections.positioning) {
        html += `<div class="card priority-high">
            <h4>🏢 公司定位</h4>
            <p>${sections.positioning}</p>
        </div>`;
    }
    
    // 时间线
    if (sections.timeline) {
        html += `<div class="card priority-high">
            <h4>📅 重要事件时间线</h4>
            <p>${sections.timeline}</p>
        </div>`;
    }
    
    // 关键人物和技能
    if (sections.keyPeople) {
        html += `<div class="card priority-medium">
            <h4>👥 关键人物和热门技能</h4>
            <p>${sections.keyPeople}</p>
        </div>`;
    }
    
    // 竞争分析
    if (sections.competition) {
        html += `<div class="card priority-medium">
            <h4>🎯 竞争分析</h4>
            <p>${sections.competition}</p>
        </div>`;
    }
    
    // 面试建议
    if (sections.interviewTips) {
        html += `<div class="card priority-low">
            <h4>💡 面试建议</h4>
            <p>${sections.interviewTips}</p>
            <div class="action-buttons">
                <button class="btn" onclick="copyToClipboard('${sections.interviewTips.replace(/'/g, "\\'")}')">复制建议</button>
            </div>
        </div>`;
    }
    
    companyAnalysisOutput.innerHTML = html;
}

// 辅助函数
function parseChatPrepContent(content) {
    // 简单的内容解析，实际应用中可以更复杂
    const sections = {};
    const lines = content.split('\n');
    
    let currentSection = '';
    let currentContent = '';
    
    for (const line of lines) {
        if (line.includes('重要性') || line.includes('排序')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'priorities';
            currentContent = '';
        } else if (line.includes('开场白') || line.includes('破冰')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'icebreaker';
            currentContent = '';
        } else if (line.includes('问题')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'questions';
            currentContent = '';
        } else if (line.includes('邮件') || line.includes('跟进')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'followUp';
            currentContent = '';
        } else if (line.includes('卡片') || line.includes('速记')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'quickCard';
            currentContent = '';
        } else {
            currentContent += line + '\n';
        }
    }
    
    if (currentSection) sections[currentSection] = currentContent.trim();
    
    // 如果解析失败，返回原始内容
    if (Object.keys(sections).length === 0) {
        sections.icebreaker = content;
    }
    
    return sections;
}

function parseCompanyAnalysisContent(content) {
    const sections = {};
    const lines = content.split('\n');
    
    let currentSection = '';
    let currentContent = '';
    
    for (const line of lines) {
        if (line.includes('定位')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'positioning';
            currentContent = '';
        } else if (line.includes('时间线') || line.includes('大事')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'timeline';
            currentContent = '';
        } else if (line.includes('关键人') || line.includes('技能')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'keyPeople';
            currentContent = '';
        } else if (line.includes('竞争') || line.includes('亮点')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'competition';
            currentContent = '';
        } else if (line.includes('面试') || line.includes('建议')) {
            if (currentSection) sections[currentSection] = currentContent.trim();
            currentSection = 'interviewTips';
            currentContent = '';
        } else {
            currentContent += line + '\n';
        }
    }
    
    if (currentSection) sections[currentSection] = currentContent.trim();
    
    if (Object.keys(sections).length === 0) {
        sections.positioning = content;
    }
    
    return sections;
}

// 获取当前标签页URL
async function getCurrentTabUrl() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab.url;
    } catch (error) {
        return '';
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // 显示复制成功提示
        const originalText = event.target.textContent;
        event.target.textContent = '已复制!';
        setTimeout(() => {
            event.target.textContent = originalText;
        }, 1000);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

// 语音播放
function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        speechSynthesis.speak(utterance);
    } else if (chrome.tts) {
        chrome.tts.speak(text, { lang: 'zh-CN' });
    }
}

// ==========================================================
// D. 初始化和启动代码
// ==========================================================

function init() {
    // 1. 初始化标签页切换
    initTabSwitching();
    
    // 2. 获取 DOM 元素 - 网页总结
    summaryButton = document.getElementById('summarize-button');
    statusMessage = document.getElementById('status-message');
    outputDiv = document.getElementById('summary-output');
    
    // 3. 获取 DOM 元素 - 闲聊准备
    chatPrepButton = document.getElementById('generate-chat-prep');
    chatPrepStatus = document.getElementById('chat-prep-status');
    chatPrepOutput = document.getElementById('chat-prep-output');
    
    // 4. 获取 DOM 元素 - 公司分析
    companyAnalysisButton = document.getElementById('analyze-company');
    companyAnalysisStatus = document.getElementById('company-analysis-status');
    companyAnalysisOutput = document.getElementById('company-analysis-output');
    analyzeCurrentPageButton = document.getElementById('analyze-current-page');
    
    if (!summaryButton || !statusMessage) {
        console.error('Initialization Error: Missing essential DOM elements.');
        return;
    }

    // 5. AI 功能检查
    if ('Summarizer' in self) {
        statusMessage.textContent = 'AI功能就绪';
        summaryButton.disabled = false;
        summaryButton.addEventListener('click', runSummaryWorkflow);
    } else {
        statusMessage.textContent = '❌ 浏览器不支持内置AI功能';
        summaryButton.disabled = true;
    }
    
    // 6. 绑定求职助手功能事件
    if (chatPrepButton) {
        chatPrepButton.addEventListener('click', generateChatPrep);
    }
    
    // 绑定自动填充LinkedIn信息按钮
    const autoFillButton = document.getElementById('auto-fill-profile');
    if (autoFillButton) {
        autoFillButton.addEventListener('click', autoFillLinkedInProfile);
    }
    
    // 绑定文件上传处理
    const resumeUpload = document.getElementById('user-resume');
    if (resumeUpload) {
        resumeUpload.addEventListener('change', handleResumeUpload);
    }
    
    if (companyAnalysisButton) {
        companyAnalysisButton.addEventListener('click', analyzeCompany);
    }
    
    if (analyzeCurrentPageButton) {
        analyzeCurrentPageButton.addEventListener('click', analyzeCurrentPage);
    }
    
    // 7. 初始化状态
    console.log('SmartInsight 求职助手初始化完成');
}

document.addEventListener('DOMContentLoaded', init);
