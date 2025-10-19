// company-scraper.js - 公司信息采集引擎
// 支持多源并行抓取：官网、LinkedIn公司页、外部新闻

class CompanyScraper {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        this.timeout = 10000; // 10秒超时
        this.maxRetries = 3;
    }

    // 检测公司网站类型
    detectSiteType(url) {
        const hostname = new URL(url).hostname.toLowerCase();
        
        if (hostname.includes('linkedin.com')) {
            return 'linkedin_company';
        }
        
        // 常见招聘网站
        const jobSites = ['indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com', 'lever.co', 'greenhouse.io'];
        if (jobSites.some(site => hostname.includes(site))) {
            return 'job_site';
        }
        
        return 'company_website';
    }

    // 获取页面HTML内容
    async fetchPageContent(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                signal: AbortSignal.timeout(this.timeout)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error('Failed to fetch page content:', error);
            throw error;
        }
    }

    // 解析HTML内容
    parseHTML(html) {
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    }

    // 提取meta信息
    extractMetaInfo(doc) {
        const meta = {};
        
        // 基础meta标签
        const metaTags = {
            title: 'title',
            description: 'meta[name="description"]',
            keywords: 'meta[name="keywords"]',
            author: 'meta[name="author"]',
            'og:title': 'meta[property="og:title"]',
            'og:description': 'meta[property="og:description"]',
            'og:image': 'meta[property="og:image"]',
            'og:url': 'meta[property="og:url"]',
            'twitter:title': 'meta[name="twitter:title"]',
            'twitter:description': 'meta[name="twitter:description"]'
        };
        
        Object.entries(metaTags).forEach(([key, selector]) => {
            const element = doc.querySelector(selector);
            if (element) {
                meta[key] = selector === 'title' ? 
                    element.textContent.trim() : 
                    element.getAttribute('content') || '';
            }
        });
        
        return meta;
    }

    // 识别关键页面链接
    findKeyPages(doc, baseUrl) {
        const keyPages = {
            about: [],
            news: [],
            careers: [],
            contact: [],
            team: []
        };
        
        const links = doc.querySelectorAll('a[href]');
        const baseUrlObj = new URL(baseUrl);
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            let fullUrl;
            try {
                fullUrl = new URL(href, baseUrl).href;
                // 只处理同域名的链接
                if (new URL(fullUrl).hostname !== baseUrlObj.hostname) return;
            } catch (error) {
                return;
            }
            
            const text = link.textContent.toLowerCase().trim();
            const url = fullUrl.toLowerCase();
            
            // About页面
            if (text.includes('about') || text.includes('关于') || 
                url.includes('/about') || url.includes('/company')) {
                keyPages.about.push({ url: fullUrl, text: link.textContent.trim() });
            }
            
            // 新闻页面
            if (text.includes('news') || text.includes('blog') || text.includes('press') ||
                text.includes('新闻') || text.includes('资讯') ||
                url.includes('/news') || url.includes('/blog') || url.includes('/press')) {
                keyPages.news.push({ url: fullUrl, text: link.textContent.trim() });
            }
            
            // 招聘页面
            if (text.includes('career') || text.includes('job') || text.includes('hiring') ||
                text.includes('招聘') || text.includes('职位') ||
                url.includes('/career') || url.includes('/job') || url.includes('/hiring')) {
                keyPages.careers.push({ url: fullUrl, text: link.textContent.trim() });
            }
            
            // 联系页面
            if (text.includes('contact') || text.includes('联系') ||
                url.includes('/contact')) {
                keyPages.contact.push({ url: fullUrl, text: link.textContent.trim() });
            }
            
            // 团队页面
            if (text.includes('team') || text.includes('people') || text.includes('leadership') ||
                text.includes('团队') || text.includes('员工') ||
                url.includes('/team') || url.includes('/people')) {
                keyPages.team.push({ url: fullUrl, text: link.textContent.trim() });
            }
        });
        
        // 去重并限制数量
        Object.keys(keyPages).forEach(key => {
            keyPages[key] = keyPages[key]
                .filter((item, index, self) => 
                    index === self.findIndex(t => t.url === item.url))
                .slice(0, 5); // 每类最多5个链接
        });
        
        return keyPages;
    }

    // 抓取About页面内容
    async scrapeAboutPage(aboutUrls) {
        if (aboutUrls.length === 0) return null;
        
        try {
            const html = await this.fetchPageContent(aboutUrls[0].url);
            const doc = this.parseHTML(html);
            
            // 提取公司描述段落
            const contentSelectors = [
                '.about-content',
                '.company-description',
                '.about-section',
                'main p',
                '.content p',
                'article p'
            ];
            
            let aboutContent = '';
            for (const selector of contentSelectors) {
                const elements = doc.querySelectorAll(selector);
                if (elements.length > 0) {
                    aboutContent = Array.from(elements)
                        .map(el => el.textContent.trim())
                        .filter(text => text.length > 50) // 过滤太短的段落
                        .join('\n\n');
                    if (aboutContent.length > 100) break;
                }
            }
            
            // 提取关键信息
            const keyInfo = this.extractKeyCompanyInfo(doc.body.textContent);
            
            return {
                url: aboutUrls[0].url,
                content: aboutContent,
                keyInfo: keyInfo
            };
            
        } catch (error) {
            console.error('Failed to scrape about page:', error);
            return null;
        }
    }

    // 提取关键公司信息
    extractKeyCompanyInfo(text) {
        const keyInfo = {};
        
        // 成立时间
        const foundedPatterns = [
            /founded\s+in\s+(\d{4})/i,
            /established\s+in\s+(\d{4})/i,
            /since\s+(\d{4})/i,
            /成立于\s*(\d{4})/i
        ];
        
        for (const pattern of foundedPatterns) {
            const match = text.match(pattern);
            if (match) {
                keyInfo.founded = match[1];
                break;
            }
        }
        
        // 员工数量
        const employeePatterns = [
            /(\d+[\d,]*)\s+employees/i,
            /team\s+of\s+(\d+[\d,]*)/i,
            /(\d+[\d,]*)\s+人团队/i,
            /员工\s*(\d+[\d,]*)/i
        ];
        
        for (const pattern of employeePatterns) {
            const match = text.match(pattern);
            if (match) {
                keyInfo.employees = match[1].replace(/,/g, '');
                break;
            }
        }
        
        // 总部位置
        const locationPatterns = [
            /headquartered\s+in\s+([^.]+)/i,
            /based\s+in\s+([^.]+)/i,
            /located\s+in\s+([^.]+)/i,
            /总部位于\s*([^。]+)/i
        ];
        
        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
                keyInfo.headquarters = match[1].trim();
                break;
            }
        }
        
        return keyInfo;
    }

    // 抓取新闻页面
    async scrapeNewsPage(newsUrls, limit = 10) {
        if (newsUrls.length === 0) return [];
        
        const news = [];
        
        for (const newsUrl of newsUrls.slice(0, 2)) { // 最多抓取2个新闻页面
            try {
                const html = await this.fetchPageContent(newsUrl.url);
                const doc = this.parseHTML(html);
                
                // 查找新闻条目
                const newsSelectors = [
                    '.news-item',
                    '.blog-post',
                    '.press-release',
                    'article',
                    '.post',
                    '.news-entry'
                ];
                
                for (const selector of newsSelectors) {
                    const items = doc.querySelectorAll(selector);
                    if (items.length > 0) {
                        items.forEach((item, index) => {
                            if (news.length >= limit) return;
                            
                            const title = this.extractNewsTitle(item);
                            const date = this.extractNewsDate(item);
                            const summary = this.extractNewsSummary(item);
                            const url = this.extractNewsUrl(item, newsUrl.url);
                            
                            if (title && title.length > 10) {
                                news.push({
                                    title: title,
                                    date: date,
                                    summary: summary,
                                    url: url,
                                    source: 'company_website'
                                });
                            }
                        });
                        break;
                    }
                }
                
            } catch (error) {
                console.error(`Failed to scrape news page ${newsUrl.url}:`, error);
                continue;
            }
        }
        
        return news;
    }

    // 提取新闻标题
    extractNewsTitle(item) {
        const titleSelectors = ['h1', 'h2', 'h3', '.title', '.headline', 'a'];
        
        for (const selector of titleSelectors) {
            const element = item.querySelector(selector);
            if (element && element.textContent.trim().length > 10) {
                return element.textContent.trim();
            }
        }
        
        return '';
    }

    // 提取新闻日期
    extractNewsDate(item) {
        const dateSelectors = ['time', '.date', '.published', '.timestamp'];
        
        for (const selector of dateSelectors) {
            const element = item.querySelector(selector);
            if (element) {
                const dateText = element.getAttribute('datetime') || element.textContent.trim();
                const date = new Date(dateText);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0]; // YYYY-MM-DD格式
                }
            }
        }
        
        // 尝试从文本中提取日期
        const text = item.textContent;
        const datePatterns = [
            /(\d{4}-\d{2}-\d{2})/,
            /(\w+\s+\d{1,2},\s+\d{4})/,
            /(\d{1,2}\/\d{1,2}\/\d{4})/
        ];
        
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                const date = new Date(match[1]);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }
        
        return null;
    }

    // 提取新闻摘要
    extractNewsSummary(item) {
        const summarySelectors = ['.summary', '.excerpt', '.description', 'p'];
        
        for (const selector of summarySelectors) {
            const element = item.querySelector(selector);
            if (element && element.textContent.trim().length > 50) {
                return element.textContent.trim().substring(0, 200) + '...';
            }
        }
        
        return '';
    }

    // 提取新闻URL
    extractNewsUrl(item, baseUrl) {
        const linkElement = item.querySelector('a[href]');
        if (linkElement) {
            const href = linkElement.getAttribute('href');
            try {
                return new URL(href, baseUrl).href;
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    // 抓取招聘页面
    async scrapeCareersPage(careerUrls) {
        if (careerUrls.length === 0) return { positions: [], skills: {} };
        
        try {
            const html = await this.fetchPageContent(careerUrls[0].url);
            const doc = this.parseHTML(html);
            
            // 提取职位列表
            const positions = this.extractJobPositions(doc);
            
            // 统计技能关键词
            const skills = this.extractSkillKeywords(doc.body.textContent);
            
            return {
                positions: positions,
                skills: skills,
                url: careerUrls[0].url
            };
            
        } catch (error) {
            console.error('Failed to scrape careers page:', error);
            return { positions: [], skills: {} };
        }
    }

    // 提取职位信息
    extractJobPositions(doc) {
        const positions = [];
        const jobSelectors = [
            '.job-listing',
            '.position',
            '.career-item',
            '.job-post',
            '.opening'
        ];
        
        for (const selector of jobSelectors) {
            const items = doc.querySelectorAll(selector);
            if (items.length > 0) {
                items.forEach(item => {
                    const title = item.querySelector('h1, h2, h3, .title, .job-title')?.textContent.trim();
                    const department = item.querySelector('.department, .team')?.textContent.trim();
                    const location = item.querySelector('.location')?.textContent.trim();
                    
                    if (title && title.length > 5) {
                        positions.push({
                            title: title,
                            department: department || '',
                            location: location || ''
                        });
                    }
                });
                break;
            }
        }
        
        return positions.slice(0, 20); // 最多返回20个职位
    }

    // 提取技能关键词
    extractSkillKeywords(text) {
        const skillKeywords = [
            // 编程语言
            'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript',
            'PHP', 'Ruby', 'Scala', 'R', 'MATLAB', 'SQL',
            
            // 框架和库
            'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
            'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
            
            // 云服务和工具
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'Linux', 'MongoDB',
            'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
            
            // 技能领域
            'Machine Learning', 'AI', 'Data Science', 'DevOps', 'Frontend', 'Backend', 'Full Stack',
            'Mobile Development', 'UI/UX', 'Product Management', 'Agile', 'Scrum'
        ];
        
        const skillCounts = {};
        const textLower = text.toLowerCase();
        
        skillKeywords.forEach(skill => {
            const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'g');
            const matches = textLower.match(regex);
            if (matches) {
                skillCounts[skill] = matches.length;
            }
        });
        
        // 按出现频次排序
        return Object.fromEntries(
            Object.entries(skillCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 15) // 只返回first15个技能
        );
    }

    // LinkedIn公司页面抓取
    async scrapeLinkedInCompany(url) {
        try {
            const html = await this.fetchPageContent(url);
            const doc = this.parseHTML(html);
            
            // LinkedIn公司页面的特定选择器
            const companyInfo = {
                name: doc.querySelector('.org-top-card-summary__title')?.textContent.trim() || '',
                industry: doc.querySelector('.org-top-card-summary__industry')?.textContent.trim() || '',
                size: doc.querySelector('.org-top-card-summary__employees')?.textContent.trim() || '',
                headquarters: doc.querySelector('.org-top-card-summary__headquarters')?.textContent.trim() || '',
                description: doc.querySelector('.org-about-us-organization-description__text')?.textContent.trim() || '',
                website: doc.querySelector('.org-about-us-organization-description__website')?.href || '',
                followers: doc.querySelector('.org-top-card-summary__followers')?.textContent.trim() || ''
            };
            
            return companyInfo;
            
        } catch (error) {
            console.error('Failed to scrape LinkedIn company page:', error);
            return null;
        }
    }

    // 主要的公司分析方法
    async analyzeCompany(companyData) {
        const { companyName, companyUrl, targetPosition, additionalInfo } = companyData;
        
        if (!companyName && !companyUrl) {
            throw new Error('Company name or URL is required');
        }
        
        const results = {
            metadata: {
                analyzed_at: Date.now(),
                company_name: companyName,
                company_url: companyUrl,
                target_position: targetPosition
            },
            basic_info: {},
            key_pages: {},
            about_content: null,
            news: [],
            careers: { positions: [], skills: {} },
            analysis_summary: {}
        };
        
        try {
            if (companyUrl) {
                const siteType = this.detectSiteType(companyUrl);
                
                if (siteType === 'linkedin_company') {
                    // LinkedIn公司页面
                    results.basic_info = await this.scrapeLinkedInCompany(companyUrl);
                } else if (siteType === 'company_website') {
                    // 公司官网
                    const html = await this.fetchPageContent(companyUrl);
                    const doc = this.parseHTML(html);
                    
                    // 提取基础信息
                    results.basic_info = this.extractMetaInfo(doc);
                    
                    // 查找关键页面
                    results.key_pages = this.findKeyPages(doc, companyUrl);
                    
                    // 并行抓取关键页面内容
                    const [aboutContent, news, careers] = await Promise.allSettled([
                        this.scrapeAboutPage(results.key_pages.about),
                        this.scrapeNewsPage(results.key_pages.news),
                        this.scrapeCareersPage(results.key_pages.careers)
                    ]);
                    
                    if (aboutContent.status === 'fulfilled') {
                        results.about_content = aboutContent.value;
                    }
                    
                    if (news.status === 'fulfilled') {
                        results.news = news.value;
                    }
                    
                    if (careers.status === 'fulfilled') {
                        results.careers = careers.value;
                    }
                }
            }
            
            // 生成分析摘要
            results.analysis_summary = this.generateAnalysisSummary(results);
            
            return results;
            
        } catch (error) {
            console.error('Company analysis failed:', error);
            throw error;
        }
    }

    // 生成分析摘要
    generateAnalysisSummary(results) {
        const summary = {
            company_positioning: '',
            recent_highlights: [],
            hiring_trends: [],
            key_technologies: [],
            competitive_advantages: []
        };
        
        // Company Positioning
        if (results.about_content?.content) {
            const content = results.about_content.content;
            const sentences = content.split('.').filter(s => s.trim().length > 20);
            summary.company_positioning = sentences[0]?.trim() + '.' || '';
        }
        
        // 最近亮点
        if (results.news.length > 0) {
            summary.recent_highlights = results.news
                .slice(0, 3)
                .map(news => ({
                    title: news.title,
                    date: news.date,
                    summary: news.summary
                }));
        }
        
        // 招聘趋势
        if (results.careers.positions.length > 0) {
            const departments = {};
            results.careers.positions.forEach(pos => {
                const dept = pos.department || 'General';
                departments[dept] = (departments[dept] || 0) + 1;
            });
            
            summary.hiring_trends = Object.entries(departments)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([dept, count]) => ({ department: dept, openings: count }));
        }
        
        // 关键技术
        if (Object.keys(results.careers.skills).length > 0) {
            summary.key_technologies = Object.entries(results.careers.skills)
                .slice(0, 8)
                .map(([skill, count]) => ({ skill, mentions: count }));
        }
        
        return summary;
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.CompanyScraper = CompanyScraper;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompanyScraper;
}
