// background.js 

let summarizerInstance = null; 
let modelStatus = 'checking'; 

// 1. 模型初始化和下载逻辑
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

// 2. 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // 调试：确认收到请求
    console.log('DEBUG [BG]: Received action:', request.action);

    if (!summarizerInstance) {
        setTimeout(() => { 
            sendResponse({ status: 'ERROR', message: 'AI model is not yet initialized. Please wait.' });
        }, 50);
        return true; 
    }
    
    if (request.action === 'RUN_SUMMARY' && summarizerInstance) {
        const promptInstruction = "Summarize the text into short, easy-to-understand key points for a general user.";    

        summarizerInstance.summarize(request.text, { 
            context: promptInstruction 
        })
            .then(summary => {
                // console.log：打印原始结果
                console.log("SUCCESS: Summarization result object received (RAW):", summary); 
                
                let rawOutputString = ""; 

                if (summary && typeof summary === 'object' && summary !== null) {
                    
                    // 修复：使用 Object.values() 提取所有字符，并用 .join('') 重建字符串
                    // 提取所有值 (即单个字符)
                    const characterArray = Object.values(summary);
                    
                    // 仅当数组包含字符时才合并
                    if (characterArray.length > 0) {
                        rawOutputString = characterArray.join('');
                        console.log('DEBUG [BG]: Rebuilt summary string successfully.');
                    } else {
                        // 备选，以防API恢复标准格式
                        rawOutputString = summary.output ? String(summary.output) : "";
                    }

                } else if (typeof summary === 'string') {
                    // 备选：如果 API 直接返回字符串
                    rawOutputString = summary;
                }
                
                let finalOutput = "";
                if (rawOutputString.length > 0) {
                    // 清理：替换所有空白字符为单个空格，并移除首尾空格
                    finalOutput = rawOutputString.replace(/\s+/g, ' ').trim();
                } else {
                    console.log('DEBUG [BG]: Final extracted output is empty.');
                }
                
                const finalResponse = { status: 'SUCCESS', output: finalOutput };
                
                console.log("DEBUG [BG]: Sending final response to popup:", finalResponse);
                
                sendResponse(finalResponse); 
            })
            .catch(error => {
                const errorResponse = { status: 'ERROR', message: error.message || 'Summarization failed in model runtime.' };
                console.log("DEBUG [BG]: Sending error response to popup:", errorResponse);
                
                sendResponse(errorResponse);
            });
            
        return true; 
    }
});

// 3. 启动模型初始化
initializeSummarizer();
