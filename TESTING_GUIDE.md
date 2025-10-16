# 🧪 SmartInsight Testing Guide

> **Comprehensive testing and debugging guide for SmartInsight Career Assistant**

---

## 📋 Table of Contents

- [Quick Start Testing](#-quick-start-testing)
- [Prerequisites](#-prerequisites)
- [Complete User Flow](#-complete-user-flow)
- [Step-by-Step Testing](#-step-by-step-testing)
- [Troubleshooting](#-troubleshooting)
- [Success Criteria](#-success-criteria)
- [Debug Commands](#-debug-commands)
- [Testing Checklist](#-testing-checklist)

---

## 🚀 Quick Start Testing

### 5-Minute Smoke Test

1. **Navigate** to test profile: https://www.linkedin.com/in/andrewyng/
2. **Look for** floating import button (bottom-right corner)
3. **Click** the "✨ 导入" button
4. **Wait** for Side Panel to open (should be automatic)
5. **Verify** AI generates personalized questions with real data

**Expected Result**: Questions should mention "Andrew Ng", "DeepLearning.AI", and "Founder" — NOT generic placeholders.

---

## 📋 Prerequisites

### Browser Setup

| Requirement | Details |
|-------------|---------||
| **Browser** | Chrome Canary 127+ |
| **Flags** | Enable at `chrome://flags/`:<br>• `#optimization-guide-on-device-model`<br>• `#prompt-api-for-gemini-nano` |
| **Extension** | Loaded in Developer Mode |
| **LinkedIn** | Valid LinkedIn account (for testing) |

### Verify Chrome AI

```javascript
// Run in Console (any page)
if ('ai' in self) {
  console.log('✅ Chrome AI API available');
} else {
  console.log('❌ Chrome AI not available - check flags');
}
```

---

## 🔄 Complete User Flow

```
1. Visit LinkedIn Profile
   ↓
2. Floating Button Appears ("✨ 导入")
   ↓
3. Click Import Button
   ↓
4. Side Panel Opens Automatically
   ↓
5. Data Import Starts (Background)
   ↓
6. AI Analyzes Profile (10-30s)
   ↓
7. Scenario Recommended
   ↓
8. Timeline Questions Display
   ↓
9. User Interacts with Questions
```

### Flow Timing Expectations

| Step | Expected Time | Key Indicator |
|------|---------------|---------------|
| Button Appears | < 3s | Console: `🎯 智能导入检测器已启动` |
| Data Import | 1-2s | Console: `📥 自动导入 LinkedIn 数据...` |
| AI Generation | 10-30s | Console: `🎯 生成 coffee-chat 场景建议...` |
| Timeline Render | < 1s | Questions displayed with segments |

---

## 🔍 Step-by-Step Testing

### Test 1: Floating Button Detection

**Objective**: Verify the import button appears on LinkedIn profile pages.

#### Test Steps

1. Navigate to: `https://www.linkedin.com/in/andrewyng/`
2. Wait 3 seconds for page to fully load
3. Look for floating button in bottom-right corner

#### Expected Results

- ✅ Blue floating button with text "✨ 导入"
- ✅ Button has hover effect
- ✅ Console shows: `🎯 智能导入检测器已启动`
- ✅ Console shows: `✅ 检测到 LinkedIn 个人主页`

#### Debug Commands

```javascript
// Check if content script is loaded
console.log('Content script loaded:', typeof window.smartInsightImporter !== 'undefined');

// Check URL detection
const isLinkedInProfile = window.location.href.includes('linkedin.com/in/');
console.log('LinkedIn profile detected:', isLinkedInProfile);
```

#### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Button not appearing | URL pattern mismatch | Check `manifest.json` content_scripts matches |
| Button hidden | CSS z-index conflict | Inspect element, adjust z-index |
| Script not loading | Extension not active | Reload extension at `chrome://extensions/` |

---

### Test 2: Data Import

**Objective**: Verify profile data is correctly extracted and imported.

#### Test Steps

1. Click the floating "✨ 导入" button
2. Observe Side Panel opening
3. Check Console for import messages

#### Expected Results

- ✅ Side Panel opens automatically
- ✅ Console shows: `📥 自动导入 LinkedIn 数据...`
- ✅ Console shows imported data structure
- ✅ No error messages

#### Manual Data Check

```javascript
// Run in LinkedIn page Console
chrome.runtime.sendMessage({
  action: 'GET_LINKEDIN_PROFILE_DATA'
}, (response) => {
  console.log('Import Status:', response.status);
  console.log('Profile Data:', response.data);
  
  // Verify data completeness
  if (response.data) {
    console.log('Name:', response.data.name);
    console.log('Title:', response.data.title);
    console.log('Company:', response.data.company);
    console.log('Experience:', response.data.experience?.length || 0, 'entries');
  }
});
```

#### Data Validation Checklist

- [ ] `name` - Full name of the person
- [ ] `title` - Current job title
- [ ] `company` - Current company
- [ ] `experience[]` - Array of work experiences
- [ ] `education[]` - Array of education entries
- [ ] `skills[]` - Array of skills

---

### Test 3: AI Generation

**Objective**: Verify Chrome AI generates personalized questions.

#### Test Steps

1. After data import, wait for AI processing
2. Monitor Console in both Side Panel and Background contexts
3. Observe loading indicators

#### Expected Results

- ✅ Console shows: `🎯 生成 coffee-chat 场景建议...`
- ✅ Loading spinner appears in Side Panel
- ✅ AI completes within 30 seconds (max 120s)
- ✅ Questions appear in timeline format

#### Monitor AI Process

```javascript
// Run in Background Service Worker Console
// (chrome://extensions/ → click "service worker" link)

// Check AI initialization
console.log('AI Status:', modelStatus);
console.log('AI Capabilities:', aiCapabilities);

// Test AI directly
chrome.runtime.sendMessage({
  action: 'SMOKE_TEST'
}, (response) => {
  console.log('AI Test Result:', response);
});
```

#### AI Response Validation

```javascript
// Run in Side Panel Console after AI generation

// Verify personalization
const hasRealName = lastAIResponse.includes('Andrew Ng');
const hasRealCompany = lastAIResponse.includes('DeepLearning.AI');
const hasPlaceholders = /\[.*?\]/.test(lastAIResponse);

console.log('Contains real name:', hasRealName);
console.log('Contains real company:', hasRealCompany);
console.log('Contains placeholders:', hasPlaceholders); // Should be false
```

#### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `OFFSCREEN_TIMEOUT` | AI taking too long | Wait full 120s, check Chrome AI is downloaded |
| `Chrome AI 未就绪` | AI not initialized | Check flags enabled, restart Chrome |
| Generic questions | Data not passed to AI | Verify `targetData` in prompt |
| Empty response | Model error | Check Background Console for errors |

---

### Test 4: Timeline Display

**Objective**: Verify questions are parsed and displayed correctly.

#### Test Steps

1. After AI generation completes
2. Observe timeline rendering
3. Test interactive features

#### Expected Results

- ✅ Questions grouped by time segments
- ✅ Each segment has emoji icon and time label
- ✅ Questions are bullet points with proper formatting
- ✅ Action buttons appear (favorite, note, copy, mark used)
- ✅ Follow-up email template displayed

#### Timeline Structure Check

```javascript
// Run in Side Panel Console

// Check parsed timeline data
const timelineData = AppState.currentChat?.timelineData;
console.log('Timeline Sections:', timelineData?.sections?.length);

timelineData?.sections?.forEach((section, i) => {
  console.log(`Section ${i + 1}:`, section.title);
  console.log('  Questions:', section.questions.length);
  console.log('  Time:', section.time);
});
```

#### Interactive Features Test

- [ ] **Favorite** (⭐) - Toggles star icon
- [ ] **Note** (📝) - Opens note input field
- [ ] **Copy** (📋) - Copies question to clipboard
- [ ] **Mark Used** (✓) - Grays out question

---

## 🐛 Troubleshooting

### Common Issues Quick Reference

| Symptom | Possible Causes | Quick Fix |
|---------|----------------|------------|
| **No floating button** | • URL not matched<br>• Content script failed | 1. Refresh page<br>2. Check Console for errors<br>3. Reload extension |
| **Import fails** | • LinkedIn DOM changed<br>• Permissions missing | 1. Check response in Console<br>2. Verify manifest permissions<br>3. Update selectors |
| **AI timeout** | • Model not downloaded<br>• Slow device | 1. Wait full 120s<br>2. Check Chrome AI flags<br>3. Restart Chrome |
| **Generic questions** | • Data not imported<br>• Prompt issue | 1. Re-import profile<br>2. Check imported data<br>3. Regenerate |
| **Timeline broken** | • Parser error<br>• Format mismatch | 1. Check Console errors<br>2. Inspect AI response<br>3. Reload panel |

### Detailed Troubleshooting

#### Issue 1: Floating Button Not Appearing

**Symptoms**:
- No import button visible on LinkedIn profile page
- Console shows no content script messages

**Diagnostic Steps**:
```javascript
// Run in LinkedIn page Console
console.log('URL:', window.location.href);
console.log('Script loaded:', typeof window.smartInsightImporter);
```

**Solutions**:
1. **Verify URL**: Ensure you're on a profile page (e.g., `/in/username/`)
2. **Reload Extension**: Go to `chrome://extensions/` and click refresh
3. **Check Manifest**: Verify `content_scripts.matches` includes LinkedIn URLs
4. **Clear Cache**: Hard refresh the page (Ctrl+Shift+R)

---

#### Issue 2: Data Import Fails

**Symptoms**:
- Side Panel opens but shows no data
- Console shows import errors
- Response status is not 'SUCCESS'

**Diagnostic Steps**:
```javascript
// Test data extraction manually
chrome.runtime.sendMessage({
  action: 'GET_LINKEDIN_PROFILE_DATA'
}, (response) => {
  console.log('Status:', response.status);
  console.log('Data:', response.data);
  console.log('Error:', response.error);
});
```

**Solutions**:
1. **LinkedIn Changed**: Update selectors in `content-script.js`
2. **Incomplete Profile**: Test with profiles that have full information
3. **Permission Issue**: Check `host_permissions` in manifest
4. **Script Error**: Look for JavaScript errors in Console

---

#### Issue 3: AI Generation Timeout

**Symptoms**:
- Loading spinner runs for > 30 seconds
- Console shows `OFFSCREEN_TIMEOUT` error
- No questions appear

**Diagnostic Steps**:
```javascript
// Check AI status in Background Console
chrome.runtime.sendMessage({
  action: 'SMOKE_TEST'
}, (response) => {
  console.log('AI Available:', response.ok);
  console.log('Model Status:', response.status);
});
```

**Solutions**:
1. **Wait Longer**: Timeout is set to 120s, be patient on first run
2. **Check Flags**: Verify Chrome AI flags are enabled at `chrome://flags/`
3. **Download Model**: First use requires downloading Gemini Nano (~1.5GB)
4. **Restart Chrome**: Close and reopen Chrome Canary
5. **Check Version**: Ensure Chrome Canary 127+

---

#### Issue 4: Generic Questions (No Personalization)

**Symptoms**:
- Questions contain placeholders like `[Company Name]`
- No real names or companies mentioned
- Questions are too generic

**Diagnostic Steps**:
```javascript
// Verify imported data
chrome.storage.local.get(['currentTarget'], (result) => {
  console.log('Target Data:', result.currentTarget);
  console.log('Has Name:', !!result.currentTarget?.name);
  console.log('Has Company:', !!result.currentTarget?.company);
});
```

**Solutions**:
1. **Re-import**: Click import button again to refresh data
2. **Check Data**: Verify profile has complete information on LinkedIn
3. **Regenerate**: Try generating questions again
4. **Update Prompt**: Check prompt template includes `{targetData}`

---

## ✅ Success Criteria

### Coffee Chat Scenario

#### Minimum Requirements

- [ ] **3+ time segments** (Icebreaker, Industry Insights, Career Advice)
- [ ] **8+ questions total** (at least 2 per segment)
- [ ] **Real names** mentioned (e.g., "Andrew Ng")
- [ ] **Real companies** mentioned (e.g., "DeepLearning.AI", "Google")
- [ ] **Real roles** mentioned (e.g., "Founder")
- [ ] **No placeholders** (no `[Company]`, `[Name]`, etc.)
- [ ] **Follow-up email** included with personalization

#### Example Output

```
━━━ 🤝 Icebreaker (0-15 min) ━━━

• "I noticed you moved from Google to DeepLearning.AI. What motivated that transition?"
• "How does your role as Founder at DeepLearning.AI differ from your previous position at Google?"
• "What's been the most surprising aspect of building DeepLearning.AI?"

━━━ 💡 Industry Insights (15-35 min) ━━━

• "From DeepLearning.AI's perspective, what's the biggest challenge in AI education right now?"
• "How is DeepLearning.AI positioning itself differently from traditional online learning platforms?"
• "What trends in AI do you think will be most important in the next 2-3 years?"

━━━ 🎯 Career Advice (35-45 min) ━━━

• "For someone wanting to join DeepLearning.AI, what's the most important preparation?"
• "What skills do you think are most valuable for AI practitioners to develop right now?"
• "How do you recommend balancing theoretical knowledge with practical experience?"

━━━ 📝 Follow-up Email ━━━

Subject: Thank you for the Coffee Chat

Dear Andrew Ng,

Thank you for taking the time to meet with me today. Your insights about your 
experience at DeepLearning.AI and the transition from Google were invaluable.

Your perspective on AI education and the importance of practical experience gave 
me new ideas about my own career development.

I'm particularly excited about the direction DeepLearning.AI is taking with 
accessible AI education.

Looking forward to staying in touch!

Best regards,
[Your Name]
```

#### Validation Checklist

- ✅ Contains "Andrew Ng" (real name)
- ✅ Contains "DeepLearning.AI" (real company)
- ✅ Contains "Google" (previous company)
- ✅ Contains "Founder" (real role)
- ❌ No `[Company Name]` placeholders
- ❌ No `[Project]` placeholders
- ❌ No generic `[Name]` placeholders

---

### Networking Scenario

#### Minimum Requirements

- [ ] **Elevator pitch** (2-minute introduction)
- [ ] **5+ smart questions** about their work
- [ ] **Contact exchange script**
- [ ] **Follow-up email template**
- [ ] **Real data** (names, companies, roles)
- [ ] **No placeholders**

#### Example Output

```
━━━ 🎤 Elevator Pitch (2 min) ━━━

"Hi, I'm [Your Name]. I'm really interested in AI education and have been 
following DeepLearning.AI's work.

I noticed you're the Founder at DeepLearning.AI and previously worked at Google. 
I'm particularly impressed by how DeepLearning.AI has made AI education accessible 
to millions.

I'm currently [your background] and exploring opportunities in AI education. I'd 
love to learn more about your experience building DeepLearning.AI and any advice 
you might have."

━━━ 💬 Smart Questions ━━━

• "I saw DeepLearning.AI recently launched new AI courses. Can you share more about that direction?"
• "How is DeepLearning.AI positioning itself in the rapidly evolving AI education landscape?"
• "What do you find most exciting about working at DeepLearning.AI compared to your time at Google?"
• "What's the biggest challenge you've faced in scaling AI education?"
• "Are there any upcoming initiatives at DeepLearning.AI you're particularly excited about?"

━━━ 📋 Get Contact ━━━

**After a good conversation:**

"Thank you so much for sharing your insights about DeepLearning.AI and AI education. 
This has been really valuable. I'd love to stay in touch and follow your work. Would 
it be okay if I connected with you on LinkedIn?"

**Alternative:**

"I really appreciate your time today. If it's alright, I'd love to send you a 
follow-up email. What's the best way to reach you?"

━━━ 📧 Follow-up Email ━━━

Subject: Great meeting you at [Event Name]

Dear Andrew Ng,

Thank you for taking the time to speak with me at [Event Name] today. Your insights 
about DeepLearning.AI and the future of AI education were incredibly valuable.

I'm particularly interested in DeepLearning.AI's approach to making AI accessible 
and would love to explore opportunities to contribute to this mission.

I've attached my resume for your reference. I'd be grateful for any advice or 
potential next steps you might suggest.

Looking forward to staying in touch!

Best regards,
[Your Name]
[Your Contact Info]
```

#### Validation Checklist

- ✅ Pitch mentions "DeepLearning.AI"
- ✅ Pitch mentions "Founder" role
- ✅ Pitch mentions "Google" (previous company)
- ✅ Questions reference specific company work
- ✅ Email uses real name "Andrew Ng"
- ❌ No generic placeholders

---

## 🔧 Debug Commands

### Extension Management

```javascript
// Reload extension programmatically
chrome.runtime.reload();

// Check extension status
chrome.management.getSelf((info) => {
  console.log('Extension Info:', info);
  console.log('Enabled:', info.enabled);
  console.log('Version:', info.version);
});
```

### Storage Management

```javascript
// View all stored data
chrome.storage.local.get(null, (data) => {
  console.log('All Storage:', data);
});

// Clear specific keys
chrome.storage.local.remove(['chats', 'pendingImport'], () => {
  console.log('✅ Cleared chat data');
});

// Clear everything
chrome.storage.local.clear(() => {
  console.log('✅ All storage cleared');
  location.reload();
});
```

### AI Testing

```javascript
// Test AI availability
chrome.runtime.sendMessage({
  action: 'SMOKE_TEST'
}, (response) => {
  console.log('AI Status:', response);
});

// Force AI reinitialization
chrome.runtime.sendMessage({
  action: 'REINIT_AI'
}, (response) => {
  console.log('Reinitialization:', response);
});
```

### Message Debugging

```javascript
// Listen to all extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message);
  console.log('📤 From:', sender);
});

// Send test message
chrome.runtime.sendMessage({
  action: 'TEST',
  data: { test: true }
}, (response) => {
  console.log('Response:', response);
});
```

### Performance Monitoring

```javascript
// Add to Side Panel Console for performance tracking
const perfMonitor = {
  marks: {},
  
  start(label) {
    this.marks[label] = performance.now();
    console.log(`⏱️ Started: ${label}`);
  },
  
  end(label) {
    if (this.marks[label]) {
      const duration = performance.now() - this.marks[label];
      console.log(`✅ ${label}: ${duration.toFixed(2)}ms`);
      delete this.marks[label];
      return duration;
    }
  }
};

// Usage
perfMonitor.start('AI Generation');
// ... AI call ...
perfMonitor.end('AI Generation');
```

---

## 🎯 Testing Checklist

### Pre-Test Setup

- [ ] Chrome Canary 127+ installed
- [ ] Chrome AI flags enabled at `chrome://flags/`
- [ ] Extension loaded in developer mode
- [ ] LinkedIn account logged in
- [ ] DevTools Console open

### Functional Tests

#### Import Flow
- [ ] Floating button appears on LinkedIn profile pages
- [ ] Button has correct styling and position
- [ ] Click opens Side Panel automatically
- [ ] Profile data extracted correctly
- [ ] All expected fields populated (name, title, company, etc.)

#### AI Generation
- [ ] AI initialization successful
- [ ] Scenario recommendation works
- [ ] Questions generated within 30s
- [ ] Questions are personalized (real names/companies)
- [ ] No generic placeholders like `[Company]` or `[Name]`
- [ ] Follow-up email included

#### Timeline Display
- [ ] Questions grouped by time segments
- [ ] Proper formatting and styling
- [ ] All interactive buttons work
- [ ] Favorite/unfavorite toggles correctly
- [ ] Notes can be added and saved
- [ ] Copy to clipboard works
- [ ] Mark as used grays out question

#### Scenarios
- [ ] Coffee Chat scenario displays correctly
- [ ] Networking scenario displays correctly
- [ ] Elevator pitch generator works (Networking)
- [ ] Contact exchange scripts included
- [ ] Email templates personalized with real data

### Edge Cases

- [ ] Works with incomplete LinkedIn profiles
- [ ] Handles profiles with no experience section
- [ ] Handles profiles with no education section
- [ ] Works when Side Panel is already open
- [ ] Works after extension reload
- [ ] Works in incognito mode (if permissions granted)
- [ ] Multiple imports from different profiles
- [ ] Switching between scenarios

### Performance Tests

- [ ] Button appears within 3 seconds
- [ ] Data import completes within 2 seconds
- [ ] AI generation completes within 30 seconds
- [ ] Timeline renders instantly (< 1s)
- [ ] No memory leaks after multiple uses
- [ ] Extension doesn't slow down browser

---

## 📊 Performance Benchmarks

### Expected Timings

| Operation | Target | Acceptable | Timeout |
|-----------|--------|------------|---------||
| **Button Appearance** | < 1s | < 3s | 5s |
| **Data Import** | < 1s | < 2s | 5s |
| **AI Generation** | 10-20s | 10-30s | 120s |
| **Timeline Render** | < 0.5s | < 1s | 2s |
| **Button Interaction** | Instant | < 0.1s | 0.5s |

### If Performance is Slow

1. **First-time use**: Chrome AI model download may take 1-2 minutes
2. **Slow device**: AI generation may take longer on older hardware
3. **Network issues**: Check internet connection for model download
4. **Extension conflicts**: Disable other extensions temporarily
5. **Chrome version**: Ensure using latest Chrome Canary

---

## 💡 Tips & Best Practices

### For Testers

1. **First Use**: Allow 1-2 minutes for Chrome AI to initialize and download model
2. **Test Profiles**: Use well-known profiles with complete information (e.g., Andrew Ng, Satya Nadella)
3. **Console Monitoring**: Keep DevTools open in both Side Panel and Background contexts
4. **Clear State**: Clear storage between tests for consistent results
5. **Document Issues**: Take screenshots and copy error messages

### For Developers

1. **Logging**: Use emoji prefixes for easy log filtering (🎯, ✅, ❌, 📥, 📤)
2. **Error Handling**: Always wrap async operations in try-catch
3. **Timeouts**: Set reasonable timeouts for AI operations (120s)
4. **Fallbacks**: Provide fallback behavior when AI is unavailable
5. **Testing**: Test with various profile types and edge cases

---

## 🔍 Debugging Workflow

### Step-by-Step Debug Process

1. **Identify Issue Location**
   - Button not appearing? → Check Content Script
   - Import failing? → Check Data Extraction
   - AI timeout? → Check Background/Offscreen
   - Display broken? → Check Side Panel

2. **Check Console Logs**
   - Open DevTools in appropriate context
   - Look for error messages
   - Verify expected log messages appear

3. **Run Diagnostic Commands**
   - Use debug commands from this guide
   - Test individual components
   - Verify data flow

4. **Apply Fix**
   - Make targeted code changes
   - Reload extension
   - Test again

5. **Verify Solution**
   - Run full test suite
   - Check edge cases
   - Monitor performance

---

## 📞 Support & Resources

### If You Still Have Issues

1. **Check Console**: Open DevTools Console in all contexts
2. **Copy Errors**: Copy all error messages and stack traces
3. **Check Logs**: Review `background.js` and `sidepanel.js` Console
4. **Provide Details**: Include Chrome version, OS, and steps to reproduce

### Useful Resources

- **Chrome AI Docs**: https://developer.chrome.com/docs/ai/built-in
- **Extension Docs**: https://developer.chrome.com/docs/extensions/
- **Manifest V3**: https://developer.chrome.com/docs/extensions/mv3/
- **Side Panel API**: https://developer.chrome.com/docs/extensions/reference/sidePanel/

---

## ✅ Test Completion

Once all tests pass, you should have:

- ✅ Floating button working on LinkedIn profiles
- ✅ Data import extracting complete profile information
- ✅ AI generating personalized questions with real data
- ✅ Timeline displaying questions in organized segments
- ✅ All interactive features working (favorite, note, copy, mark used)
- ✅ Both scenarios (Coffee Chat & Networking) functional
- ✅ Follow-up emails personalized with real names and companies
- ✅ No placeholders or generic content
- ✅ Performance within acceptable ranges

**Congratulations! SmartInsight is ready to use! 🎉**
