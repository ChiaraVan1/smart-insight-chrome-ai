// ai-manager.js - AI调用管理器
// 支持请求队列、Token优化、成本监控和错误处理

class AIManager {
    constructor() {
        this.requestQueue = new PriorityQueue();
        this.activeRequests = new Map();
        this.maxConcurrentRequests = 3;
        this.currentRequests = 0;
        
        // 缓存系统
        this.cache = new Map();
        this.cacheExpiry = 24 * 60 * 60 * 1000; // 24小时
        
        // 成本追踪
        this.costTracker = new CostTracker();
        
        // 错误重试配置
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 8000,
            backoffFactor: 2
        };
        
        // 支持的模型配置
        this.models = {
            'claude-sonnet': {
                provider: 'anthropic',
                model: 'claude-3-sonnet-20240229',
                inputCostPer1K: 0.003,
                outputCostPer1K: 0.015,
                maxTokens: 200000,
                contextWindow: 200000
            },
            'claude-haiku': {
                provider: 'anthropic',
                model: 'claude-3-haiku-20240307',
                inputCostPer1K: 0.00025,
                outputCostPer1K: 0.00125,
                maxTokens: 200000,
                contextWindow: 200000
            },
            'gpt-4': {
                provider: 'openai',
                model: 'gpt-4-turbo-preview',
                inputCostPer1K: 0.01,
                outputCostPer1K: 0.03,
                maxTokens: 128000,
                contextWindow: 128000
            },
            'kimi': {
                provider: 'kimi',
                model: 'moonshot-v1-8k',
                inputCostPer1K: 0.012,
                outputCostPer1K: 0.012,
                maxTokens: 8000,
                contextWindow: 8000
            },
            'kimi-32k': {
                provider: 'kimi',
                model: 'moonshot-v1-32k',
                inputCostPer1K: 0.024,
                outputCostPer1K: 0.024,
                maxTokens: 32000,
                contextWindow: 32000
            },
            'kimi-128k': {
                provider: 'kimi',
                model: 'moonshot-v1-128k',
                inputCostPer1K: 0.06,
                outputCostPer1K: 0.06,
                maxTokens: 128000,
                contextWindow: 128000
            }
        };
        
        this.init();
    }

    async init() {
        // 从存储中加载API密钥和配置
        await this.loadConfiguration();
        
        // 启动请求处理循环
        this.startRequestProcessor();
        
        // 定期清理缓存
        setInterval(() => this.cleanupCache(), 60 * 60 * 1000); // 每小时清理一次
    }

    async loadConfiguration() {
        try {
            // 从Chrome storage加载配置
            const config = await chrome.storage.local.get([
                'anthropic_api_key',
                'openai_api_key',
                'kimi_api_key',
                'default_model',
                'max_concurrent_requests',
                'enable_caching'
            ]);
            
            this.apiKeys = {
                anthropic: config.anthropic_api_key,
                openai: config.openai_api_key,
                kimi: config.kimi_api_key
            };
            
            this.defaultModel = config.default_model || 'kimi';
            this.maxConcurrentRequests = config.max_concurrent_requests || 3;
            this.enableCaching = config.enable_caching !== false;
            
        } catch (error) {
            console.error('Failed to load AI configuration:', error);
        }
    }

    // 主要的LLM调用接口
    async callLLM(options) {
        const {
            prompt,
            model = this.defaultModel,
            temperature = 0.3,
            maxTokens = 1000,
            priority = 'normal',
            useCache = true,
            metadata = {}
        } = options;

        // 验证API密钥
        const modelConfig = this.models[model];
        if (!modelConfig) {
            throw new Error(`Unsupported model: ${model}`);
        }

        const apiKey = this.apiKeys[modelConfig.provider];
        if (!apiKey) {
            throw new Error(`API key not configured for ${modelConfig.provider}`);
        }

        // 生成请求ID和缓存键
        const requestId = this.generateRequestId();
        const cacheKey = this.generateCacheKey(prompt, model, temperature, maxTokens);

        // 检查缓存
        if (useCache && this.enableCaching) {
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                console.log('Cache hit for request:', requestId);
                return cachedResult;
            }
        }

        // Token预估和验证
        const estimatedTokens = this.estimateTokens(prompt);
        if (estimatedTokens > modelConfig.contextWindow * 0.8) {
            throw new Error(`Prompt too long: ${estimatedTokens} tokens (max: ${modelConfig.contextWindow})`);
        }

        // 创建请求对象
        const request = {
            id: requestId,
            prompt,
            model,
            temperature,
            maxTokens,
            priority: this.getPriorityValue(priority),
            cacheKey,
            useCache,
            metadata,
            createdAt: Date.now(),
            retryCount: 0
        };

        // 添加到队列
        return new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
            this.requestQueue.enqueue(request);
        });
    }

    // 请求处理器
    startRequestProcessor() {
        setInterval(async () => {
            if (this.currentRequests >= this.maxConcurrentRequests) {
                return;
            }

            if (this.requestQueue.isEmpty()) {
                return;
            }

            const request = this.requestQueue.dequeue();
            this.processRequest(request);
        }, 100);
    }

    async processRequest(request) {
        this.currentRequests++;
        this.activeRequests.set(request.id, request);

        try {
            const result = await this.executeRequest(request);
            
            // 缓存结果
            if (request.useCache && this.enableCaching) {
                this.setCache(request.cacheKey, result);
            }
            
            // 记录成本
            await this.recordCost(request, result);
            
            request.resolve(result);
            
        } catch (error) {
            // 错误处理和重试
            if (this.shouldRetry(error, request)) {
                await this.retryRequest(request, error);
            } else {
                request.reject(error);
            }
        } finally {
            this.currentRequests--;
            this.activeRequests.delete(request.id);
        }
    }

    async executeRequest(request) {
        const modelConfig = this.models[request.model];
        const apiKey = this.apiKeys[modelConfig.provider];

        if (modelConfig.provider === 'anthropic') {
            return await this.callAnthropic(request, modelConfig, apiKey);
        } else if (modelConfig.provider === 'openai') {
            return await this.callOpenAI(request, modelConfig, apiKey);
        } else if (modelConfig.provider === 'kimi') {
            return await this.callKimi(request, modelConfig, apiKey);
        } else {
            throw new Error(`Unsupported provider: ${modelConfig.provider}`);
        }
    }

    async callAnthropic(request, modelConfig, apiKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: modelConfig.model,
                max_tokens: request.maxTokens,
                temperature: request.temperature,
                messages: [
                    {
                        role: 'user',
                        content: request.prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.content[0].text,
            usage: {
                input_tokens: data.usage.input_tokens,
                output_tokens: data.usage.output_tokens,
                total_tokens: data.usage.input_tokens + data.usage.output_tokens
            },
            model: request.model,
            timestamp: Date.now()
        };
    }

    async callOpenAI(request, modelConfig, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelConfig.model,
                messages: [
                    {
                        role: 'user',
                        content: request.prompt
                    }
                ],
                max_tokens: request.maxTokens,
                temperature: request.temperature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.choices[0].message.content,
            usage: {
                input_tokens: data.usage.prompt_tokens,
                output_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens
            },
            model: request.model,
            timestamp: Date.now()
        };
    }

    async callKimi(request, modelConfig, apiKey) {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelConfig.model,
                messages: [
                    {
                        role: 'user',
                        content: request.prompt
                    }
                ],
                max_tokens: request.maxTokens,
                temperature: request.temperature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Kimi API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        return {
            content: data.choices[0].message.content,
            usage: {
                input_tokens: data.usage.prompt_tokens,
                output_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens
            },
            model: request.model,
            timestamp: Date.now()
        };
    }

    // 错误处理和重试
    shouldRetry(error, request) {
        if (request.retryCount >= this.retryConfig.maxRetries) {
            return false;
        }

        // 可重试的错误类型
        const retryableErrors = [
            'rate_limit_exceeded',
            'server_error',
            'timeout',
            'network_error'
        ];

        const errorMessage = error.message.toLowerCase();
        return retryableErrors.some(retryableError => 
            errorMessage.includes(retryableError) || 
            errorMessage.includes('429') || 
            errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503')
        );
    }

    async retryRequest(request, lastError) {
        request.retryCount++;
        
        const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, request.retryCount - 1),
            this.retryConfig.maxDelay
        );

        console.log(`Retrying request ${request.id} (attempt ${request.retryCount}) after ${delay}ms`);
        
        setTimeout(() => {
            this.requestQueue.enqueue(request);
        }, delay);
    }

    // 缓存管理
    generateCacheKey(prompt, model, temperature, maxTokens) {
        const data = { prompt, model, temperature, maxTokens };
        const str = JSON.stringify(data);
        
        // 简单的hash函数
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return `cache_${Math.abs(hash)}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    cleanupCache() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
        console.log(`Cache cleanup completed. Current size: ${this.cache.size}`);
    }

    // Token估算
    estimateTokens(text) {
        // 简单的token估算：平均4个字符 ≈ 1个token
        return Math.ceil(text.length / 4);
    }

    // 成本记录
    async recordCost(request, result) {
        const modelConfig = this.models[request.model];
        const inputCost = (result.usage.input_tokens / 1000) * modelConfig.inputCostPer1K;
        const outputCost = (result.usage.output_tokens / 1000) * modelConfig.outputCostPer1K;
        const totalCost = inputCost + outputCost;

        await this.costTracker.addRecord({
            requestId: request.id,
            model: request.model,
            inputTokens: result.usage.input_tokens,
            outputTokens: result.usage.output_tokens,
            totalTokens: result.usage.total_tokens,
            cost: totalCost,
            timestamp: Date.now(),
            metadata: request.metadata
        });
    }

    // 优先级转换
    getPriorityValue(priority) {
        const priorities = {
            'high': 1,
            'normal': 2,
            'low': 3
        };
        return priorities[priority] || 2;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 获取统计信息
    async getStats() {
        const costSummary = await this.costTracker.getSummary();
        
        return {
            activeRequests: this.currentRequests,
            queueSize: this.requestQueue.size(),
            cacheSize: this.cache.size,
            cacheHitRate: this.calculateCacheHitRate(),
            costSummary,
            supportedModels: Object.keys(this.models)
        };
    }

    calculateCacheHitRate() {
        // 简化的缓存命中率计算
        return this.cache.size > 0 ? 0.75 : 0; // 示例值
    }

    // 清空缓存
    clearCache() {
        this.cache.clear();
        console.log('AI cache cleared');
    }

    // 取消请求
    cancelRequest(requestId) {
        const request = this.activeRequests.get(requestId);
        if (request) {
            request.reject(new Error('Request cancelled'));
            this.activeRequests.delete(requestId);
            return true;
        }
        return false;
    }
}

// 优先级队列实现
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (item.priority < this.items[i].priority) {
                this.items.splice(i, 0, item);
                added = true;
                break;
            }
        }
        if (!added) {
            this.items.push(item);
        }
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }
}

// 成本追踪器
class CostTracker {
    constructor() {
        this.records = [];
        this.dailyLimits = {
            cost: 10.0, // 每日成本限制：$10
            requests: 1000 // 每日请求限制：1000次
        };
    }

    async addRecord(record) {
        this.records.push(record);
        
        // 保存到数据库
        try {
            const { db } = await import('../storage/database.js');
            await db.addCostRecord(
                record.metadata.taskType || 'unknown',
                record.totalTokens,
                record.cost
            );
        } catch (error) {
            console.error('Failed to save cost record:', error);
        }
        
        // 检查限制
        await this.checkLimits();
    }

    async getSummary(days = 30) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentRecords = this.records.filter(r => r.timestamp > cutoff);
        
        const summary = {
            totalCost: 0,
            totalTokens: 0,
            totalRequests: recentRecords.length,
            averageCostPerRequest: 0,
            modelBreakdown: {},
            dailyBreakdown: {}
        };
        
        recentRecords.forEach(record => {
            summary.totalCost += record.cost;
            summary.totalTokens += record.totalTokens;
            
            // 按模型统计
            if (!summary.modelBreakdown[record.model]) {
                summary.modelBreakdown[record.model] = {
                    cost: 0,
                    tokens: 0,
                    requests: 0
                };
            }
            summary.modelBreakdown[record.model].cost += record.cost;
            summary.modelBreakdown[record.model].tokens += record.totalTokens;
            summary.modelBreakdown[record.model].requests += 1;
            
            // 按日期统计
            const date = new Date(record.timestamp).toDateString();
            if (!summary.dailyBreakdown[date]) {
                summary.dailyBreakdown[date] = { cost: 0, requests: 0 };
            }
            summary.dailyBreakdown[date].cost += record.cost;
            summary.dailyBreakdown[date].requests += 1;
        });
        
        summary.averageCostPerRequest = summary.totalRequests > 0 ? 
            summary.totalCost / summary.totalRequests : 0;
        
        return summary;
    }

    async checkLimits() {
        const today = new Date().toDateString();
        const todayRecords = this.records.filter(r => 
            new Date(r.timestamp).toDateString() === today
        );
        
        const todayCost = todayRecords.reduce((sum, r) => sum + r.cost, 0);
        const todayRequests = todayRecords.length;
        
        if (todayCost > this.dailyLimits.cost) {
            console.warn(`Daily cost limit exceeded: $${todayCost.toFixed(2)}`);
            // 可以发送通知或暂停服务
        }
        
        if (todayRequests > this.dailyLimits.requests) {
            console.warn(`Daily request limit exceeded: ${todayRequests}`);
        }
    }
}

// 单例导出
let aiManagerInstance = null;

export async function getAIManager() {
    if (!aiManagerInstance) {
        aiManagerInstance = new AIManager();
        await aiManagerInstance.init();
    }
    return aiManagerInstance;
}

export { AIManager };
