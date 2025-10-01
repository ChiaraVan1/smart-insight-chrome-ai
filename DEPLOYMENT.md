# 部署指南

本文档详细说明如何部署和发布SmartInsight Career Assistant Chrome扩展。

## 📋 部署前检查清单

### 1. 代码完整性检查
- [ ] 所有源文件已创建并位于正确位置
- [ ] manifest.json配置正确
- [ ] 所有依赖的资源文件存在
- [ ] 图标文件已准备（16x16, 32x32, 48x48, 128x128）

### 2. 功能测试
- [ ] LinkedIn个人资料分析功能正常
- [ ] 公司分析功能正常
- [ ] 侧边栏UI显示正确
- [ ] 配置页面功能完整
- [ ] API调用正常工作
- [ ] 数据存储和缓存功能正常

### 3. 安全检查
- [ ] 没有硬编码的API密钥
- [ ] 所有外部请求使用HTTPS
- [ ] 用户数据仅本地存储
- [ ] 权限请求最小化

## 🚀 本地开发部署

### 1. 准备开发环境
```bash
# 克隆或下载项目
cd smart-insight-chrome-ai

# 检查文件结构
ls -la
```

### 2. 创建图标文件
在 `images/` 目录下创建以下图标文件：
- `icon16.png` (16x16像素)
- `icon32.png` (32x32像素)  
- `icon48.png` (48x48像素)
- `icon128.png` (128x128像素)

### 3. 加载到Chrome
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录
6. 确认扩展已成功加载

### 4. 配置API密钥
1. 右键点击扩展图标
2. 选择"选项"
3. 在配置页面输入API密钥：
   - Anthropic API Key (必需)
   - OpenAI API Key (可选)
   - News API Key (可选)
4. 点击"测试连接"验证配置
5. 保存设置

## 🏪 Chrome Web Store发布

### 1. 准备发布包
```bash
# 创建发布包（排除开发文件）
zip -r smart-insight-career-assistant-v2.0.0.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "*.md" \
  -x "package.json" \
  -x "*.zip"
```

### 2. 创建开发者账号
1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 使用Google账号登录
3. 支付$5一次性开发者注册费

### 3. 上传扩展
1. 点击"新增项目"
2. 上传准备好的zip文件
3. 填写扩展信息：

#### 基本信息
- **名称**: SmartInsight Career Assistant
- **摘要**: AI-powered career assistant for LinkedIn analysis and interview prep
- **详细说明**:
```
SmartInsight Career Assistant is an AI-powered Chrome extension designed to help job seekers and professionals excel in their career journey.

🎯 KEY FEATURES:
• LinkedIn Profile Analysis - Extract and analyze key information from LinkedIn profiles
• Smart Icebreakers - Generate personalized conversation starters
• Interview Questions - Get targeted questions based on profile analysis  
• Company Research - Comprehensive company analysis with recent news and insights
• Cost-Effective - Smart caching reduces API costs
• Privacy-First - All data processed locally

🚀 HOW IT WORKS:
1. Visit any LinkedIn profile or company page
2. Click the analysis button that appears
3. Get instant AI-powered insights in the sidebar
4. Use the generated content for networking, interviews, or research

💡 PERFECT FOR:
• Job seekers preparing for interviews
• Sales professionals researching prospects  
• Recruiters analyzing candidates
• Anyone looking to network more effectively

🔒 PRIVACY & SECURITY:
• All data processed locally in your browser
• No data sent to third-party servers
• API keys stored securely
• Optional privacy mode available

Requires API key from Anthropic (Claude) or OpenAI for AI functionality.
```

#### 分类和标签
- **类别**: 生产力工具
- **标签**: career, linkedin, ai, interview, job-search, networking, productivity

#### 隐私政策
创建隐私政策页面并提供URL，内容包括：
- 数据收集说明
- 数据使用方式
- 第三方服务说明
- 用户权利

### 4. 提供截图和图标
准备以下素材：
- **图标**: 128x128像素的高质量图标
- **截图**: 1280x800像素的功能截图（至少1张，最多5张）
- **宣传图片**: 440x280像素的宣传图（可选）

### 5. 审核和发布
1. 提交审核（通常需要1-3个工作日）
2. 等待Google审核团队反馈
3. 如有问题，根据反馈修改并重新提交
4. 审核通过后自动发布

## 🔄 版本更新流程

### 1. 准备更新
```bash
# 更新版本号
# 在manifest.json中修改version字段
"version": "2.0.1"

# 记录更新日志
echo "v2.0.1 - Bug fixes and performance improvements" >> CHANGELOG.md
```

### 2. 测试更新
1. 在本地完整测试所有功能
2. 确保向后兼容性
3. 验证数据迁移（如有需要）

### 3. 发布更新
1. 创建新的zip包
2. 在Chrome Web Store Developer Dashboard上传
3. 更新版本说明
4. 提交审核

## 🛠️ 故障排除

### 常见部署问题

**问题1: 扩展无法加载**
```
解决方案:
1. 检查manifest.json语法是否正确
2. 确保所有引用的文件都存在
3. 检查文件路径是否正确
4. 查看Chrome扩展页面的错误信息
```

**问题2: Content Script注入失败**
```
解决方案:
1. 检查host_permissions配置
2. 确保content_scripts的matches模式正确
3. 验证目标网站的CSP策略
4. 检查脚本文件是否存在语法错误
```

**问题3: API调用失败**
```
解决方案:
1. 验证API密钥是否正确
2. 检查网络连接
3. 确认API配额是否充足
4. 查看浏览器控制台错误信息
```

**问题4: 存储权限问题**
```
解决方案:
1. 确认manifest.json中包含"storage"权限
2. 检查IndexedDB是否被浏览器策略阻止
3. 验证存储配额是否充足
```

### 调试技巧

1. **启用开发者模式**
   - 在配置页面启用"开发者模式"
   - 查看详细的控制台日志

2. **使用Chrome DevTools**
   ```javascript
   // 在background.js中添加调试日志
   console.log('Debug info:', data);
   
   // 在content script中调试
   console.log('Content script loaded');
   ```

3. **检查扩展状态**
   - 访问 `chrome://extensions/`
   - 点击扩展的"详细信息"
   - 查看"检查视图"部分的链接

## 📊 发布后监控

### 1. 用户反馈监控
- 定期检查Chrome Web Store的用户评价
- 关注GitHub Issues（如果开源）
- 监控支持邮箱

### 2. 性能监控
```javascript
// 在代码中添加性能监控
const startTime = performance.now();
// ... 执行操作
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime} milliseconds`);
```

### 3. 错误监控
```javascript
// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // 可以发送到错误监控服务
});
```

### 4. 使用统计
- 监控API调用频率
- 分析用户行为模式
- 跟踪功能使用情况

## 🔐 安全最佳实践

### 1. 代码安全
- 定期更新依赖
- 避免使用eval()
- 验证所有用户输入
- 使用Content Security Policy

### 2. 数据安全
- 加密敏感数据
- 最小化数据收集
- 定期清理过期数据
- 提供数据导出功能

### 3. API安全
- 使用HTTPS
- 实施速率限制
- 验证API响应
- 处理API错误

## 📈 营销和推广

### 1. 应用商店优化(ASO)
- 优化标题和描述
- 使用相关关键词
- 提供高质量截图
- 鼓励用户评价

### 2. 社交媒体推广
- 在LinkedIn分享
- 发布到相关社区
- 创建演示视频
- 写技术博客

### 3. 用户获取
- 提供免费试用
- 创建使用教程
- 参与相关论坛
- 与影响者合作

---

**注意**: 本部署指南基于Chrome扩展的最佳实践。在实际部署前，请确保遵守所有相关的法律法规和平台政策。
