// linkedin-scraper.js - LinkedIn页面信息采集引擎
// 支持多层级选择器和反爬虫策略

class LinkedInScraper {
    constructor() {
        this.lastScrapeTime = 0;
        this.minInterval = 30000; // 30秒最小间隔
        this.maxRetries = 3;
        
        // 多套CSS选择器，按优先级排列
        this.selectors = {
            name: [
                'h1.text-heading-xlarge',
                '.pv-text-details__left-panel h1',
                '[data-generated-suggestion-target] h1',
                '.profile-photo-edit__preview .visually-hidden',
                'h1'
            ],
            headline: [
                '.text-body-medium.break-words',
                '.pv-text-details__left-panel .text-body-medium',
                '.ph5.pb5 .text-body-medium',
                '.pv-top-card--list-bullet .text-body-medium'
            ],
            location: [
                '.text-body-small.inline.t-black--light.break-words',
                '.pv-text-details__left-panel .text-body-small',
                '.ph5.pb5 .text-body-small'
            ],
            currentPosition: [
                '.pv-text-details__left-panel .inline-show-more-text',
                '.ph5.pb5 .inline-show-more-text',
                '.pv-entity__summary-info h3'
            ],
            experiences: [
                '#experience-section .pv-entity__summary-info',
                '.pv-profile-section.experience-section .pv-entity__summary-info',
                '[data-section="experience"] .pv-entity__summary-info',
                '.experience-section .pv-entity__summary-info'
            ],
            education: [
                '#education-section .pv-entity__summary-info',
                '.pv-profile-section.education-section .pv-entity__summary-info',
                '[data-section="education"] .pv-entity__summary-info'
            ],
            activity: [
                '.pv-recent-activity-section .pv-entity__summary-info',
                '[data-section="recent-activity"] .pv-entity__summary-info',
                '.recent-activity .pv-entity__summary-info'
            ]
        };
    }

    // 检查是否可以进行抓取（防止频繁请求）
    canScrape() {
        const now = Date.now();
        if (now - this.lastScrapeTime < this.minInterval) {
            return false;
        }
        return true;
    }

    // 随机延迟，模拟人类行为
    async randomDelay(min = 200, max = 800) {
        const delay = Math.random() * (max - min) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // 多选择器尝试获取元素
    getElementBySelectors(selectors) {
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    return element;
                }
            } catch (error) {
                console.warn(`Selector failed: ${selector}`, error);
                continue;
            }
        }
        return null;
    }

    // 获取所有匹配的元素
    getElementsBySelectors(selectors) {
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    return Array.from(elements);
                }
            } catch (error) {
                console.warn(`Selector failed: ${selector}`, error);
                continue;
            }
        }
        return [];
    }

    // 检测登录状态
    isLoggedIn() {
        // 检查是否有登录相关的元素
        const loginIndicators = [
            '.global-nav__me',
            '.global-nav__primary-link--me',
            '[data-control-name="nav.settings"]'
        ];
        
        return loginIndicators.some(selector => {
            return document.querySelector(selector) !== null;
        });
    }

    // 检测是否需要登录才能查看完整信息
    needsLogin() {
        const loginPrompts = [
            'Sign in to see full profile',
            'Join LinkedIn to view',
            'Sign up to see more'
        ];
        
        const bodyText = document.body.textContent;
        return loginPrompts.some(prompt => bodyText.includes(prompt));
    }

    // 基础信息抓取（无需交互）
    extractBasicInfo() {
        const basicInfo = {};
        
        // 姓名
        const nameElement = this.getElementBySelectors(this.selectors.name);
        basicInfo.name = nameElement ? nameElement.textContent.trim() : '';
        
        // 标题/职位描述
        const headlineElement = this.getElementBySelectors(this.selectors.headline);
        basicInfo.headline = headlineElement ? headlineElement.textContent.trim() : '';
        
        // 位置
        const locationElement = this.getElementBySelectors(this.selectors.location);
        basicInfo.location = locationElement ? locationElement.textContent.trim() : '';
        
        // 头像
        const profileImage = document.querySelector('.pv-top-card__photo img, .profile-photo-edit__preview img');
        basicInfo.profile_image_url = profileImage ? profileImage.src : '';
        
        return basicInfo;
    }

    // 当first职位信息
    extractCurrentPosition() {
        const positionElement = this.getElementBySelectors(this.selectors.currentPosition);
        if (!positionElement) return null;
        
        const positionText = positionElement.textContent.trim();
        const lines = positionText.split('\n').map(line => line.trim()).filter(line => line);
        
        return {
            title: lines[0] || '',
            company: lines[1] || '',
            duration: lines[2] || '',
            description: lines.slice(3).join(' ') || ''
        };
    }

    // 工作经历抓取
    extractExperiences(limit = 5) {
        const experienceElements = this.getElementsBySelectors(this.selectors.experiences);
        const experiences = [];
        
        for (let i = 0; i < Math.min(experienceElements.length, limit); i++) {
            const element = experienceElements[i];
            const text = element.textContent.trim();
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            
            if (lines.length >= 2) {
                const experience = {
                    title: lines[0] || '',
                    company: lines[1] || '',
                    duration: lines[2] || '',
                    description: lines.slice(3).join(' ') || '',
                    date_start: this.parseDateFromDuration(lines[2], true),
                    date_end: this.parseDateFromDuration(lines[2], false)
                };
                experiences.push(experience);
            }
        }
        
        return experiences;
    }

    // 教育背景抓取
    extractEducation() {
        const educationElements = this.getElementsBySelectors(this.selectors.education);
        const education = [];
        
        educationElements.forEach(element => {
            const text = element.textContent.trim();
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            
            if (lines.length >= 2) {
                education.push({
                    school: lines[0] || '',
                    degree: lines[1] || '',
                    duration: lines[2] || '',
                    description: lines.slice(3).join(' ') || ''
                });
            }
        });
        
        return education;
    }

    // 最近活动抓取
    extractRecentActivity(limit = 5) {
        const activityElements = this.getElementsBySelectors(this.selectors.activity);
        const activities = [];
        
        for (let i = 0; i < Math.min(activityElements.length, limit); i++) {
            const element = activityElements[i];
            const text = element.textContent.trim();
            
            // 尝试识别活动类型
            let type = 'post';
            if (text.includes('commented on')) type = 'comment';
            if (text.includes('shared')) type = 'share';
            if (text.includes('liked')) type = 'like';
            
            activities.push({
                type: type,
                content: text,
                timestamp: this.extractTimestamp(element),
                engagement: this.extractEngagement(element)
            });
        }
        
        return activities;
    }

    // 共同点信息抓取
    extractCommonalities() {
        const commonalities = {
            mutual_connections: 0,
            mutual_companies: [],
            mutual_schools: []
        };
        
        // 查找共同连接数量
        const mutualConnectionsText = document.body.textContent;
        const connectionMatch = mutualConnectionsText.match(/(\d+)\s+mutual\s+connection/i);
        if (connectionMatch) {
            commonalities.mutual_connections = parseInt(connectionMatch[1]);
        }
        
        // 查找共同公司（这个通常需要更深入的分析）
        const companyElements = document.querySelectorAll('[data-entity-hovercard-id*="company"]');
        companyElements.forEach(element => {
            const companyName = element.textContent.trim();
            if (companyName && !commonalities.mutual_companies.includes(companyName)) {
                commonalities.mutual_companies.push(companyName);
            }
        });
        
        return commonalities;
    }

    // 解析时间段字符串
    parseDateFromDuration(durationStr, isStart = true) {
        if (!durationStr) return null;
        
        // 匹配各种时间格式
        const patterns = [
            /(\w+)\s+(\d{4})\s*-\s*(\w+)\s+(\d{4})/,  // "Jan 2020 - Dec 2023"
            /(\w+)\s+(\d{4})\s*-\s*Present/i,         // "Jan 2020 - Present"
            /(\d{4})\s*-\s*(\d{4})/,                  // "2020 - 2023"
            /(\d{4})\s*-\s*Present/i                  // "2020 - Present"
        ];
        
        for (const pattern of patterns) {
            const match = durationStr.match(pattern);
            if (match) {
                if (isStart) {
                    return match[2] ? `${match[2]}-${this.monthToNumber(match[1]) || '01'}` : match[1];
                } else {
                    if (match[3] && match[3].toLowerCase() !== 'present') {
                        return match[4] ? `${match[4]}-${this.monthToNumber(match[3]) || '12'}` : match[2];
                    }
                    return null; // Present
                }
            }
        }
        
        return null;
    }

    // 月份名转数字
    monthToNumber(monthName) {
        const months = {
            'jan': '01', 'january': '01',
            'feb': '02', 'february': '02',
            'mar': '03', 'march': '03',
            'apr': '04', 'april': '04',
            'may': '05',
            'jun': '06', 'june': '06',
            'jul': '07', 'july': '07',
            'aug': '08', 'august': '08',
            'sep': '09', 'september': '09',
            'oct': '10', 'october': '10',
            'nov': '11', 'november': '11',
            'dec': '12', 'december': '12'
        };
        
        return months[monthName.toLowerCase()] || null;
    }

    // 提取时间戳
    extractTimestamp(element) {
        const timeElement = element.querySelector('time, .time-ago, [data-timestamp]');
        if (timeElement) {
            const datetime = timeElement.getAttribute('datetime') || 
                           timeElement.getAttribute('data-timestamp') ||
                           timeElement.textContent;
            return new Date(datetime).getTime() || Date.now();
        }
        return Date.now();
    }

    // 提取互动数据
    extractEngagement(element) {
        const engagement = {
            likes: 0,
            comments: 0,
            shares: 0
        };
        
        // 查找点赞数
        const likeElement = element.querySelector('[data-control-name*="like"], .social-counts-reactions__count');
        if (likeElement) {
            const likeText = likeElement.textContent;
            const likeMatch = likeText.match(/(\d+)/);
            if (likeMatch) engagement.likes = parseInt(likeMatch[1]);
        }
        
        // 查找评论数
        const commentElement = element.querySelector('[data-control-name*="comment"]');
        if (commentElement) {
            const commentText = commentElement.textContent;
            const commentMatch = commentText.match(/(\d+)/);
            if (commentMatch) engagement.comments = parseInt(commentMatch[1]);
        }
        
        return engagement;
    }

    // 模拟点击"Show more"按钮
    async clickShowMore() {
        const showMoreButtons = [
            'button[data-control-name="experience_see_more"]',
            '.pv-profile-section__see-more-inline',
            '.inline-show-more-text__button',
            'button:contains("Show more")',
            'button:contains("See more")'
        ];
        
        for (const selector of showMoreButtons) {
            try {
                const button = document.querySelector(selector);
                if (button && button.offsetParent !== null) { // 确保按钮可见
                    button.click();
                    await this.randomDelay(500, 1000);
                    return true;
                }
            } catch (error) {
                console.warn(`Failed to click show more button: ${selector}`, error);
            }
        }
        
        return false;
    }

    // 滚动到指定区域
    async scrollToSection(sectionName) {
        const sectionSelectors = {
            experience: ['#experience-section', '[data-section="experience"]', '.experience-section'],
            education: ['#education-section', '[data-section="education"]', '.education-section'],
            activity: ['#recent-activity-section', '[data-section="recent-activity"]', '.recent-activity-section']
        };
        
        const selectors = sectionSelectors[sectionName] || [];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                await this.randomDelay(500, 1000);
                return true;
            }
        }
        
        return false;
    }

    // 浅层抓取（无需交互）
    async shallowScrape() {
        if (!this.canScrape()) {
            throw new Error('Scraping too frequent, please wait');
        }
        
        this.lastScrapeTime = Date.now();
        
        // 检查登录状态
        if (this.needsLogin()) {
            throw new Error('Login required to view full profile');
        }
        
        const data = {
            metadata: {
                profile_url: window.location.href,
                scraped_at: Date.now(),
                scrape_depth: 'shallow',
                is_logged_in: this.isLoggedIn()
            },
            basic_info: this.extractBasicInfo(),
            current_position: this.extractCurrentPosition(),
            experiences: this.extractExperiences(3), // 只取first3个
            education: this.extractEducation(),
            recent_activity: [],
            commonalities: this.extractCommonalities()
        };
        
        return data;
    }

    // 深度抓取（包含交互）
    async deepScrape() {
        if (!this.canScrape()) {
            throw new Error('Scraping too frequent, please wait');
        }
        
        this.lastScrapeTime = Date.now();
        
        // 先进行浅层抓取
        const data = await this.shallowScrape();
        data.metadata.scrape_depth = 'deep';
        
        try {
            // 尝试点击"Show more"获取更多经历
            await this.clickShowMore();
            await this.randomDelay();
            
            // 重新抓取经历（现在应该有更多）
            data.experiences = this.extractExperiences(10);
            
            // 滚动到活动区域
            await this.scrollToSection('activity');
            await this.randomDelay(1000, 2000); // 等待动态加载
            
            // 抓取最近活动
            data.recent_activity = this.extractRecentActivity(5);
            
        } catch (error) {
            console.warn('Deep scraping partially failed:', error);
            // 即使部分失败，也返回已获取的数据
        }
        
        return data;
    }

    // 检测页面是否为LinkedIn个人资料页
    static isLinkedInProfile() {
        return window.location.hostname === 'www.linkedin.com' && 
               window.location.pathname.includes('/in/');
    }

    // 检测页面是否为LinkedIn公司页
    static isLinkedInCompany() {
        return window.location.hostname === 'www.linkedin.com' && 
               window.location.pathname.includes('/company/');
    }
}

// 导出给content script使用
if (typeof window !== 'undefined') {
    window.LinkedInScraper = LinkedInScraper;
}

// 导出给其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LinkedInScraper;
}
