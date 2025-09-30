// popup.js 

// 1. 全局变量
let summaryButton;
let statusMessage;
let outputDiv;


// ==========================================================
// A. 辅助函数
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
// C. 初始化和启动代码
// ==========================================================

function init() {
    // 1. 获取 DOM 元素
    summaryButton = document.getElementById('summarize-button');
    statusMessage = document.getElementById('status-message');
    outputDiv = document.getElementById('summary-output');
    
    if (!summaryButton || !statusMessage) {
        console.error('Initialization Error: Missing essential DOM elements.');
        return;
    }

    // 2. AI 功能检查
    if ('Summarizer' in self) {
        statusMessage.textContent = 'AI functionality ready.';
        summaryButton.disabled = false;
        summaryButton.addEventListener('click', runSummaryWorkflow);
    } else {
        statusMessage.textContent = '❌ Browser does not support Built-in AI.';
        summaryButton.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', init);
