// question-cards.js - 心机问题实例化
// P1-5: 将问题转换为可交互的卡片，支持收藏、笔记、使用记录

class QuestionCards {
  constructor() {
    this.favorites = this.loadFavorites();
    this.notes = this.loadNotes();
    this.usageHistory = this.loadUsageHistory();
  }
  
  /**
   * 将时间轴中的问题转换为交互式卡片
   * @param {Array} sections - 时间轴章节数据
   * @param {string} scenario - 场景类型
   */
  enhanceQuestionsWithCards(sections, scenario) {
    return sections.map(section => {
      const enhancedQuestions = section.questions.map((q, index) => {
        const questionId = this.generateQuestionId(section.title, q.text);
        return {
          ...q,
          id: questionId,
          isFavorite: this.favorites.includes(questionId),
          note: this.notes[questionId] || '',
          usageCount: this.usageHistory[questionId] || 0
        };
      });
      
      return {
        ...section,
        questions: enhancedQuestions
      };
    });
  }
  
  /**
   * 生成增强版时间轴HTML（带交互功能）
   */
  generateEnhancedTimelineHTML(sections) {
    const sectionsHTML = sections.map((section, index) => {
      const questionsHTML = section.questions.map(q => `
        <div class="timeline-question-card ${q.quality}" data-question-id="${q.id}">
          <div class="question-header">
            <div class="question-text">${this.escapeHtml(q.text)}</div>
            <div class="question-actions">
              <button class="action-btn favorite-btn ${q.isFavorite ? 'active' : ''}" 
                      onclick="questionCards.toggleFavorite('${q.id}')"
                      title="收藏">
                ${q.isFavorite ? '⭐' : '☆'}
              </button>
              <button class="action-btn note-btn ${q.note ? 'has-note' : ''}" 
                      onclick="questionCards.openNoteEditor('${q.id}')"
                      title="添加笔记">
                📝
              </button>
              <button class="action-btn copy-btn" 
                      onclick="questionCards.copyQuestion('${q.id}')"
                      title="复制">
                📋
              </button>
              <button class="action-btn mark-used-btn" 
                      onclick="questionCards.markAsUsed('${q.id}')"
                      title="标记已使用">
                ✓
              </button>
            </div>
          </div>
          
          ${q.explanation ? `
            <div class="question-explanation">
              💡 ${this.escapeHtml(q.explanation)}
            </div>
          ` : ''}
          
          ${q.note ? `
            <div class="question-note">
              📝 <strong>我的笔记：</strong>${this.escapeHtml(q.note)}
            </div>
          ` : ''}
          
          <div class="question-footer">
            <span class="quality-badge ${q.quality}">${this.getQualityLabel(q.quality)}</span>
            ${q.usageCount > 0 ? `<span class="usage-badge">已使用 ${q.usageCount} 次</span>` : ''}
          </div>
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
          ${index < sections.length - 1 ? '<div class="timeline-connector"></div>' : ''}
        </div>
      `;
    }).join('');
    
    return `
      <div class="enhanced-question-timeline">
        ${sectionsHTML}
      </div>
      
      <!-- 笔记编辑器模态框 -->
      <div class="note-modal hidden" id="note-modal">
        <div class="modal-overlay" onclick="questionCards.closeNoteEditor()"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>📝 添加笔记</h3>
            <button class="close-btn" onclick="questionCards.closeNoteEditor()">×</button>
          </div>
          <div class="modal-body">
            <textarea id="note-textarea" placeholder="记录你的想法、改进点或使用经验..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" onclick="questionCards.closeNoteEditor()">取消</button>
            <button class="save-btn" onclick="questionCards.saveNote()">保存</button>
          </div>
        </div>
      </div>
      
      <style>
        .enhanced-question-timeline {
          position: relative;
          padding: 20px 0;
        }
        
        .timeline-question-card {
          position: relative;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 3px solid #e5e7eb;
          margin-bottom: 12px;
          transition: all 0.2s;
        }
        
        .timeline-question-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateX(4px);
        }
        
        .timeline-question-card.excellent {
          border-left-color: #10b981;
          background: #f0fdf4;
        }
        
        .timeline-question-card.good {
          border-left-color: #3b82f6;
          background: #eff6ff;
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .question-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.6;
          color: #1f2937;
          font-weight: 500;
        }
        
        .question-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        
        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .action-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        
        .favorite-btn.active {
          background: #fef3c7;
        }
        
        .note-btn.has-note {
          background: #dbeafe;
        }
        
        .question-explanation {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }
        
        .question-note {
          font-size: 12px;
          color: #1e40af;
          line-height: 1.5;
          margin-top: 8px;
          padding: 8px 12px;
          background: #dbeafe;
          border-radius: 6px;
        }
        
        .question-footer {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 8px;
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
        
        .usage-badge {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          background: #e0e7ff;
          color: #3730a3;
        }
        
        /* 笔记模态框 */
        .note-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .note-modal.hidden {
          display: none;
        }
        
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        
        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
        }
        
        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          color: #6b7280;
        }
        
        .close-btn:hover {
          background: #e5e7eb;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        #note-textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }
        
        #note-textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .modal-footer button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .cancel-btn {
          background: #f3f4f6;
          color: #6b7280;
        }
        
        .cancel-btn:hover {
          background: #e5e7eb;
        }
        
        .save-btn {
          background: #3b82f6;
          color: white;
        }
        
        .save-btn:hover {
          background: #2563eb;
        }
      </style>
    `;
  }
  
  /**
   * 生成问题ID
   */
  generateQuestionId(sectionTitle, questionText) {
    const combined = sectionTitle + questionText;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'q_' + Math.abs(hash).toString(36);
  }
  
  /**
   * 切换收藏状态
   */
  toggleFavorite(questionId) {
    const index = this.favorites.indexOf(questionId);
    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(questionId);
    }
    this.saveFavorites();
    
    // 更新UI
    const btn = document.querySelector(`[data-question-id="${questionId}"] .favorite-btn`);
    if (btn) {
      btn.classList.toggle('active');
      btn.textContent = this.favorites.includes(questionId) ? '⭐' : '☆';
    }
  }
  
  /**
   * 打开笔记编辑器
   */
  openNoteEditor(questionId) {
    this.currentEditingId = questionId;
    const modal = document.getElementById('note-modal');
    const textarea = document.getElementById('note-textarea');
    
    textarea.value = this.notes[questionId] || '';
    modal.classList.remove('hidden');
    textarea.focus();
  }
  
  /**
   * 关闭笔记编辑器
   */
  closeNoteEditor() {
    const modal = document.getElementById('note-modal');
    modal.classList.add('hidden');
    this.currentEditingId = null;
  }
  
  /**
   * 保存笔记
   */
  saveNote() {
    const textarea = document.getElementById('note-textarea');
    const note = textarea.value.trim();
    
    if (this.currentEditingId) {
      if (note) {
        this.notes[this.currentEditingId] = note;
      } else {
        delete this.notes[this.currentEditingId];
      }
      this.saveNotes();
      
      // 更新UI
      const card = document.querySelector(`[data-question-id="${this.currentEditingId}"]`);
      if (card) {
        const noteBtn = card.querySelector('.note-btn');
        if (note) {
          noteBtn.classList.add('has-note');
          
          // 添加或更新笔记显示
          let noteDiv = card.querySelector('.question-note');
          if (!noteDiv) {
            noteDiv = document.createElement('div');
            noteDiv.className = 'question-note';
            card.querySelector('.question-header').after(noteDiv);
          }
          noteDiv.innerHTML = `📝 <strong>我的笔记：</strong>${this.escapeHtml(note)}`;
        } else {
          noteBtn.classList.remove('has-note');
          const noteDiv = card.querySelector('.question-note');
          if (noteDiv) noteDiv.remove();
        }
      }
    }
    
    this.closeNoteEditor();
  }
  
  /**
   * 复制问题
   */
  copyQuestion(questionId) {
    const card = document.querySelector(`[data-question-id="${questionId}"]`);
    const text = card.querySelector('.question-text').textContent;
    
    navigator.clipboard.writeText(text).then(() => {
      const btn = card.querySelector('.copy-btn');
      btn.textContent = '✓';
      setTimeout(() => {
        btn.textContent = '📋';
      }, 1500);
    });
  }
  
  /**
   * 标记为已使用
   */
  markAsUsed(questionId) {
    this.usageHistory[questionId] = (this.usageHistory[questionId] || 0) + 1;
    this.saveUsageHistory();
    
    // 更新UI
    const card = document.querySelector(`[data-question-id="${questionId}"]`);
    if (card) {
      let usageBadge = card.querySelector('.usage-badge');
      if (!usageBadge) {
        usageBadge = document.createElement('span');
        usageBadge.className = 'usage-badge';
        card.querySelector('.question-footer').appendChild(usageBadge);
      }
      usageBadge.textContent = `已使用 ${this.usageHistory[questionId]} 次`;
      
      // 动画效果
      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        card.style.transform = '';
      }, 200);
    }
  }
  
  /**
   * 本地存储操作
   */
  loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem('smartinsight_favorites') || '[]');
    } catch {
      return [];
    }
  }
  
  saveFavorites() {
    localStorage.setItem('smartinsight_favorites', JSON.stringify(this.favorites));
  }
  
  loadNotes() {
    try {
      return JSON.parse(localStorage.getItem('smartinsight_notes') || '{}');
    } catch {
      return {};
    }
  }
  
  saveNotes() {
    localStorage.setItem('smartinsight_notes', JSON.stringify(this.notes));
  }
  
  loadUsageHistory() {
    try {
      return JSON.parse(localStorage.getItem('smartinsight_usage') || '{}');
    } catch {
      return {};
    }
  }
  
  saveUsageHistory() {
    localStorage.setItem('smartinsight_usage', JSON.stringify(this.usageHistory));
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

// 全局实例
const questionCards = new QuestionCards();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuestionCards;
}
