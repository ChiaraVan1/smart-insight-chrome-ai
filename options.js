// options.js - 配置页面脚本

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadStats();
    
    // 定期更新统计信息
    setInterval(loadStats, 30000); // 每30秒更新一次
});

// 加载设置
async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get([
            'anthropic_api_key',
            'kimi_api_key',
            'openai_api_key',
            'news_api_key',
            'default_model',
            'max_concurrent_requests',
            'enable_caching',
            'daily_cost_limit',
            'daily_request_limit',
            'privacy_mode',
            'custom_prompts',
            'developer_mode'
        ]);
        
        // 填充表单
        document.getElementById('anthropic-key').value = settings.anthropic_api_key || '';
        document.getElementById('kimi-key').value = settings.kimi_api_key || '';
        document.getElementById('openai-key').value = settings.openai_api_key || '';
        document.getElementById('news-api-key').value = settings.news_api_key || '';
        document.getElementById('default-model').value = settings.default_model || 'kimi';
        document.getElementById('max-requests').value = settings.max_concurrent_requests || 3;
        document.getElementById('enable-caching').checked = settings.enable_caching !== false;
        document.getElementById('daily-cost-limit').value = settings.daily_cost_limit || 10.00;
        document.getElementById('daily-request-limit').value = settings.daily_request_limit || 1000;
        document.getElementById('privacy-mode').checked = settings.privacy_mode || false;
        document.getElementById('custom-prompts').value = settings.custom_prompts || '';
        document.getElementById('developer-mode').checked = settings.developer_mode || false;
        
    } catch (error) {
        console.error('Failed to load settings:', error);
        showMessage('加载设置失败', 'error');
    }
}

// 保存设置
async function saveSettings() {
    try {
        const settings = {
            anthropic_api_key: document.getElementById('anthropic-key').value.trim(),
            kimi_api_key: document.getElementById('kimi-key').value.trim(),
            openai_api_key: document.getElementById('openai-key').value.trim(),
            news_api_key: document.getElementById('news-api-key').value.trim(),
            default_model: document.getElementById('default-model').value,
            max_concurrent_requests: parseInt(document.getElementById('max-requests').value),
            enable_caching: document.getElementById('enable-caching').checked,
            daily_cost_limit: parseFloat(document.getElementById('daily-cost-limit').value),
            daily_request_limit: parseInt(document.getElementById('daily-request-limit').value),
            privacy_mode: document.getElementById('privacy-mode').checked,
            custom_prompts: document.getElementById('custom-prompts').value.trim(),
            developer_mode: document.getElementById('developer-mode').checked
        };
        
        await chrome.storage.local.set(settings);
        showMessage('设置已保存', 'success');
        
        // 通知background script重新加载配置
        chrome.runtime.sendMessage({ action: 'RELOAD_CONFIG' });
        
    } catch (error) {
        console.error('Failed to save settings:', error);
        showMessage('保存设置失败', 'error');
    }
}

// 重置设置
async function resetSettings() {
    if (!confirm('确定要重置所有设置为默认值吗？')) {
        return;
    }
    
    try {
        const defaultSettings = {
            anthropic_api_key: '',
            kimi_api_key: '',
            openai_api_key: '',
            news_api_key: '',
            default_model: 'kimi',
            max_concurrent_requests: 3,
            enable_caching: true,
            daily_cost_limit: 10.00,
            daily_request_limit: 1000,
            privacy_mode: false,
            custom_prompts: '',
            developer_mode: false
        };
        
        await chrome.storage.local.set(defaultSettings);
        await loadSettings();
        showMessage('设置已重置为默认值', 'success');
        
    } catch (error) {
        console.error('Failed to reset settings:', error);
        showMessage('重置设置失败', 'error');
    }
}

// 测试API连接
async function testConnection() {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '测试中...';
    button.disabled = true;
    
    try {
        const anthropicKey = document.getElementById('anthropic-key').value.trim();
        const kimiKey = document.getElementById('kimi-key').value.trim();
        const openaiKey = document.getElementById('openai-key').value.trim();
        
        if (!anthropicKey && !kimiKey && !openaiKey) {
            throw new Error('请至少配置一个API Key');
        }
        
        // 测试Anthropic API
        if (anthropicKey) {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': anthropicKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hello' }]
                })
            });
            
            if (!response.ok) {
                throw new Error(`Anthropic API 测试失败: ${response.status}`);
            }
        }
        
        // 测试Kimi API
        if (kimiKey) {
            const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${kimiKey}`
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 5
                })
            });
            
            if (!response.ok) {
                throw new Error(`Kimi API 测试失败: ${response.status}`);
            }
        }
        
        // 测试OpenAI API
        if (openaiKey) {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 5
                })
            });
            
            if (!response.ok) {
                throw new Error(`OpenAI API 测试失败: ${response.status}`);
            }
        }
        
        showMessage('API连接测试成功！', 'success');
        
    } catch (error) {
        console.error('API test failed:', error);
        showMessage(`连接测试失败: ${error.message}`, 'error');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// 加载统计信息
async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'GET_STATS' });
        
        if (response.status === 'SUCCESS') {
            const stats = response.data;
            
            // 更新统计卡片
            if (stats.database) {
                const today = new Date().toDateString();
                const todayStats = stats.database.dailyBreakdown[today] || { cost: 0, requests: 0 };
                
                document.getElementById('today-cost').textContent = `$${todayStats.cost.toFixed(4)}`;
                document.getElementById('today-requests').textContent = todayStats.requests.toString();
                document.getElementById('month-cost').textContent = `$${stats.database.totalCost.toFixed(4)}`;
            }
            
            if (stats.aiManager) {
                document.getElementById('cache-hit-rate').textContent = 
                    `${(stats.aiManager.cacheHitRate * 100).toFixed(1)}%`;
            }
        }
        
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// 导出数据
async function exportData() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'EXPORT_DATA' });
        
        if (response.status === 'SUCCESS') {
            const data = JSON.stringify(response.data, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `career-assistant-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage('数据导出成功', 'success');
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Export failed:', error);
        showMessage('数据导出失败', 'error');
    }
}

// 清空缓存
async function clearCache() {
    if (!confirm('确定要清空所有缓存数据吗？这将删除已缓存的分析结果。')) {
        return;
    }
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'CLEAR_CACHE' });
        
        if (response.status === 'SUCCESS') {
            showMessage('缓存已清空', 'success');
            await loadStats(); // 刷新统计信息
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Clear cache failed:', error);
        showMessage('清空缓存失败', 'error');
    }
}

// 清空所有数据
async function clearAllData() {
    const confirmation = prompt(
        '这将删除所有历史记录、缓存和分析结果！\n' +
        '此操作不可恢复。\n' +
        '如果确定要继续，请输入 "DELETE ALL":'
    );
    
    if (confirmation !== 'DELETE ALL') {
        return;
    }
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'CLEAR_ALL_DATA' });
        
        if (response.status === 'SUCCESS') {
            showMessage('所有数据已清空', 'success');
            await loadStats(); // 刷新统计信息
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Clear all data failed:', error);
        showMessage('清空数据失败', 'error');
    }
}

// 显示消息
function showMessage(message, type) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = message;
    messageDiv.className = `status-message status-${type}`;
    messageDiv.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// 处理表单变化
document.addEventListener('change', (event) => {
    // 自动保存某些设置
    if (event.target.id === 'privacy-mode' || event.target.id === 'enable-caching') {
        saveSettings();
    }
});

// 处理键盘快捷键
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                saveSettings();
                break;
            case 'r':
                event.preventDefault();
                resetSettings();
                break;
        }
    }
});

// 添加工具提示
document.querySelectorAll('[title]').forEach(element => {
    element.addEventListener('mouseenter', (event) => {
        // 可以在这里添加自定义工具提示逻辑
    });
});

// 验证输入
document.getElementById('daily-cost-limit').addEventListener('input', (event) => {
    const value = parseFloat(event.target.value);
    if (value < 0) {
        event.target.value = 0;
    } else if (value > 1000) {
        event.target.value = 1000;
        showMessage('每日成本限制不能超过$1000', 'error');
    }
});

document.getElementById('daily-request-limit').addEventListener('input', (event) => {
    const value = parseInt(event.target.value);
    if (value < 1) {
        event.target.value = 1;
    } else if (value > 10000) {
        event.target.value = 10000;
        showMessage('每日请求限制不能超过10000', 'error');
    }
});

// API Key 输入验证
document.getElementById('anthropic-key').addEventListener('input', (event) => {
    const value = event.target.value;
    if (value && !value.startsWith('sk-ant-')) {
        showMessage('Anthropic API Key 应该以 "sk-ant-" 开头', 'error');
    }
});

document.getElementById('openai-key').addEventListener('input', (event) => {
    const value = event.target.value;
    if (value && !value.startsWith('sk-')) {
        showMessage('OpenAI API Key 应该以 "sk-" 开头', 'error');
    }
});

// 一键配置测试环境
async function setupTestEnvironment() {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = '配置中...';
    button.disabled = true;
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'SETUP_TEST_ENV' });
        
        if (response.status === 'SUCCESS') {
            showMessage('🎉 测试环境配置成功！Kimi API已就绪，可以开始测试LinkedIn分析功能。', 'success');
            
            // 自动刷新设置显示
            setTimeout(() => {
                loadSettings();
            }, 1000);
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Setup test environment failed:', error);
        showMessage('配置失败: ' + error.message, 'error');
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// 开发者模式切换
document.getElementById('developer-mode').addEventListener('change', (event) => {
    if (event.target.checked) {
        console.log('Developer mode enabled');
        // 可以在这里添加开发者模式的特殊功能
    }
});
