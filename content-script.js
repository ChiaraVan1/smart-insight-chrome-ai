// content-script.js
// 访问网页 DOM

function extractPageContent() {
    // 目标：获取所有可见文本，用于 Summarizer API 
    // 未DOM清洗。
    const textContent = document.body.innerText;
    
    // 返回提取的文本
    return textContent;
}

// 供 popup.js 调用
(async () => {
    const content = extractPageContent();
    return content;
})();