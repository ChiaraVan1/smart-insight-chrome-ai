// question-timeline.js - 问题质量分级与时间轴展示
// P0-3: 将AI生成的问题按时间轴分级展示

class QuestionTimeline {
  
  /**
   * 解析AI生成的文本，提取问题并分级
   * @param {string} aiResponse - AI生成的回复文本
   * @param {string} scenario - 场景类型 (coffee-chat / networking)
   * @returns {Object} 结构化的问题数据
   */
  parseQuestions(aiResponse, scenario) {
    if (scenario === 'coffee-chat') {
      return this.parseCoffeeChatQuestions(aiResponse);
    } else if (scenario === 'networking') {
      return this.parseNetworkingQuestions(aiResponse);
    }
    return null;
  }
  
  /**
   * 解析 Coffee Chat 问题
   */
  parseCoffeeChatQuestions(text) {
    const sections = [];
    
    // 第一层：破冰 + 职业路径 (0-15分钟)
    const layer1 = this.extractSection(text, ['破冰', '职业路径', '第一层']);
    if (layer1.length > 0) {
      sections.push({
        title: '破冰 + 职业路径',
        timeRange: '0-15分钟',
        level: 'starter',
        icon: '🎯',
        color: '#10b981',
        questions: layer1
      });
    }
    
    // 第二层：行业洞察 (15-35分钟)
    const layer2 = this.extractSection(text, ['行业洞察', '行业趋势', '第二层']);
    if (layer2.length > 0) {
      sections.push({
        title: '行业洞察',
        timeRange: '15-35分钟',
        level: 'intermediate',
        icon: '🔍',
        color: '#3b82f6',
        questions: layer2
      });
    }
    
    // 第三层：个人建议 (35-45分钟)
    const layer3 = this.extractSection(text, ['个人建议', '针对性请教', '第三层']);
    if (layer3.length > 0) {
      sections.push({
        title: '个人建议',
        timeRange: '35-45分钟',
        level: 'advanced',
        icon: '🎓',
        color: '#8b5cf6',
        questions: layer3
      });
    }
    
    // 避雷警告
    const warnings = this.extractWarnings(text);
    
    // 跟进邮件
    const followUp = this.extractFollowUpEmail(text);
    
    return {
      type: 'coffee-chat',
      sections,
      warnings,
      followUp
    };
  }
  
  /**
   * 解析 Networking 问题
   */
  parseNetworkingQuestions(text) {
    const sections = [];
    
    // Elevator Pitch (0-2分钟)
    const pitch = this.extractSection(text, ['Elevator Pitch', '自我介绍', 'Pitch']);
    if (pitch.length > 0) {
      sections.push({
        title: 'Elevator Pitch',
        timeRange: '0-2分钟',
        level: 'starter',
        icon: '🎤',
        color: '#10b981',
        questions: pitch
      });
    }
    
    // 心机问题 Level 1 (2-4分钟)
    const level1 = this.extractSection(text, ['Level 1', '展示你关注']);
    if (level1.length > 0) {
      sections.push({
        title: '展示关注',
        timeRange: '2-4分钟',
        level: 'level1',
        icon: '👀',
        color: '#3b82f6',
        questions: level1
      });
    }
    
    // 心机问题 Level 2 (4-6分钟)
    const level2 = this.extractSection(text, ['Level 2', '展示你懂行业']);
    if (level2.length > 0) {
      sections.push({
        title: '展示专业',
        timeRange: '4-6分钟',
        level: 'level2',
        icon: '💡',
        color: '#f59e0b',
        questions: level2
      });
    }
    
    // 心机问题 Level 3 (6-8分钟)
    const level3 = this.extractSection(text, ['Level 3', '展示你想']);
    if (level3.length > 0) {
      sections.push({
        title: '展示意愿',
        timeRange: '6-8分钟',
        level: 'level3',
        icon: '🎯',
        color: '#8b5cf6',
        questions: level3
      });
    }
    
    // 要联系方式 (8-10分钟)
    const contact = this.extractSection(text, ['联系方式', '要联系方式']);
    if (contact.length > 0) {
      sections.push({
        title: '要联系方式',
        timeRange: '8-10分钟',
        level: 'closing',
        icon: '📱',
        color: '#ef4444',
        questions: contact
      });
    }
    
    // 跟进邮件
    const followUp = this.extractFollowUpEmail(text);
    
    return {
      type: 'networking',
      sections,
      followUp
    };
  }
  
  /**
   * 从文本中提取某个章节的问题
   */
  extractSection(text, keywords) {
    const questions = [];
    const lines = text.split('\n');
    let inSection = false;
    let currentQuestion = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否进入目标章节
      if (keywords.some(kw => line.includes(kw))) {
        inSection = true;
        continue;
      }
      
      // 检查是否离开章节（遇到下一个标题）
      if (inSection && (line.startsWith('━') || line.startsWith('##') || line.startsWith('###'))) {
        if (line.length > 10) { // 新章节标题
          break;
        }
        continue;
      }
      
      if (!inSection) continue;
      
      // 提取问题（以 • 或 - 或数字开头）
      const questionMatch = line.match(/^[•\-\d]+\.?\s*[""]?(.+?)[""]?\s*(\(.*?\))?$/);
      if (questionMatch) {
        const questionText = questionMatch[1].trim();
        const explanation = questionMatch[2] ? questionMatch[2].replace(/[()]/g, '').trim() : '';
        
        if (questionText.length > 10) { // 过滤太短的内容
          currentQuestion = {
            text: questionText,
            explanation: explanation,
            quality: this.assessQuestionQuality(questionText)
          };
          questions.push(currentQuestion);
        }
      } else if (currentQuestion && line.startsWith('(') && line.endsWith(')')) {
        // 补充说明
        currentQuestion.explanation = line.replace(/[()]/g, '').trim();
      }
    }
    
    return questions;
  }
  
  /**
   * 提取避雷警告
   */
  extractWarnings(text) {
    const warnings = [];
    const lines = text.split('\n');
    let inWarnings = false;
    
    for (const line of lines) {
      if (line.includes('避雷') || line.includes('不该问') || line.includes('⚠️')) {
        inWarnings = true;
        continue;
      }
      
      if (inWarnings) {
        if (line.startsWith('━') || line.startsWith('##') || line.startsWith('###')) {
          if (line.length > 10) break;
          continue;
        }
        
        const warningMatch = line.match(/^[•\-\d]+\.?\s*(.+)$/);
        if (warningMatch) {
          const warning = warningMatch[1].trim();
          if (warning.length > 5) {
            warnings.push(warning);
          }
        }
      }
    }
    
    return warnings;
  }
  
  /**
   * 提取跟进邮件
   */
  extractFollowUpEmail(text) {
    const emailMatch = text.match(/主题[：:]\s*(.+?)[\n\r]+([\s\S]+?)(?=\n\n|$)/);
    if (emailMatch) {
      return {
        subject: emailMatch[1].trim(),
        body: emailMatch[2].trim()
      };
    }
    return null;
  }
  
  /**
   * 评估问题质量
   */
  assessQuestionQuality(question) {
    let score = 0;
    
    // 开放式问题（不能yes/no回答）
    if (!question.match(/^(是否|能否|会不会|有没有)/)) {
      score += 2;
    }
    
    // 包含具体信息（公司名、项目名等）
    if (question.match(/[A-Z][a-z]+|[\u4e00-\u9fa5]{2,}/)) {
      score += 2;
    }
    
    // 使用"为什么"、"如何"等深度词汇
    if (question.match(/(为什么|如何|怎样|什么样|哪些)/)) {
      score += 1;
    }
    
    // 长度适中
    if (question.length > 20 && question.length < 100) {
      score += 1;
    }
    
    if (score >= 5) return 'excellent';
    if (score >= 3) return 'good';
    return 'basic';
  }
  
  /**
   * 生成时间轴HTML
   */
  generateTimelineHTML(data) {
    if (!data || !data.sections || data.sections.length === 0) {
      return '<p>暂无问题数据</p>';
    }
    
    const sectionsHTML = data.sections.map((section, index) => {
      const questionsHTML = section.questions.map(q => `
        <div class="timeline-question ${q.quality}">
          <div class="question-text">${this.escapeHtml(q.text)}</div>
          ${q.explanation ? `<div class="question-explanation">💡 ${this.escapeHtml(q.explanation)}</div>` : ''}
          <span class="quality-badge ${q.quality}">${this.getQualityLabel(q.quality)}</span>
        </div>
      `).join('');
      
      return `
        <div class="timeline-section">
          <div class="timeline-marker" style="background: ${section.color}">
            <span class="marker-icon">${section.icon}</span>
          </div>
          <div class="timeline-content">
            <div class="section-header">
              <h3 class="section-title">${section.title}</h3>
              <span class="time-badge" style="background: ${section.color}">${section.timeRange}</span>
            </div>
            <div class="questions-list">
              ${questionsHTML}
            </div>
          </div>
          ${index < data.sections.length - 1 ? '<div class="timeline-connector"></div>' : ''}
        </div>
      `;
    }).join('');
    
    const warningsHTML = data.warnings && data.warnings.length > 0 ? `
      <div class="warnings-section">
        <h3>⚠️ 避雷警告</h3>
        <ul class="warnings-list">
          ${data.warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('')}
        </ul>
      </div>
    ` : '';
    
    const followUpHTML = data.followUp ? `
      <div class="followup-section">
        <h3>📧 跟进邮件模板</h3>
        <div class="email-preview">
          <div class="email-subject"><strong>主题：</strong>${this.escapeHtml(data.followUp.subject)}</div>
          <div class="email-body">${this.escapeHtml(data.followUp.body).replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    ` : '';
    
    return `
      <div class="question-timeline">
        ${sectionsHTML}
      </div>
      ${warningsHTML}
      ${followUpHTML}
      
      <style>
        .question-timeline {
          position: relative;
          padding: 20px 0;
        }
        
        .timeline-section {
          position: relative;
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .timeline-marker {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          z-index: 2;
        }
        
        .marker-icon {
          font-size: 24px;
        }
        
        .timeline-connector {
          position: absolute;
          left: 23px;
          top: 48px;
          width: 2px;
          height: calc(100% - 48px);
          background: linear-gradient(to bottom, #e5e7eb, #f3f4f6);
        }
        
        .timeline-content {
          flex: 1;
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #f3f4f6;
        }
        
        .section-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .time-badge {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }
        
        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .timeline-question {
          position: relative;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 3px solid #e5e7eb;
        }
        
        .timeline-question.excellent {
          border-left-color: #10b981;
          background: #f0fdf4;
        }
        
        .timeline-question.good {
          border-left-color: #3b82f6;
          background: #eff6ff;
        }
        
        .question-text {
          font-size: 14px;
          line-height: 1.6;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .question-explanation {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }
        
        .quality-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .quality-badge.excellent {
          background: #d1fae5;
          color: #065f46;
        }
        
        .quality-badge.good {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .quality-badge.basic {
          background: #f3f4f6;
          color: #6b7280;
        }
        
        .warnings-section {
          margin-top: 30px;
          padding: 20px;
          background: #fef2f2;
          border-radius: 12px;
          border-left: 4px solid #ef4444;
        }
        
        .warnings-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #991b1b;
        }
        
        .warnings-list {
          margin: 0;
          padding-left: 20px;
        }
        
        .warnings-list li {
          color: #7f1d1d;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        
        .followup-section {
          margin-top: 30px;
          padding: 20px;
          background: #f0f9ff;
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
        }
        
        .followup-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #1e40af;
        }
        
        .email-preview {
          background: white;
          padding: 16px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .email-subject {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #1f2937;
        }
        
        .email-body {
          color: #4b5563;
        }
      </style>
    `;
  }
  
  /**
   * 获取质量标签
   */
  getQualityLabel(quality) {
    const labels = {
      excellent: '优质',
      good: '良好',
      basic: '基础'
    };
    return labels[quality] || '基础';
  }
  
  /**
   * HTML转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestionTimeline;
}
