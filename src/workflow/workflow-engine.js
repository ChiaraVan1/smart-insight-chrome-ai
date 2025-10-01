// workflow-engine.js - 工作流编排引擎
// 基于有向无环图(DAG)的节点执行系统

class WorkflowEngine {
    constructor() {
        this.workflows = new Map();
        this.nodeTypes = new Map();
        this.executionHistory = [];
        this.registerBuiltinNodeTypes();
    }

    // 注册内置节点类型
    registerBuiltinNodeTypes() {
        this.registerNodeType('transform', TransformNode);
        this.registerNodeType('llm', LLMNode);
        this.registerNodeType('decision', DecisionNode);
        this.registerNodeType('parallel', ParallelNode);
        this.registerNodeType('api_call', APICallNode);
    }

    // 注册节点类型
    registerNodeType(type, nodeClass) {
        this.nodeTypes.set(type, nodeClass);
    }

    // 创建工作流
    createWorkflow(name, dagDefinition) {
        const workflow = new Workflow(name, dagDefinition, this);
        this.workflows.set(name, workflow);
        return workflow;
    }

    // 获取工作流
    getWorkflow(name) {
        return this.workflows.get(name);
    }

    // 执行工作流
    async executeWorkflow(workflowName, input, context = {}) {
        const workflow = this.getWorkflow(workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${workflowName}' not found`);
        }

        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            workflowName,
            startTime: Date.now(),
            input,
            context,
            status: 'running',
            results: {},
            errors: []
        };

        this.executionHistory.push(execution);

        try {
            const result = await workflow.execute(input, context);
            execution.status = 'completed';
            execution.endTime = Date.now();
            execution.results = result;
            return result;
        } catch (error) {
            execution.status = 'failed';
            execution.endTime = Date.now();
            execution.errors.push(error.message);
            throw error;
        }
    }

    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 工作流类
class Workflow {
    constructor(name, dagDefinition, engine) {
        this.name = name;
        this.engine = engine;
        this.nodes = new Map();
        this.edges = [];
        this.startNodes = [];
        this.endNodes = [];
        
        this.buildFromDefinition(dagDefinition);
        this.validateDAG();
    }

    // 从定义构建工作流
    buildFromDefinition(definition) {
        // 创建节点
        definition.nodes.forEach(nodeConfig => {
            const NodeClass = this.engine.nodeTypes.get(nodeConfig.type);
            if (!NodeClass) {
                throw new Error(`Unknown node type: ${nodeConfig.type}`);
            }
            
            const node = new NodeClass(nodeConfig.id, nodeConfig.config || {});
            this.nodes.set(nodeConfig.id, node);
            
            if (nodeConfig.isStart) {
                this.startNodes.push(nodeConfig.id);
            }
            if (nodeConfig.isEnd) {
                this.endNodes.push(nodeConfig.id);
            }
        });

        // 创建边
        definition.edges.forEach(edge => {
            this.edges.push({
                from: edge.from,
                to: edge.to,
                condition: edge.condition || null
            });
        });
    }

    // 验证DAG
    validateDAG() {
        // 检查循环依赖
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (nodeId) => {
            if (recursionStack.has(nodeId)) return true;
            if (visited.has(nodeId)) return false;

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const outgoingEdges = this.edges.filter(edge => edge.from === nodeId);
            for (const edge of outgoingEdges) {
                if (hasCycle(edge.to)) return true;
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const nodeId of this.nodes.keys()) {
            if (hasCycle(nodeId)) {
                throw new Error('Workflow contains cycles');
            }
        }

        // 检查起始和结束节点
        if (this.startNodes.length === 0) {
            throw new Error('Workflow must have at least one start node');
        }
        if (this.endNodes.length === 0) {
            throw new Error('Workflow must have at least one end node');
        }
    }

    // 执行工作流
    async execute(input, context) {
        const executionContext = {
            ...context,
            results: new Map(),
            errors: new Map()
        };

        // 拓扑排序
        const sortedNodes = this.topologicalSort();
        
        // 执行节点
        for (const nodeId of sortedNodes) {
            const node = this.nodes.get(nodeId);
            
            try {
                // 获取输入数据
                const nodeInput = this.getNodeInput(nodeId, input, executionContext);
                
                // 执行节点
                const result = await node.execute(nodeInput, executionContext);
                
                // 存储结果
                executionContext.results.set(nodeId, result);
                
            } catch (error) {
                executionContext.errors.set(nodeId, error);
                
                // 根据节点配置决定是否继续执行
                if (node.config.stopOnError !== false) {
                    throw new Error(`Node ${nodeId} failed: ${error.message}`);
                }
            }
        }

        // 收集最终结果
        const finalResults = {};
        this.endNodes.forEach(nodeId => {
            finalResults[nodeId] = executionContext.results.get(nodeId);
        });

        return finalResults;
    }

    // 拓扑排序
    topologicalSort() {
        const inDegree = new Map();
        const adjList = new Map();

        // 初始化
        for (const nodeId of this.nodes.keys()) {
            inDegree.set(nodeId, 0);
            adjList.set(nodeId, []);
        }

        // 构建邻接表和入度
        this.edges.forEach(edge => {
            adjList.get(edge.from).push(edge.to);
            inDegree.set(edge.to, inDegree.get(edge.to) + 1);
        });

        // Kahn算法
        const queue = [];
        const result = [];

        // 找到所有入度为0的节点
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }

        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current);

            // 减少相邻节点的入度
            for (const neighbor of adjList.get(current)) {
                inDegree.set(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            }
        }

        if (result.length !== this.nodes.size) {
            throw new Error('Workflow contains cycles');
        }

        return result;
    }

    // 获取节点输入
    getNodeInput(nodeId, initialInput, executionContext) {
        const incomingEdges = this.edges.filter(edge => edge.to === nodeId);
        
        if (incomingEdges.length === 0) {
            // 起始节点，使用初始输入
            return initialInput;
        }

        // 合并来自前置节点的输出
        const nodeInput = {};
        incomingEdges.forEach(edge => {
            const sourceResult = executionContext.results.get(edge.from);
            if (sourceResult !== undefined) {
                Object.assign(nodeInput, sourceResult);
            }
        });

        return nodeInput;
    }
}

// 基础节点类
class BaseNode {
    constructor(id, config = {}) {
        this.id = id;
        this.config = config;
    }

    async execute(input, context) {
        throw new Error('execute method must be implemented');
    }
}

// Transform节点 - 纯数据转换
class TransformNode extends BaseNode {
    async execute(input, context) {
        const { transformFunction } = this.config;
        
        if (typeof transformFunction === 'function') {
            return transformFunction(input, context);
        }
        
        if (typeof transformFunction === 'string') {
            // 支持预定义的转换函数
            return this.executeBuiltinTransform(transformFunction, input, context);
        }
        
        throw new Error('Transform function not specified');
    }

    executeBuiltinTransform(functionName, input, context) {
        const transforms = {
            // 数据清洗
            'clean_data': (data) => {
                if (typeof data === 'string') {
                    return data.replace(/<[^>]*>/g, '') // 移除HTML标签
                              .replace(/\s+/g, ' ')      // 统一空白字符
                              .trim();
                }
                return data;
            },
            
            // 时间格式统一
            'normalize_dates': (data) => {
                if (data.experiences) {
                    data.experiences.forEach(exp => {
                        if (exp.duration) {
                            const normalized = this.normalizeDateString(exp.duration);
                            exp.date_start = normalized.start;
                            exp.date_end = normalized.end;
                        }
                    });
                }
                return data;
            },
            
            // 信息排序
            'sort_by_relevance': (data) => {
                if (data.experiences) {
                    data.experiences.sort((a, b) => {
                        // 按时间倒序排列
                        const aDate = new Date(a.date_end || '9999-12-31');
                        const bDate = new Date(b.date_end || '9999-12-31');
                        return bDate - aDate;
                    });
                }
                return data;
            }
        };

        const transform = transforms[functionName];
        if (!transform) {
            throw new Error(`Unknown transform function: ${functionName}`);
        }

        return transform(input);
    }

    normalizeDateString(dateStr) {
        // 简化的日期解析逻辑
        const patterns = [
            /(\w+)\s+(\d{4})\s*-\s*(\w+)\s+(\d{4})/,
            /(\w+)\s+(\d{4})\s*-\s*Present/i,
            /(\d{4})\s*-\s*(\d{4})/,
            /(\d{4})\s*-\s*Present/i
        ];

        for (const pattern of patterns) {
            const match = dateStr.match(pattern);
            if (match) {
                const start = match[2] || match[1];
                const end = match[4] || match[3] || (match[3]?.toLowerCase() === 'present' ? null : match[2]);
                
                return {
                    start: start ? `${start}-01-01` : null,
                    end: end ? `${end}-12-31` : null
                };
            }
        }

        return { start: null, end: null };
    }
}

// LLM节点 - 调用大模型
class LLMNode extends BaseNode {
    async execute(input, context) {
        const { prompt, model, temperature, maxTokens } = this.config;
        
        if (!prompt) {
            throw new Error('LLM node requires prompt configuration');
        }

        // 构建完整的prompt
        const fullPrompt = this.buildPrompt(prompt, input, context);
        
        // 调用AI服务
        const aiManager = context.aiManager;
        if (!aiManager) {
            throw new Error('AI Manager not available in context');
        }

        const response = await aiManager.callLLM({
            prompt: fullPrompt,
            model: model || 'claude-sonnet',
            temperature: temperature || 0.3,
            maxTokens: maxTokens || 1000
        });

        return this.parseResponse(response);
    }

    buildPrompt(promptTemplate, input, context) {
        // 简单的模板替换
        let prompt = promptTemplate;
        
        // 替换输入变量
        Object.entries(input).forEach(([key, value]) => {
            const placeholder = `{{${key}}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), JSON.stringify(value));
        });

        return prompt;
    }

    parseResponse(response) {
        // 尝试解析JSON响应
        try {
            return JSON.parse(response);
        } catch (error) {
            // 如果不是JSON，返回原始文本
            return { content: response };
        }
    }
}

// Decision节点 - 条件分支
class DecisionNode extends BaseNode {
    async execute(input, context) {
        const { condition, trueOutput, falseOutput } = this.config;
        
        const result = this.evaluateCondition(condition, input, context);
        
        return result ? trueOutput : falseOutput;
    }

    evaluateCondition(condition, input, context) {
        if (typeof condition === 'function') {
            return condition(input, context);
        }
        
        if (typeof condition === 'string') {
            // 简单的条件表达式解析
            return this.parseConditionString(condition, input);
        }
        
        return Boolean(condition);
    }

    parseConditionString(conditionStr, input) {
        // 支持简单的条件表达式，如 "input.score > 0.5"
        try {
            const func = new Function('input', `return ${conditionStr}`);
            return func(input);
        } catch (error) {
            console.warn('Failed to parse condition:', conditionStr, error);
            return false;
        }
    }
}

// Parallel节点 - 并行执行
class ParallelNode extends BaseNode {
    async execute(input, context) {
        const { subNodes } = this.config;
        
        if (!Array.isArray(subNodes)) {
            throw new Error('Parallel node requires subNodes configuration');
        }

        // 并行执行所有子节点
        const promises = subNodes.map(async (subNodeConfig) => {
            const NodeClass = context.engine.nodeTypes.get(subNodeConfig.type);
            if (!NodeClass) {
                throw new Error(`Unknown node type: ${subNodeConfig.type}`);
            }
            
            const subNode = new NodeClass(subNodeConfig.id, subNodeConfig.config);
            return {
                id: subNodeConfig.id,
                result: await subNode.execute(input, context)
            };
        });

        const results = await Promise.allSettled(promises);
        
        // 整理结果
        const output = {};
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                output[result.value.id] = result.value.result;
            } else {
                output[subNodes[index].id] = { error: result.reason.message };
            }
        });

        return output;
    }
}

// API调用节点
class APICallNode extends BaseNode {
    async execute(input, context) {
        const { url, method, headers, body } = this.config;
        
        const requestOptions = {
            method: method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body && method !== 'GET') {
            requestOptions.body = JSON.stringify(this.buildRequestBody(body, input));
        }

        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    buildRequestBody(bodyTemplate, input) {
        if (typeof bodyTemplate === 'function') {
            return bodyTemplate(input);
        }
        
        // 简单的模板替换
        let body = JSON.stringify(bodyTemplate);
        Object.entries(input).forEach(([key, value]) => {
            const placeholder = `"{{${key}}}"`;
            body = body.replace(new RegExp(placeholder, 'g'), JSON.stringify(value));
        });
        
        return JSON.parse(body);
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.WorkflowEngine = WorkflowEngine;
    window.Workflow = Workflow;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WorkflowEngine,
        Workflow,
        BaseNode,
        TransformNode,
        LLMNode,
        DecisionNode,
        ParallelNode,
        APICallNode
    };
}
