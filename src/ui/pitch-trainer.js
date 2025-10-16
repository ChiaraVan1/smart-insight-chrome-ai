// pitch-trainer.js - Pitch 练习器
// P1-4: 为 Networking 场景提供互动式 Pitch 练习

class PitchTrainer {
  constructor() {
    this.timer = null;
    this.startTime = null;
    this.duration = 120; // 2分钟
    this.isRecording = false;
    this.transcript = '';
  }
  
  /**
   * 生成练习器HTML
   * @param {string} pitchScript - AI生成的Pitch脚本
   * @param {Object} targetData - 目标人物/公司数据
   */
  generateTrainerHTML(pitchScript, targetData) {
    const keywords = this.extractKeywords(pitchScript, targetData);
    
    return `
      <div class="pitch-trainer">
        <div class="trainer-header">
          <h3>🎤 Pitch 练习器</h3>
          <p class="trainer-desc">练习你的2分钟自我介绍，确保流畅自然</p>
        </div>
        
        <div class="pitch-script-section">
          <h4>📝 参考脚本</h4>
          <div class="pitch-script">
            ${this.escapeHtml(pitchScript)}
          </div>
          <button class="copy-script-btn" onclick="pitchTrainer.copyScript()">
            📋 复制脚本
          </button>
        </div>
        
        <div class="keywords-section">
          <h4>🎯 必提关键词</h4>
          <div class="keywords-list">
            ${keywords.map(kw => `
              <span class="keyword-chip" data-keyword="${kw}">
                ${kw}
              </span>
            `).join('')}
          </div>
          <p class="keywords-hint">练习时确保提到这些关键词</p>
        </div>
        
        <div class="timer-section">
          <div class="timer-display">
            <span class="time-left" id="pitch-timer">2:00</span>
            <span class="timer-label">剩余时间</span>
          </div>
          <div class="timer-controls">
            <button class="start-btn" id="start-pitch-btn" onclick="pitchTrainer.startPractice()">
              ▶️ 开始练习
            </button>
            <button class="stop-btn hidden" id="stop-pitch-btn" onclick="pitchTrainer.stopPractice()">
              ⏹️ 停止
            </button>
            <button class="reset-btn" id="reset-pitch-btn" onclick="pitchTrainer.resetPractice()">
              🔄 重置
            </button>
          </div>
        </div>
        
        <div class="practice-tips">
          <h4>💡 练习技巧</h4>
          <ul>
            <li><strong>语速控制</strong>：不要太快，保持自然节奏</li>
            <li><strong>眼神交流</strong>：想象对方在你面前，保持眼神接触</li>
            <li><strong>关键信息</strong>：确保提到背景、技能、兴趣点</li>
            <li><strong>自然结尾</strong>：以问题或请求结束，引导对话</li>
          </ul>
        </div>
        
        <div class="feedback-section hidden" id="pitch-feedback">
          <h4>📊 练习反馈</h4>
          <div class="feedback-content"></div>
        </div>
      </div>
      
      <style>
        .pitch-trainer {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin: 16px 0;
        }
        
        .trainer-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }
        
        .trainer-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: #1f2937;
        }
        
        .trainer-desc {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        
        .pitch-script-section {
          margin-bottom: 24px;
        }
        
        .pitch-script-section h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #1f2937;
        }
        
        .pitch-script {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
          font-size: 14px;
          line-height: 1.8;
          color: #374151;
          margin-bottom: 12px;
          white-space: pre-wrap;
        }
        
        .copy-script-btn {
          width: 100%;
          padding: 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .copy-script-btn:hover {
          background: #2563eb;
        }
        
        .keywords-section {
          margin-bottom: 24px;
          padding: 16px;
          background: #fef3c7;
          border-radius: 8px;
          border-left: 3px solid #f59e0b;
        }
        
        .keywords-section h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #92400e;
        }
        
        .keywords-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .keyword-chip {
          padding: 6px 12px;
          background: white;
          border: 2px solid #fbbf24;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 600;
          color: #92400e;
          transition: all 0.2s;
        }
        
        .keyword-chip.mentioned {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }
        
        .keywords-hint {
          margin: 0;
          font-size: 12px;
          color: #92400e;
        }
        
        .timer-section {
          margin-bottom: 24px;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          text-align: center;
        }
        
        .timer-display {
          margin-bottom: 20px;
        }
        
        .time-left {
          display: block;
          font-size: 48px;
          font-weight: 700;
          color: white;
          font-family: 'Courier New', monospace;
        }
        
        .timer-label {
          display: block;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 8px;
        }
        
        .timer-controls {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .timer-controls button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .start-btn {
          background: #10b981;
          color: white;
        }
        
        .start-btn:hover {
          background: #059669;
          transform: translateY(-2px);
        }
        
        .stop-btn {
          background: #ef4444;
          color: white;
        }
        
        .stop-btn:hover {
          background: #dc2626;
        }
        
        .reset-btn {
          background: white;
          color: #667eea;
        }
        
        .reset-btn:hover {
          background: #f3f4f6;
        }
        
        .hidden {
          display: none !important;
        }
        
        .practice-tips {
          margin-bottom: 24px;
          padding: 16px;
          background: #eff6ff;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }
        
        .practice-tips h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #1e40af;
        }
        
        .practice-tips ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .practice-tips li {
          color: #1e40af;
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 8px;
        }
        
        .practice-tips strong {
          color: #1e3a8a;
        }
        
        .feedback-section {
          padding: 16px;
          background: #f0fdf4;
          border-radius: 8px;
          border-left: 3px solid #10b981;
        }
        
        .feedback-section h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #065f46;
        }
        
        .feedback-content {
          font-size: 14px;
          line-height: 1.6;
          color: #065f46;
        }
        
        .feedback-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .feedback-icon {
          font-size: 18px;
        }
      </style>
    `;
  }
  
  /**
   * 从脚本中提取关键词
   */
  extractKeywords(script, targetData) {
    const keywords = [];
    
    // 添加目标公司/人物名称
    if (targetData?.basic_info?.name) {
      keywords.push(targetData.basic_info.name);
    }
    if (targetData?.company) {
      keywords.push(targetData.company);
    }
    
    // 从脚本中提取专有名词（大写开头的词）
    const matches = script.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (matches) {
      matches.forEach(match => {
        if (match.length > 2 && !keywords.includes(match)) {
          keywords.push(match);
        }
      });
    }
    
    // 限制数量
    return keywords.slice(0, 5);
  }
  
  /**
   * 开始练习
   */
  startPractice() {
    this.startTime = Date.now();
    this.isRecording = true;
    
    // 更新UI
    document.getElementById('start-pitch-btn').classList.add('hidden');
    document.getElementById('stop-pitch-btn').classList.remove('hidden');
    document.getElementById('pitch-feedback').classList.add('hidden');
    
    // 启动倒计时
    this.timer = setInterval(() => {
      this.updateTimer();
    }, 100);
  }
  
  /**
   * 停止练习
   */
  stopPractice() {
    this.isRecording = false;
    clearInterval(this.timer);
    
    // 更新UI
    document.getElementById('start-pitch-btn').classList.remove('hidden');
    document.getElementById('stop-pitch-btn').classList.add('hidden');
    
    // 显示反馈
    this.showFeedback();
  }
  
  /**
   * 重置练习
   */
  resetPractice() {
    this.stopPractice();
    this.startTime = null;
    this.transcript = '';
    
    // 重置计时器显示
    document.getElementById('pitch-timer').textContent = '2:00';
    document.getElementById('pitch-feedback').classList.add('hidden');
    
    // 重置关键词状态
    document.querySelectorAll('.keyword-chip').forEach(chip => {
      chip.classList.remove('mentioned');
    });
  }
  
  /**
   * 更新计时器
   */
  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const remaining = Math.max(0, this.duration - elapsed);
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    document.getElementById('pitch-timer').textContent = 
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // 时间到自动停止
    if (remaining === 0) {
      this.stopPractice();
    }
  }
  
  /**
   * 显示反馈
   */
  showFeedback() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const feedbackEl = document.getElementById('pitch-feedback');
    const contentEl = feedbackEl.querySelector('.feedback-content');
    
    let feedback = '';
    
    // 时间反馈
    if (elapsed < 90) {
      feedback += `<div class="feedback-item"><span class="feedback-icon">⚠️</span><span>练习时间较短（${elapsed}秒），建议充分利用2分钟</span></div>`;
    } else if (elapsed > 130) {
      feedback += `<div class="feedback-item"><span class="feedback-icon">⚠️</span><span>超时了（${elapsed}秒），注意控制在2分钟内</span></div>`;
    } else {
      feedback += `<div class="feedback-item"><span class="feedback-icon">✅</span><span>时间控制很好（${elapsed}秒）</span></div>`;
    }
    
    // 鼓励语
    feedback += `<div class="feedback-item"><span class="feedback-icon">💪</span><span>继续练习，熟能生巧！</span></div>`;
    
    contentEl.innerHTML = feedback;
    feedbackEl.classList.remove('hidden');
  }
  
  /**
   * 复制脚本
   */
  copyScript() {
    const scriptEl = document.querySelector('.pitch-script');
    const text = scriptEl.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector('.copy-script-btn');
      const originalText = btn.textContent;
      btn.textContent = '✅ 已复制';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
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
const pitchTrainer = new PitchTrainer();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PitchTrainer;
}
