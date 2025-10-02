// test-chrome-ai.js - Chrome AI 功能测试脚本
// 用于验证 Chrome Built-in AI 集成是否正常工作

class ChromeAITester {
    constructor() {
        this.testResults = [];
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🚀 开始 Chrome AI 功能测试...');
        
        const tests = [
            { name: 'Chrome AI 可用性检查', test: this.testChromeAIAvailability },
            { name: 'Prompt API 测试', test: this.testPromptAPI },
            { name: 'Summarization API 测试', test: this.testSummarizationAPI },
            { name: '个人资料分析测试', test: this.testProfileAnalysis },
            { name: '公司分析测试', test: this.testCompanyAnalysis },
            { name: '性能基准测试', test: this.testPerformance }
        ];

        for (const { name, test } of tests) {
            try {
                console.log(`\n📋 执行测试: ${name}`);
                const result = await test.call(this);
                this.testResults.push({ name, status: 'PASS', result });
                console.log(`✅ ${name}: 通过`);
            } catch (error) {
                this.testResults.push({ name, status: 'FAIL', error: error.message });
                console.error(`❌ ${name}: 失败 - ${error.message}`);
            }
        }

        this.printTestSummary();
    }

    // 测试 Chrome AI 可用性
    async testChromeAIAvailability() {
        if (!window.ai) {
            throw new Error('Chrome AI 不可用。请确保使用 Chrome 127+ 并启用相关功能。');
        }

        const capabilities = {};
        
        // 检查 Prompt API
        if (window.ai.canCreateTextSession) {
            capabilities.prompt = await window.ai.canCreateTextSession();
        }

        // 检查 Summarization API
        if (window.ai.summarizer) {
            capabilities.summarizer = await window.ai.summarizer.capabilities();
        }

        // 检查 Translation API
        if (window.ai.translator) {
            capabilities.translator = await window.ai.translator.capabilities();
        }

        return {
            available: true,
            capabilities
        };
    }

    // 测试 Prompt API
    async testPromptAPI() {
        if (!window.ai || !window.ai.canCreateTextSession) {
            throw new Error('Prompt API 不可用');
        }

        const capability = await window.ai.canCreateTextSession();
        if (capability !== 'readily') {
            throw new Error(`Prompt API 状态: ${capability}，需要 'readily' 状态`);
        }

        const session = await window.ai.createTextSession({
            temperature: 0.8,
            topK: 3
        });

        const testPrompt = '请用一句话介绍你自己。';
        const response = await session.prompt(testPrompt);
        
        await session.destroy();

        if (!response || response.length < 10) {
            throw new Error('Prompt API 响应异常');
        }

        return {
            capability,
            responseLength: response.length,
            response: response.substring(0, 100) + '...'
        };
    }

    // 测试 Summarization API
    async testSummarizationAPI() {
        if (!window.ai || !window.ai.summarizer) {
            throw new Error('Summarization API 不可用');
        }

        const capabilities = await window.ai.summarizer.capabilities();
        if (capabilities.available !== 'readily') {
            throw new Error(`Summarization API 状态: ${capabilities.available}`);
        }

        const summarizer = await window.ai.summarizer.create({
            type: 'key-points',
            format: 'markdown',
            length: 'medium'
        });

        const testText = `
        SmartInsight Career Assistant 是一个基于 Chrome Built-in AI 的求职助手扩展。
        它可以分析 LinkedIn 个人资料，提供破冰开场白和深度问题建议。
        该工具完全在本地处理数据，保护用户隐私，无需任何 API 密钥。
        支持离线使用，响应速度快，完全免费。
        `;

        const summary = await summarizer.summarize(testText);
        await summarizer.destroy();

        return {
            capabilities,
            summaryLength: summary.length,
            summary: summary.substring(0, 100) + '...'
        };
    }

    // 测试个人资料分析
    async testProfileAnalysis() {
        const mockProfileData = {
            basic_info: {
                name: 'Test User',
                headline: 'Software Engineer at Tech Company'
            },
            current_position: {
                company: 'Tech Company'
            },
            experiences: [
                {
                    title: 'Software Engineer',
                    company: 'Tech Company',
                    duration: '2023-Present'
                }
            ],
            education: [
                {
                    school: 'University',
                    degree: 'Computer Science',
                    field: 'Bachelor'
                }
            ],
            metadata: {
                profile_url: 'https://linkedin.com/in/testuser'
            }
        };

        // 模拟发送到 background script
        const response = await chrome.runtime.sendMessage({
            action: 'ANALYZE_PROFILE',
            data: mockProfileData
        });

        if (response.status !== 'SUCCESS') {
            throw new Error(`个人资料分析失败: ${response.message}`);
        }

        return {
            hasFlashcard: !!response.data.flashcard,
            hasIcebreaker: !!response.data.icebreaker,
            hasQuestions: !!response.data.questions,
            processingTime: response.data.metadata?.processing_time || 0
        };
    }

    // 测试公司分析
    async testCompanyAnalysis() {
        const mockCompanyData = {
            companyName: 'Test Company',
            companyUrl: 'https://testcompany.com',
            targetPosition: 'Software Engineer'
        };

        const response = await chrome.runtime.sendMessage({
            action: 'ANALYZE_COMPANY',
            data: mockCompanyData
        });

        if (response.status !== 'SUCCESS') {
            throw new Error(`公司分析失败: ${response.message}`);
        }

        return {
            hasPositioning: !!response.data.positioning,
            hasInterviewTips: !!response.data.interviewTips,
            processingTime: response.data.metadata?.processing_time || 0
        };
    }

    // 性能基准测试
    async testPerformance() {
        const iterations = 3;
        const times = [];

        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            
            await this.testPromptAPI();
            
            const endTime = performance.now();
            times.push(endTime - startTime);
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        return {
            iterations,
            averageTime: Math.round(avgTime),
            minTime: Math.round(minTime),
            maxTime: Math.round(maxTime),
            allTimes: times.map(t => Math.round(t))
        };
    }

    // 打印测试摘要
    printTestSummary() {
        console.log('\n📊 Chrome AI 测试摘要');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`✅ 通过: ${passed}`);
        console.log(`❌ 失败: ${failed}`);
        console.log(`📋 总计: ${this.testResults.length}`);
        
        if (failed === 0) {
            console.log('\n🎉 所有测试通过！Chrome AI 集成正常工作。');
        } else {
            console.log('\n⚠️ 部分测试失败，请检查 Chrome AI 设置。');
        }

        // 详细结果
        console.log('\n📋 详细结果:');
        this.testResults.forEach(({ name, status, result, error }) => {
            console.log(`${status === 'PASS' ? '✅' : '❌'} ${name}`);
            if (result) {
                console.log('   结果:', result);
            }
            if (error) {
                console.log('   错误:', error);
            }
        });
    }

    // 生成测试报告
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.length,
                passed: this.testResults.filter(r => r.status === 'PASS').length,
                failed: this.testResults.filter(r => r.status === 'FAIL').length
            },
            results: this.testResults
        };

        return report;
    }
}

// 使用方法
async function runChromeAITests() {
    const tester = new ChromeAITester();
    await tester.runAllTests();
    return tester.generateReport();
}

// 如果在浏览器控制台中运行
if (typeof window !== 'undefined') {
    window.runChromeAITests = runChromeAITests;
    console.log('🧪 Chrome AI 测试工具已加载');
    console.log('💡 运行 runChromeAITests() 开始测试');
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChromeAITester, runChromeAITests };
}
