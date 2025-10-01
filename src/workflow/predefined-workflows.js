// predefined-workflows.js - 预定义工作流
// 包含求职者准备和公司分析的完整工作流定义

// 求职者准备工作流
export const CHAT_PREP_WORKFLOW = {
    name: 'chat_prep_workflow',
    description: '求职者闲聊准备工作流',
    nodes: [
        {
            id: 'data_cleaning',
            type: 'transform',
            isStart: true,
            config: {
                transformFunction: 'clean_and_normalize_profile_data'
            }
        },
        {
            id: 'information_scoring',
            type: 'llm',
            config: {
                prompt: `作为信息筛选助手，请对以下个人信息进行重要性评分和排序。

输入数据：{{cleaned_data}}
目标场合：{{context}}

请按以下JSON格式输出：
{
  "scored_items": [
    {
      "content": "具体信息内容",
      "score": "high|medium|low",
      "category": "experience|education|project|achievement",
      "relevance_reason": "为什么这个信息重要的原因"
    }
  ],
  "priority_summary": "整体信息质量评估"
}

评分标准：
- high: 直接相关且有冲击力的信息
- medium: 相关但不是核心的信息  
- low: 背景信息或不太相关的内容`,
                model: 'claude-sonnet',
                temperature: 0.3,
                maxTokens: 1000
            }
        },
        {
            id: 'content_generation',
            type: 'parallel',
            config: {
                subNodes: [
                    {
                        id: 'icebreaker_generation',
                        type: 'llm',
                        config: {
                            prompt: `基于以下高分信息生成破冰开场白：

高分信息：{{high_score_items}}
场合：{{context}}

要求：
1. 1-2句话，自然不做作
2. 体现你对对方的了解
3. 适合{{context}}的场合
4. 避免过于正式或过于随意

请以JSON格式输出：
{
  "icebreaker": "开场白内容",
  "based_on_sources": ["信息来源1", "信息来源2"],
  "tone": "friendly|professional|casual"
}`,
                            temperature: 0.4
                        }
                    },
                    {
                        id: 'questions_generation',
                        type: 'llm',
                        config: {
                            prompt: `基于个人信息生成深入交流问题：

所有信息：{{scored_items}}
场合：{{context}}

生成3-5个问题，包含：
- 1-2个关于最近经历的问题（P0优先级）
- 1-2个关于专业发展的问题（P1优先级）
- 1个关于个人兴趣的问题（P2优先级）

JSON格式：
{
  "questions": [
    {
      "text": "问题内容",
      "priority": "P0|P1|P2",
      "category": "recent|professional|personal",
      "source": "基于哪个信息点",
      "follow_up_hints": ["可能的追问方向"]
    }
  ]
}`,
                            temperature: 0.5
                        }
                    },
                    {
                        id: 'email_draft',
                        type: 'llm',
                        config: {
                            prompt: `生成跟进邮件草稿：

基础信息：{{basic_info}}
高分信息：{{high_score_items}}
场合：{{context}}

邮件要求：
- 专业但不失亲和力
- 体现对对方的了解
- 明确下一步行动
- 长度控制在150字以内

JSON格式：
{
  "subject": "邮件主题",
  "body": "邮件正文",
  "tone": "professional|friendly",
  "call_to_action": "期望的回应"
}`,
                            temperature: 0.3
                        }
                    }
                ]
            }
        },
        {
            id: 'source_linking',
            type: 'transform',
            config: {
                transformFunction: 'generate_source_links'
            }
        },
        {
            id: 'flashcard_synthesis',
            type: 'transform',
            config: {
                transformFunction: 'create_flashcard'
            }
        },
        {
            id: 'ui_data_packaging',
            type: 'transform',
            isEnd: true,
            config: {
                transformFunction: 'package_for_ui'
            }
        }
    ],
    edges: [
        { from: 'data_cleaning', to: 'information_scoring' },
        { from: 'information_scoring', to: 'content_generation' },
        { from: 'content_generation', to: 'source_linking' },
        { from: 'source_linking', to: 'flashcard_synthesis' },
        { from: 'flashcard_synthesis', to: 'ui_data_packaging' }
    ]
};

// 公司分析工作流
export const COMPANY_ANALYSIS_WORKFLOW = {
    name: 'company_analysis_workflow',
    description: '公司信息分析工作流',
    nodes: [
        {
            id: 'data_source_routing',
            type: 'decision',
            isStart: true,
            config: {
                condition: 'input.companyUrl && input.companyUrl.includes("linkedin.com")',
                trueOutput: { route: 'linkedin_company' },
                falseOutput: { route: 'company_website' }
            }
        },
        {
            id: 'website_scraping',
            type: 'parallel',
            config: {
                subNodes: [
                    {
                        id: 'main_page_scraping',
                        type: 'api_call',
                        config: {
                            url: '{{scraping_service_url}}',
                            method: 'POST',
                            body: {
                                url: '{{companyUrl}}',
                                type: 'main_page'
                            }
                        }
                    },
                    {
                        id: 'about_page_scraping',
                        type: 'api_call',
                        config: {
                            url: '{{scraping_service_url}}',
                            method: 'POST',
                            body: {
                                url: '{{aboutPageUrl}}',
                                type: 'about_page'
                            }
                        }
                    },
                    {
                        id: 'news_scraping',
                        type: 'api_call',
                        config: {
                            url: '{{scraping_service_url}}',
                            method: 'POST',
                            body: {
                                url: '{{newsPageUrl}}',
                                type: 'news_page'
                            }
                        }
                    }
                ]
            }
        },
        {
            id: 'external_news_fetching',
            type: 'api_call',
            config: {
                url: 'https://newsapi.org/v2/everything',
                method: 'GET',
                headers: {
                    'X-API-Key': '{{news_api_key}}'
                },
                body: {
                    q: '{{companyName}}',
                    sortBy: 'publishedAt',
                    from: '{{twelve_months_ago}}',
                    pageSize: 20
                }
            }
        },
        {
            id: 'event_deduplication',
            type: 'llm',
            config: {
                prompt: `分析以下新闻内容，识别重复事件并合并成时间线：

官网新闻：{{website_news}}
外部新闻：{{external_news}}

请识别重复报道的同一事件，并按时间顺序整理成清晰的时间线。

输出JSON格式：
{
  "timeline": [
    {
      "event": "事件描述（30字以内）",
      "date": "YYYY-MM-DD",
      "category": "funding|product|partnership|team|other",
      "importance": 1-5,
      "sources": ["来源URL1", "来源URL2"],
      "summary": "详细描述（100字以内）"
    }
  ],
  "duplicate_groups": [
    {
      "event": "事件名称",
      "sources": ["重复报道的来源"]
    }
  ]
}`,
                temperature: 0.2,
                maxTokens: 1500
            }
        },
        {
            id: 'company_positioning',
            type: 'llm',
            config: {
                prompt: `基于以下信息，总结公司的核心定位：

About页面内容：{{about_content}}
最近3个重大事件：{{recent_events}}
公司基础信息：{{company_meta}}

请用一句话（30字内）概括公司的核心业务和差异化定位，并分析其业务重点。

JSON格式：
{
  "tagline": "一句话定位",
  "focus_areas": ["关键业务领域1", "关键业务领域2"],
  "target_customers": "目标客户群描述",
  "business_model": "商业模式简述",
  "competitive_positioning": "竞争定位"
}`,
                temperature: 0.3
            }
        },
        {
            id: 'competitor_analysis',
            type: 'llm',
            config: {
                prompt: `从以下内容中识别竞争对手和公司优势：

公司定位：{{company_positioning}}
新闻内容：{{all_news_content}}
About内容：{{about_content}}

分析竞争格局和公司相对优势。

JSON格式：
{
  "competitors": [
    {
      "name": "竞争对手名称",
      "relationship": "direct|indirect",
      "mentioned_context": "提及的上下文"
    }
  ],
  "competitive_advantages": [
    {
      "advantage": "优势描述",
      "evidence": "支撑证据",
      "strength": "high|medium|low"
    }
  ],
  "market_position": "市场地位分析"
}`,
                temperature: 0.4
            }
        },
        {
            id: 'interview_advice_generation',
            type: 'llm',
            config: {
                prompt: `基于公司分析，为面试者提供准备建议：

公司定位：{{company_positioning}}
最近事件：{{timeline}}
目标职位：{{target_position}}
竞争分析：{{competitor_analysis}}

生成3-5条具体的面试准备建议。

JSON格式：
{
  "interview_tips": [
    {
      "tip": "建议内容",
      "reason": "建议理由",
      "priority": "high|medium|low",
      "category": "preparation|questions|presentation"
    }
  ],
  "key_talking_points": ["要点1", "要点2", "要点3"],
  "questions_to_ask": ["可以问的问题1", "可以问的问题2"],
  "red_flags_to_watch": ["需要注意的问题"]
}`,
                temperature: 0.4
            }
        },
        {
            id: 'visualization_data_prep',
            type: 'transform',
            isEnd: true,
            config: {
                transformFunction: 'prepare_visualization_data'
            }
        }
    ],
    edges: [
        { from: 'data_source_routing', to: 'website_scraping' },
        { from: 'website_scraping', to: 'external_news_fetching' },
        { from: 'external_news_fetching', to: 'event_deduplication' },
        { from: 'event_deduplication', to: 'company_positioning' },
        { from: 'company_positioning', to: 'competitor_analysis' },
        { from: 'competitor_analysis', to: 'interview_advice_generation' },
        { from: 'interview_advice_generation', to: 'visualization_data_prep' }
    ]
};

// 工作流转换函数
export const WORKFLOW_TRANSFORMS = {
    // 清洗和标准化个人资料数据
    clean_and_normalize_profile_data: (input) => {
        const cleaned = { ...input };
        
        // 清理HTML标签
        const cleanText = (text) => {
            if (typeof text !== 'string') return text;
            return text.replace(/<[^>]*>/g, '')
                      .replace(/\s+/g, ' ')
                      .trim();
        };
        
        // 清理基础信息
        if (cleaned.basic_info) {
            Object.keys(cleaned.basic_info).forEach(key => {
                cleaned.basic_info[key] = cleanText(cleaned.basic_info[key]);
            });
        }
        
        // 清理经历信息
        if (cleaned.experiences) {
            cleaned.experiences = cleaned.experiences.map(exp => ({
                ...exp,
                title: cleanText(exp.title),
                company: cleanText(exp.company),
                description: cleanText(exp.description),
                duration_months: calculateDurationMonths(exp.date_start, exp.date_end)
            }));
        }
        
        // 清理教育信息
        if (cleaned.education) {
            cleaned.education = cleaned.education.map(edu => ({
                ...edu,
                school: cleanText(edu.school),
                degree: cleanText(edu.degree),
                description: cleanText(edu.description)
            }));
        }
        
        return cleaned;
    },
    
    // 生成来源链接
    generate_source_links: (input) => {
        const { icebreaker_generation, questions_generation, email_draft, scored_items } = input;
        
        // 为每个生成的内容添加来源链接
        const addSourceLinks = (content, sources) => {
            if (!content || !sources) return content;
            
            const sourceMap = {};
            scored_items.forEach((item, index) => {
                sourceMap[item.content] = {
                    url: `#source-${index}`,
                    type: item.category
                };
            });
            
            return {
                ...content,
                source_links: sources.map(source => sourceMap[source]).filter(Boolean)
            };
        };
        
        return {
            icebreaker: addSourceLinks(icebreaker_generation, icebreaker_generation?.based_on_sources),
            questions: questions_generation?.questions?.map(q => ({
                ...q,
                source_link: `#source-${q.source}`
            })) || [],
            email_draft: addSourceLinks(email_draft, []),
            scored_items
        };
    },
    
    // 创建速记卡片
    create_flashcard: (input) => {
        const { questions, icebreaker, scored_items } = input;
        
        // 选择P0优先级的问题
        const priorityQuestions = questions?.filter(q => q.priority === 'P0').slice(0, 3) || [];
        
        // 选择最有冲击力的成就
        const topAchievement = scored_items?.find(item => 
            item.score === 'high' && 
            (item.category === 'achievement' || item.category === 'project')
        );
        
        const flashcard = {
            key_points: priorityQuestions.map(q => q.text),
            golden_quote: topAchievement?.content || icebreaker?.icebreaker || '',
            reading_time: Math.ceil((priorityQuestions.length * 20 + 30) / 250), // 估算阅读时间（秒）
            confidence_score: calculateConfidenceScore(scored_items)
        };
        
        return {
            ...input,
            flashcard
        };
    },
    
    // 打包UI数据
    package_for_ui: (input) => {
        return {
            icebreaker: input.icebreaker,
            questions: input.questions,
            email_draft: input.email_draft,
            flashcard: input.flashcard,
            metadata: {
                processing_time_ms: Date.now() - (input.start_time || Date.now()),
                tokens_used: estimateTokensUsed(input),
                cost_usd: estimateCost(input),
                confidence_score: input.flashcard?.confidence_score || 0.5
            }
        };
    },
    
    // 准备可视化数据
    prepare_visualization_data: (input) => {
        const { timeline, competitor_analysis, interview_tips } = input;
        
        // 时间线图表数据
        const timelineData = timeline?.map(event => ({
            date: event.date,
            event: event.event,
            category: event.category,
            importance: event.importance
        })) || [];
        
        // 技能热力图数据（如果有招聘信息）
        const skillsData = input.careers?.skills || {};
        
        // 竞争对手网络图数据
        const competitorNetwork = {
            nodes: [
                { id: 'company', label: input.company_name, type: 'main' },
                ...(competitor_analysis?.competitors?.map(comp => ({
                    id: comp.name,
                    label: comp.name,
                    type: comp.relationship
                })) || [])
            ],
            edges: competitor_analysis?.competitors?.map(comp => ({
                from: 'company',
                to: comp.name,
                relationship: comp.relationship
            })) || []
        };
        
        return {
            ...input,
            visualization: {
                timeline: timelineData,
                skills_heatmap: skillsData,
                competitor_network: competitorNetwork
            }
        };
    }
};

// 辅助函数
function calculateDurationMonths(startDate, endDate) {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    return Math.max(0, months);
}

function calculateConfidenceScore(scoredItems) {
    if (!scoredItems || scoredItems.length === 0) return 0.3;
    
    const highCount = scoredItems.filter(item => item.score === 'high').length;
    const totalCount = scoredItems.length;
    
    return Math.min(0.9, 0.3 + (highCount / totalCount) * 0.6);
}

function estimateTokensUsed(input) {
    // 简单的token估算
    const text = JSON.stringify(input);
    return Math.ceil(text.length / 4); // 粗略估算：4个字符 ≈ 1个token
}

function estimateCost(input) {
    const tokens = estimateTokensUsed(input);
    const inputTokens = tokens * 0.7; // 假设70%是输入token
    const outputTokens = tokens * 0.3; // 30%是输出token
    
    // Claude Sonnet定价（示例）
    const inputCost = (inputTokens / 1000) * 0.003;
    const outputCost = (outputTokens / 1000) * 0.015;
    
    return inputCost + outputCost;
}
