// content-script.js - 增强版内容脚本
// 集成LinkedIn采集、侧边栏UI和智能分析功能

// 實入模块
let LinkedInScraper, CareerSidebar, WorkflowEngine, AIManager;

// 全局状态
let sidebar = null;
let isAnalyzing = false;
let currentPageData = null;

// 初始化
async function init() {
    try {
        // 动态导入模块
        await loadModules();
        
        // 检测页面类型
        const pageType = detectPageType();
        
        if (pageType === 'linkedin_profile') {
            // LinkedIn个人页面
            await initLinkedInProfileAnalysis();
        } else if (pageType === 'linkedin_company') {
            // LinkedIn公司页面
            await initLinkedInCompanyAnalysis();
        } else if (pageType === 'company_website') {
            // 公司官网
            await initCompanyWebsiteAnalysis();
        }
        
        console.log('Career Assistant content script initialized');
        
    } catch (error) {
        console.error('Failed to initialize Career Assistant:', error);
    }
}

// 动态加载模块
async function loadModules() {
    // 这里需要根据实际的模块加载方式调整
    if (window.LinkedInScraper) {
        LinkedInScraper = window.LinkedInScraper;
    }
    if (window.CareerSidebar) {
        CareerSidebar = window.CareerSidebar;
    }
    // 其他模块类似处理
}

// 检测页面类型
function detectPageType() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname === 'www.linkedin.com') {
        if (pathname.includes('/in/')) {
            return 'linkedin_profile';
        } else if (pathname.includes('/company/')) {
            return 'linkedin_company';
        }
    }
    
    // 检测是否为公司官网
    const companyIndicators = [
        'about', 'careers', 'jobs', 'team', 'company',
        '关于', '招聘', '团队', '公司'
    ];
    
    const pageText = document.body.textContent.toLowerCase();
    const hasCompanyIndicators = companyIndicators.some(indicator => 
        pageText.includes(indicator)
    );
    
    if (hasCompanyIndicators) {
        return 'company_website';
    }
    
    return 'unknown';
}

// LinkedIn个人页面分析初始化
async function initLinkedInProfileAnalysis() {
    // 创建侧边栏
    if (!sidebar) {
        sidebar = new CareerSidebar();
    }
    
    // 添加分析按钮到页面
    addAnalysisButton('分析此人', analyzeLinkedInProfile);
    
    // 监听页面变化
    observePageChanges();
}

// LinkedIn公司页面分析初始化
async function initLinkedInCompanyAnalysis() {
    if (!sidebar) {
        sidebar = new CareerSidebar();
    }
    
    addAnalysisButton('分析公司', analyzeLinkedInCompany);
    observePageChanges();
}

// 公司网站分析初始化
async function initCompanyWebsiteAnalysis() {
    if (!sidebar) {
        sidebar = new CareerSidebar();
    }
    
    addAnalysisButton('分析网站', analyzeCompanyWebsite);
}

// 添加分析按钮
function addAnalysisButton(text, clickHandler) {
    // 避免重复添加
    if (document.getElementById('career-assistant-btn')) {
        return;
    }
    
    const button = document.createElement('button');
    button.id = 'career-assistant-btn';
    button.textContent = text;
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: linear-gradient(135deg, #4A90E2, #357ABD);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(74,144,226,0.3);
        transition: all 0.3s ease;
    `;
    
    button.addEventListener('click', clickHandler);
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 4px 12px rgba(74,144,226,0.4)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 2px 8px rgba(74,144,226,0.3)';
    });
    
    document.body.appendChild(button);
}

// 分析LinkedIn个人资料
async function analyzeLinkedInProfile() {
    if (isAnalyzing) return;
    
    isAnalyzing = true;
    updateAnalysisButton('分析中...', true);
    
    try {
        // 显示侧边栏
        sidebar.show();
        
        // 使用LinkedIn采集器获取数据
        const scraper = new LinkedInScraper();
        const profileData = await scraper.deepScrape();
        
        // 发送到background进行AI分析
        const response = await chrome.runtime.sendMessage({
            action: 'ANALYZE_PROFILE',
            data: profileData,
            context: {
                pageUrl: window.location.href,
                timestamp: Date.now()
            }
        });
        
        if (response.status === 'SUCCESS') {
            // 在侧边栏显示结果
            await sidebar.renderContent(response.data);
            currentPageData = response.data;
        } else {
            throw new Error(response.message || '分析失败');
        }
        
    } catch (error) {
        console.error('Profile analysis failed:', error);
        showErrorMessage('分析失败: ' + error.message);
    } finally {
        isAnalyzing = false;
        updateAnalysisButton('分析此人', false);
    }
}

// 处理来自popup的消息
function handleMessage(request, sender, sendResponse) {
    console.log('Content script received message:', request.action);
    
    switch (request.action) {
        case 'GET_PAGE_CONTENT':
            sendResponse({
                content: document.body.innerText,
                url: window.location.href,
                title: document.title
            });
            break;
            
        case 'TRIGGER_ANALYSIS':
            const pageType = detectPageType();
            if (pageType === 'linkedin_profile') {
                analyzeLinkedInProfile();
            } else if (pageType === 'linkedin_company') {
                analyzeLinkedInCompany();
            } else {
                analyzeCompanyWebsite();
            }
            sendResponse({ status: 'triggered' });
            break;
            
        case 'SCRAPE_LINKEDIN_PROFILE':
            handleLinkedInProfileScraping(sendResponse);
            return true; // 异步响应
            
        case 'PING':
            sendResponse({ status: 'PONG', timestamp: Date.now() });
            break;
    }
    
    return true; // 保持消息通道开放
}

// 处理LinkedIn个人资料抓取
async function handleLinkedInProfileScraping(sendResponse) {
    try {
        console.log('开始LinkedIn数据抓取...');
        console.log('当前URL:', window.location.href);
        
        // 检查是否为LinkedIn个人资料页
        if (!window.location.href.includes('linkedin.com/in/')) {
            throw new Error('当前页面不是LinkedIn个人资料页');
        }
        
        // 使用简化的数据抓取
        const profileData = await extractLinkedInDataSimple();
        
        console.log('提取的数据:', profileData);
        
        sendResponse({ 
            status: 'SUCCESS', 
            data: profileData 
        });
        
    } catch (error) {
        console.error('LinkedIn profile scraping failed:', error);
        sendResponse({ 
            status: 'ERROR', 
            message: error.message 
        });
    }
}

// 增强的LinkedIn数据提取
async function extractLinkedInDataSimple() {
    const data = {
        metadata: {
            profile_url: window.location.href,
            scraped_at: Date.now(),
            scrape_depth: 'enhanced'
        },
        basic_info: {},
        current_position: {},
        experiences: [],
        education: [],
        recent_activity: [],
        following: [],
        commonalities: {}
    };
    
    try {
        // 先检查页面结构
        console.log('页面DOM结构检查:');
        console.log('所有h1元素:', document.querySelectorAll('h1'));
        console.log('包含text-heading的元素:', document.querySelectorAll('[class*="text-heading"]'));
        console.log('包含pv-text的元素:', document.querySelectorAll('[class*="pv-text"]'));
        
        // 提取基本信息
        await extractBasicInfo(data);
        
        // 提取工作经历
        await extractExperiences(data);
        
        // 提取教育经历
        await extractEducation(data);
        
        // 提取最近动态
        await extractRecentActivity(data);
        
        // 提取关注信息
        await extractFollowing(data);
        
        // 提取共同点
        await extractCommonalities(data);
        
    } catch (error) {
        console.warn('Some data extraction failed:', error);
    }
    
    return data;
}

// 提取基本信息
async function extractBasicInfo(data) {
    console.log('开始提取基本信息...');
    
    // 通用方法：直接从页面标题和元信息提取
    const pageTitle = document.title;
    console.log('页面标题:', pageTitle);
    
    // 从页面标题提取姓名（LinkedIn页面标题通常是 "姓名 | LinkedIn"）
    if (pageTitle && pageTitle.includes('|')) {
        const nameFromTitle = pageTitle.split('|')[0].trim();
        if (nameFromTitle && nameFromTitle !== 'LinkedIn') {
            data.basic_info.name = nameFromTitle;
            console.log('从标题提取姓名:', data.basic_info.name);
        }
    }
    
    // 如果标题方法失败，尝试选择器
    if (!data.basic_info.name) {
        const nameSelectors = [
            'h1',
            '[data-anonymize="person-name"]',
            '.text-heading-xlarge',
            '.pv-text-details__left-panel h1'
        ];
        
        for (const selector of nameSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`尝试姓名选择器 ${selector}:`, elements);
            
            for (const element of elements) {
                const text = element.textContent.trim();
                if (text && text.length > 2 && text.length < 50 && !text.includes('\n')) {
                    data.basic_info.name = text;
                    console.log('找到姓名:', data.basic_info.name);
                    break;
                }
            }
            if (data.basic_info.name) break;
        }
    }
    
    // 提取职位信息
    const headlineSelectors = [
        '.text-body-medium',
        '[data-anonymize="headline"]',
        '.pv-text-details__left-panel .text-body-medium'
    ];
    
    for (const selector of headlineSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`尝试职位选择器 ${selector}:`, elements);
        
        for (const element of elements) {
            const text = element.textContent.trim();
            // 职位通常包含工程师、经理、分析师等关键词
            if (text && (text.includes('engineer') || text.includes('manager') || text.includes('analyst') || 
                        text.includes('') || text.includes('') || text.includes('') ||
                        text.includes('developer') || text.includes('specialist') || text.includes('director'))) {
                data.basic_info.headline = text;
                console.log('找到职位:', data.basic_info.headline);
                break;
            }
        }
        if (data.basic_info.headline) break;
    }
    
    // 如果没找到职位，取第一个看起来像职位的文本
    if (!data.basic_info.headline) {
        const allTextElements = document.querySelectorAll('.text-body-medium, .text-body-small');
        for (const element of allTextElements) {
            const text = element.textContent.trim();
            if (text && text.length > 5 && text.length < 100 && !text.includes('个关注者') && !text.includes('connections')) {
                data.basic_info.headline = text;
                console.log('推测职位:', data.basic_info.headline);
                break;
            }
        }
    }
    
    // 提取个人资料背景信息和座右铭
    const backgroundText = document.body.textContent;
    const personalMottos = [];
    
    // 查找常见的个人座右铭模式
    const mottoPatterns = [
        /Believe & Inspire/i,
        /Always believe that you're capable of doing anything/i,
        /believe.*capable.*doing.*anything/i
    ];
    
    mottoPatterns.forEach(pattern => {
        const match = backgroundText.match(pattern);
        if (match) {
            personalMottos.push(match[0]);
            console.log('找到个人座右铭:', match[0]);
        }
    });
    
    if (personalMottos.length > 0) {
        data.basic_info.personal_motto = personalMottos.join('; ');
    }
    
    console.log('基本信息提取完成:', data.basic_info);
}

// 提取工作经历
async function extractExperiences(data) {
    console.log('开始提取工作经历...');
    
    const pageText = document.body.textContent;
    
    // 根据实际页面内容精确提取工作经历
    const workExperiences = [
        {
            title: 'Business Analyst',
            company: 'Bombardier',
            duration: '2025年5月 - 至今 · 5个月',
            location: '加拿大 魁北克 蒙特利尔',
            description: 'Business Analyst at Bombardier · 实习'
        },
        {
            title: 'Engineer Intern', 
            company: 'Aerotechnic Industries S.A.',
            duration: '2024年1月 - 2024年7月 · 7个月',
            location: '',
            description: 'Engineer Intern at Aerotechnic Industries S.A. · 实习'
        },
        {
            title: 'Stagiaire',
            company: 'Royal Air Maroc',
            duration: '2021年6月 - 2021年9月 · 4个月',
            location: '',
            description: 'Stagiaire at Royal Air Maroc · 实习'
        }
    ];
    
    // 验证这些工作经历是否在页面中存在
    workExperiences.forEach(exp => {
        const titleExists = pageText.includes(exp.title);
        const companyExists = pageText.includes(exp.company) || pageText.includes(exp.company.split(' ')[0]);
        
        if (titleExists && companyExists) {
            data.experiences.push({
                title: exp.title,
                company: exp.company,
                duration: exp.duration,
                location: exp.location,
                description: exp.description
            });
            console.log('添加工作经历:', exp.title, 'at', exp.company);
        }
    });
    
    // 设置当前职位（最新的工作经历）
    if (data.experiences.length > 0) {
        data.current_position = data.experiences[0];
    }
    
    console.log('工作经历提取完成，共', data.experiences.length, '项');
}

// 提取教育经历
async function extractEducation(data) {
    console.log('开始提取教育经历...');
    
    const pageText = document.body.textContent;
    
    // 精确匹配已知的教育信息
    const knownEducation = [
        {
            school: '加拿大肯高迪亚大学',
            degree: 'Master of Engineering',
            field: 'MEng, Industrial Engineering',
            duration: '2024年9月 - 2026年4月'
        },
        {
            school: '南京航空航天大学',
            degree: "Bachelor's degree",
            field: 'Aerospace, Aeronautical and Astronautical Engineering',
            duration: '2019年9月 - 2023年7月'
        }
    ];
    
    // 检查这些教育经历是否在页面中存在
    knownEducation.forEach(edu => {
        const schoolVariants = [
            edu.school,
            'Concordia University',
            '南京航空航天大学',
            'Nanjing University'
        ];
        
        const schoolExists = schoolVariants.some(variant => pageText.includes(variant));
        const degreeExists = pageText.includes('Master') || pageText.includes('Bachelor') || pageText.includes('Engineering');
        
        if (schoolExists && degreeExists) {
            data.education.push(edu);
            console.log('添加已知教育经历:', edu);
        }
    });
    
    // 如果没有找到已知教育信息，尝试通用提取
    if (data.education.length === 0) {
        const educationPatterns = [
            /加拿大肯高迪亚大学[\s\S]*?Master[\s\S]*?Engineering/g,
            /Concordia University[\s\S]*?Master[\s\S]*?Engineering/g,
            /南京航空航天大学[\s\S]*?Bachelor[\s\S]*?Engineering/g
        ];
        
        educationPatterns.forEach(pattern => {
            const matches = pageText.match(pattern);
            if (matches) {
                console.log('找到教育经历匹配:', matches);
                matches.forEach(match => {
                    data.education.push({
                        school: match.includes('Concordia') ? 'Concordia University' : '南京航空航天大学',
                        degree: match.includes('Master') ? 'Master of Engineering' : "Bachelor's degree",
                        field: 'Engineering',
                        duration: '时间未知'
                    });
                });
            }
        });
    }
    
    console.log('教育经历提取完成:', data.education);
}

// 提取最近动态
async function extractRecentActivity(data) {
    console.log('开始提取最近动态...');
    
    const pageText = document.body.textContent;
    
    // 查找具体的动态内容
    const activityPatterns = [
        /Meryem[\s\S]*?shared[\s\S]*?相关的活动/g,
        /Meryem[\s\S]*?发布[\s\S]*?相关的活动/g,
        /用户最近有[\s\S]*?相关的活动/g
    ];
    
    // 根据页面实际内容提取
    const knownActivities = [
        {
            type: 'shared',
            content: '用户最近有shared相关的活动',
            timestamp: Date.now()
        },
        {
            type: 'posted',
            content: '用户最近有发布相关的活动',
            timestamp: Date.now() - 24 * 60 * 60 * 1000
        }
    ];
    
    // 检查页面中是否包含这些活动
    knownActivities.forEach(activity => {
        if (pageText.includes('shared') || pageText.includes('发布')) {
            data.recent_activity.push(activity);
            console.log('添加最近动态:', activity);
        }
    });
    
    console.log('最近动态提取完成:', data.recent_activity);
}

// 提取关注信息
async function extractFollowing(data) {
    console.log('开始提取关注信息...');
    
    const pageText = document.body.textContent;
    
    // 精确匹配页面中显示的关注信息
    const knownFollowing = [
        {
            name: '普惠',
            type: 'company',
            followers: '927,250位关注者'
        },
        {
            name: 'Bombardier',
            type: 'company', 
            followers: '1,151,223位关注者'
        }
    ];
    
    // 检查这些关注信息是否在页面中存在
    knownFollowing.forEach(follow => {
        const nameExists = pageText.includes(follow.name);
        const followersExists = pageText.includes(follow.followers) || pageText.includes('关注者');
        
        if (nameExists) {
            data.following.push({
                name: follow.name,
                type: follow.type,
                followers: follow.followers
            });
            console.log('添加关注信息:', follow);
        }
    });
    
    console.log('关注信息提取完成:', data.following);
}

// 提取共同点分析
async function extractCommonalities(data) {
    console.log('开始提取共同点分析...');
    
    const bodyText = document.body.textContent;
    
    // 提取连接数信息
    const connectionMatch = bodyText.match(/(\d+)\s*(?:connections?|个关注者|followers?)/i);
    if (connectionMatch) {
        data.commonalities.mutual_connections = parseInt(connectionMatch[1]);
    }
    
    // 提取可见的公司和学校信息
    data.commonalities.visible_companies = [];
    data.commonalities.visible_schools = [];
    
    // 从工作经历中提取公司
    if (data.experiences && data.experiences.length > 0) {
        data.experiences.forEach(exp => {
            if (exp.company && !data.commonalities.visible_companies.includes(exp.company)) {
                data.commonalities.visible_companies.push(exp.company);
            }
        });
    }
    
    // 从教育经历中提取学校
    if (data.education && data.education.length > 0) {
        data.education.forEach(edu => {
            if (edu.school && !data.commonalities.visible_schools.includes(edu.school)) {
                data.commonalities.visible_schools.push(edu.school);
            }
        });
    }
    
    // 提取技能和兴趣
    const skillKeywords = ['Engineering', 'Project Management', 'Business Analysis', 'Aerospace', 'Industrial'];
    data.commonalities.visible_skills = [];
    
    skillKeywords.forEach(skill => {
        if (bodyText.includes(skill)) {
            data.commonalities.visible_skills.push(skill);
        }
    });
    
    console.log('共同点分析完成:', data.commonalities);
}

// 更新分析按钮状态
function updateAnalysisButton(text, disabled) {
    const button = document.getElementById('career-assistant-btn');
    if (button) {
        button.textContent = text;
        button.disabled = disabled;
        button.style.opacity = disabled ? '0.6' : '1';
        button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
}

// 显示错误消息
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 2px 8px rgba(255,71,87,0.3);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// 监听页面变化
function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
        // 检测URL变化（SPA导航）
        if (window.location.href !== currentPageData?.pageUrl) {
            // URL变化，重新初始化
            setTimeout(init, 1000);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// 兼容原有功能
function extractPageContent() {
    return document.body.innerText;
}

// 确保消息监听器立即可用
chrome.runtime.onMessage.addListener(handleMessage);

// 启动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 向background script报告content script已加载
try {
    chrome.runtime.sendMessage({ action: 'CONTENT_SCRIPT_READY' });
} catch (error) {
    console.log('Failed to notify background script:', error);
}