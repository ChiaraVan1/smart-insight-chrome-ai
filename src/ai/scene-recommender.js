// scene-recommender.js - 场景智能推荐系统
// P0-2: 根据LinkedIn数据智能推荐Coffee Chat或Networking场景

class SceneRecommender {
  
  /**
   * 推荐最适合的场景
   * @param {Object} linkedInData - LinkedIn数据
   * @returns {Object} 推荐结果
   */
  recommendScene(linkedInData) {
    const signals = this.analyzeSignals(linkedInData);
    
    return {
      recommended: signals.bestScene,
      confidence: signals.confidence,
      reason: signals.reason,
      alternatives: signals.alternatives,
      scores: signals.scores
    };
  }
  
  /**
   * 分析各种信号并计算分数
   * @param {Object} data - LinkedIn数据
   * @returns {Object} 分析结果
   */
  analyzeSignals(data) {
    let coffeeScore = 0;
    let networkingScore = 0;
    let reasons = [];
    
    // Signal 1: 连接程度 (权重: 高)
    const connectionLevel = this.detectConnectionLevel(data);
    if (connectionLevel === '1st') {
      coffeeScore += 3;
      reasons.push('✅ 已经是1度连接，适合深度交流');
    } else if (connectionLevel === '2nd' || connectionLevel === '3rd') {
      networkingScore += 2;
      reasons.push('🤝 还不是直接连接，先建立联系');
    } else {
      networkingScore += 3;
      reasons.push('🆕 尚未连接，适合快速建立印象');
    }
    
    // Signal 2: 页面类型 (权重: 中)
    if (data.metadata?.profile_url?.includes('/company/')) {
      networkingScore += 3;
      reasons.push('🏢 公司页面，适合Career Fair准备');
    } else if (data.metadata?.profile_url?.includes('/in/')) {
      coffeeScore += 2;
      reasons.push('👤 个人资料页面，可深入了解');
    }
    
    // Signal 3: 职位级别 (权重: 中)
    const seniorityLevel = this.detectSeniorityLevel(data);
    if (seniorityLevel === 'senior' || seniorityLevel === 'director' || seniorityLevel === 'vp') {
      coffeeScore += 2;
      reasons.push('🎯 对方是资深人士，适合请教职业建议');
    } else if (seniorityLevel === 'entry' || seniorityLevel === 'junior') {
      networkingScore += 1;
      reasons.push('👥 同级别人士，适合快速建立联系');
    }
    
    // Signal 4: 共同点 (权重: 高)
    const commonalities = this.detectCommonalities(data);
    if (commonalities.count > 0) {
      coffeeScore += 2;
      const items = [];
      if (commonalities.sameSchool) items.push('校友');
      if (commonalities.sameCompany) items.push('前同事');
      if (commonalities.mutualConnections > 0) items.push(`${commonalities.mutualConnections}个共同好友`);
      reasons.push(`🔗 有共同点(${items.join('、')})，容易建立信任`);
    } else {
      networkingScore += 1;
    }
    
    // Signal 5: 工作经历丰富度 (权重: 低)
    const experienceCount = data.experiences?.length || 0;
    if (experienceCount >= 3) {
      coffeeScore += 1;
      reasons.push('📚 工作经历丰富，有很多可以请教的');
    }
    
    // Signal 6: 最近活跃度 (权重: 低)
    const hasRecentActivity = data.recent_activity && data.recent_activity.length > 0;
    if (hasRecentActivity) {
      coffeeScore += 1;
      reasons.push('💬 最近有活跃动态，可作为话题');
    }
    
    // Signal 7: 是否有详细的个人简介 (权重: 低)
    const hasDetailedInfo = data.basic_info?.headline && data.basic_info?.headline.length > 20;
    if (hasDetailedInfo) {
      coffeeScore += 1;
    }
    
    // 决策逻辑
    const totalScore = coffeeScore + networkingScore;
    const bestScene = coffeeScore > networkingScore ? 'coffee-chat' : 'networking';
    
    // 计算置信度 (0-100)
    let confidence;
    if (totalScore === 0) {
      confidence = 50; // 无数据时默认50%
    } else {
      const scoreDiff = Math.abs(coffeeScore - networkingScore);
      confidence = Math.min(50 + (scoreDiff / totalScore) * 50, 95);
    }
    
    // 四舍五入到整数
    confidence = Math.round(confidence);
    
    return {
      bestScene,
      confidence,
      reason: reasons.join('；'),
      alternatives: bestScene === 'coffee-chat' ? ['networking'] : ['coffee-chat'],
      scores: { 
        coffeeScore, 
        networkingScore,
        total: totalScore
      }
    };
  }
  
  /**
   * 检测连接程度
   */
  detectConnectionLevel(data) {
    const text = JSON.stringify(data).toLowerCase();
    
    if (text.includes('1st') || text.includes('1度')) return '1st';
    if (text.includes('2nd') || text.includes('2度')) return '2nd';
    if (text.includes('3rd') || text.includes('3度')) return '3rd';
    
    // 如果有共同连接，可能是2度或3度
    if (data.commonalities?.mutual_connections > 0) return '2nd';
    
    return 'unknown';
  }
  
  /**
   * 检测职位级别
   */
  detectSeniorityLevel(data) {
    const title = (data.basic_info?.headline || data.current_position?.title || '').toLowerCase();
    
    // VP/C-level
    if (title.match(/\b(vp|vice president|cto|ceo|cfo|coo|chief)\b/i)) {
      return 'vp';
    }
    
    // Director
    if (title.match(/\b(director|head of)\b/i)) {
      return 'director';
    }
    
    // Senior
    if (title.match(/\b(senior|sr\.|lead|principal|staff)\b/i)) {
      return 'senior';
    }
    
    // Mid-level
    if (title.match(/\b(engineer|analyst|manager|specialist)\b/i) && !title.includes('senior')) {
      return 'mid';
    }
    
    // Entry/Junior
    if (title.match(/\b(junior|jr\.|intern|associate|assistant)\b/i)) {
      return 'entry';
    }
    
    return 'unknown';
  }
  
  /**
   * 检测共同点
   */
  detectCommonalities(data) {
    const result = {
      count: 0,
      sameSchool: false,
      sameCompany: false,
      mutualConnections: 0
    };
    
    // 检查共同学校
    if (data.commonalities?.visible_schools && data.commonalities.visible_schools.length > 0) {
      result.sameSchool = true;
      result.count++;
    }
    
    // 检查共同公司
    if (data.commonalities?.visible_companies && data.commonalities.visible_companies.length > 0) {
      result.sameCompany = true;
      result.count++;
    }
    
    // 检查共同连接
    if (data.commonalities?.mutual_connections) {
      result.mutualConnections = data.commonalities.mutual_connections;
      if (result.mutualConnections > 0) {
        result.count++;
      }
    }
    
    return result;
  }
  
  /**
   * 生成推荐卡片HTML - 简洁版，只显示按钮
   */
  generateRecommendationCard(recommendation) {
    const sceneInfo = {
      'coffee-chat': {
        icon: '☕',
        title: 'Coffee Chat',
        color: '#8b5cf6'
      },
      'networking': {
        icon: '🤝',
        title: 'Networking',
        color: '#f59e0b'
      }
    };
    
    const recommended = sceneInfo[recommendation.recommended];
    const alternative = sceneInfo[recommendation.alternatives[0]];
    
    return `
      <div class="scene-selection-compact">
        <button class="scene-option-btn" data-scene="${recommendation.recommended}" style="background: ${recommended.color}">
          <span class="scene-icon">${recommended.icon}</span>
          <span class="scene-title">${recommended.title}</span>
        </button>
        
        <button class="scene-option-btn" data-scene="${recommendation.alternatives[0]}" style="background: ${alternative.color}">
          <span class="scene-icon">${alternative.icon}</span>
          <span class="scene-title">${alternative.title}</span>
        </button>
      </div>
      
      <style>
        .scene-selection-compact {
          display: flex;
          gap: 12px;
          padding: 8px 0;
          justify-content: center;
        }
        
        .scene-option-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .scene-option-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }
        
        .scene-option-btn:active {
          transform: translateY(0);
        }
        
        .scene-option-btn .scene-icon {
          font-size: 20px;
        }
        
        .scene-option-btn .scene-title {
          font-size: 14px;
        }
      </style>
    `;
  }
  
  /**
   * 根据置信度获取颜色
   */
  getConfidenceColor(confidence) {
    if (confidence >= 80) return '#10b981'; // 绿色
    if (confidence >= 60) return '#3b82f6'; // 蓝色
    if (confidence >= 40) return '#f59e0b'; // 橙色
    return '#ef4444'; // 红色
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SceneRecommender;
}
