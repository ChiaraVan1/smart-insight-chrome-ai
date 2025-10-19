# 🏆 SmartInsight Career Assistant

> **Chrome Built-in AI powered career networking assistant. 100% private LinkedIn analysis with Gemini Nano. Zero cost, offline-capable, personalized conversation guides.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Built with Chrome AI](https://img.shields.io/badge/Built%20with-Chrome%20AI-4285F4?logo=google-chrome)](https://developer.chrome.com/docs/ai/built-in)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.1.0-green.svg)](https://github.com/your-repo/smart-insight-chrome-ai)

---

## 🌟 Overview

**SmartInsight** is an intelligent career networking assistant that leverages **Chrome's Built-in AI (Gemini Nano)** to generate personalized conversation guides for LinkedIn profiles. Unlike traditional AI tools that send your data to external servers, SmartInsight processes everything **locally on your device** — ensuring complete privacy, zero cost, and offline capability.

### ✨ Key Features

- 🔒 **100% Private**: All AI processing happens locally on your device using Chrome's built-in Gemini Nano model
- 💰 **Zero Cost**: No API keys, no subscriptions, completely free
- ⚡ **Instant Analysis**: Real-time personalized questions without network latency
- 🌐 **Offline Capable**: Works without internet connection once the model is downloaded
- 🎯 **Smart Scenarios**: Tailored guidance for Coffee Chats (30-60 min) and Networking events (2-10 min)
- 📊 **LinkedIn Integration**: Automatic profile data import
- 💬 **Clean Text Output**: Simple, readable conversation guides
- 📝 **Follow-up Templates**: AI-generated personalized email templates

---

## 🎯 Use Cases

### ☕ Coffee Chat Scenario
Perfect for informal 1-on-1 meetings with professionals:
- **Icebreaker Questions** (0-15 min): Personalized conversation starters based on their background
- **Industry Insights** (15-35 min): Deep-dive questions about their company and role
- **Career Advice** (35-45 min): Guidance on skills, preparation, and career growth
- **Follow-up Email**: Auto-generated thank-you email with specific references

### 🤝 Networking Scenario
Ideal for career fairs, conferences, and networking events:
- **Elevator Pitch**: AI-crafted 2-minute introduction highlighting relevant connections
- **Smart Questions**: Targeted questions about their company and projects
- **Contact Exchange**: Professional ways to request contact information
- **Follow-up Email**: Personalized networking follow-up template

---

## 🚀 Quick Start

### Prerequisites

1. **Chrome Canary** (version 127 or higher)
2. Enable Chrome AI features:
   - Navigate to `chrome://flags/`
   - Enable the following flags:
     - `#optimization-guide-on-device-model`
     - `#prompt-api-for-gemini-nano`
   - Restart Chrome

### Installation

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/your-repo/smart-insight-chrome-ai.git
   cd smart-insight-chrome-ai
   ```

2. **Load the Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `smart-insight-chrome-ai` folder

3. **Verify Installation**:
   - You should see the SmartInsight icon in your extensions toolbar
   - A notification will appear when the AI service is ready

### First Use

**⚠️ Important for First-Time Users:**

On your **first use**, Chrome needs to download the Gemini Nano model (~1.5GB). This happens automatically when you:
- Install the extension
- First open the Side Panel
- First select a scenario

**What to expect:**
- 📥 You'll see a notification: "Chrome AI model downloading"
- ⏱️ Download takes 5-15 minutes depending on your connection
- 📊 Progress updates will appear in notifications
- ✅ Once complete, you'll see: "AI model ready"

**After the model is downloaded:**

1. Visit any LinkedIn profile page (e.g., `https://www.linkedin.com/in/andrewyng/`)
2. Click the SmartInsight extension icon to open the Side Panel
3. Choose your scenario: **☕ Coffee Chat** or **🤝 Networking**
4. The extension will automatically import LinkedIn data
5. AI generates personalized conversation guides instantly

**Tip:** You can check model status by opening Chrome DevTools Console and looking for `✅ Chrome AI model ready` logs.

---

## 📖 How It Works

### Architecture

```
┌─────────────────┐
│  LinkedIn Page  │
│  (Content Script)│
└────────┬────────┘
         │ Extract Profile Data
         ▼
┌─────────────────┐
│   Background    │◄──────┐
│  Service Worker │       │
└────────┬────────┘       │
         │                │
         ▼                │
┌─────────────────┐       │
│  Offscreen Page │       │
│  (Chrome AI)    │       │
└────────┬────────┘       │
         │ Generate       │
         │ Insights       │
         ▼                │
┌─────────────────┐       │
│   Side Panel    │───────┘
│   (Chat UI)     │
└─────────────────┘
```

### Technology Stack

- **Chrome Built-in AI**: Gemini Nano for on-device language model
- **Chrome Extensions API**: Manifest V3 with Side Panel, Offscreen Document
- **Vanilla JavaScript**: No external dependencies for maximum performance
- **Local Storage**: Chrome Storage API for data persistence
- **LinkedIn Scraping**: Custom content script for profile data extraction

---

## 🎨 Features in Detail

### 1. Automatic LinkedIn Import
- **Seamless Integration**: Automatically imports data when you select a scenario
- **Rich Data Extraction**: Captures name, title, company, experience, education
- **Privacy First**: All data stays on your device, never sent to external servers
- **Smart Fallback**: Graceful error handling if not on LinkedIn page

### 2. AI-Powered Personalization
- **Context-Aware Questions**: Generates specific questions referencing actual companies and roles
- **Real Data Usage**: Uses actual names, companies, and experiences from the profile
- **No Generic Templates**: Every question is tailored to the specific person
- **Natural Language**: Questions written in conversational, professional tone

### 3. Structured Conversation Guides
- **Time-Segmented**: Questions organized by conversation phases (Icebreaker → Insights → Advice)
- **Clean Text Format**: Simple, readable output without complex UI
- **Easy to Copy**: Plain text format perfect for note-taking or printing
- **Follow-up Emails**: Personalized email templates included

### 4. Two Optimized Scenarios
- **Coffee Chat Mode**: 3 sections covering 45 minutes of deep conversation
- **Networking Mode**: Quick strategy for 2-10 minute interactions at career fairs
- **Scenario-Specific**: Questions and advice tailored to each context
- **Professional Guidance**: Includes what to avoid and best practices

---

## 🛠️ Development

### Project Structure

```
smart-insight-chrome-ai/
├── manifest.json           # Extension configuration
├── background.js           # Service worker (AI orchestration)
├── content-script.js       # LinkedIn data extraction
├── sidepanel.html          # Chat interface UI
├── sidepanel.js            # Chat logic and state management
├── offscreen.html          # AI processing context
├── offscreen.js            # Chrome AI wrapper
├── icon128.png             # Extension icon
├── package.json            # Project metadata
├── TESTING_GUIDE.md        # Comprehensive testing guide
├── demo-comparison.html    # Demo page
└── src/
    ├── ai/                 # AI prompt templates
    ├── scrapers/           # LinkedIn data scrapers
    ├── storage/            # Data persistence
    └── ui/                 # UI components
```

### Key Files

- **`background.js`**: Manages AI service initialization, message routing, and offscreen document lifecycle
- **`content-script.js`**: Injects into LinkedIn pages to extract profile data and show import button
- **`sidepanel.js`**: Handles chat interface, scenario selection, and timeline rendering
- **`offscreen.js`**: Wraps Chrome's Prompt API for AI text generation

### Scripts

```bash
# Run tests
npm test

# Create distribution package
npm run zip

# Open demo page
npm run demo
```

---

## 🧪 Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

### Quick Test

1. Visit `https://www.linkedin.com/in/andrewyng/`
2. Open SmartInsight Side Panel (click extension icon)
3. Click **☕ Coffee Chat** or **🤝 Networking**
4. Wait for automatic import and AI generation (5-10 seconds)
5. Verify AI generates personalized questions mentioning:
   - ✅ Real name: "Andrew Ng"
   - ✅ Real company: "DeepLearning.AI"  
   - ✅ Real role: "Founder & CEO"
   - ❌ No placeholders like `[Company Name]` or `[Project]`

### Common Issues

| Issue | Solution |
|-------|----------|
| "Please navigate to LinkedIn profile page" | Make sure you're on a LinkedIn profile page (URL contains `/in/`) |
| AI generation timeout | Wait up to 120 seconds, check Chrome AI flags are enabled |
| Generic questions | Verify profile data was imported correctly in Console logs |
| Model download stuck | Check `chrome://components/` and manually trigger Optimization Guide download |

---

## 🔒 Privacy & Security

### Data Handling

- **No External Servers**: All AI processing happens locally using Chrome's built-in model
- **No Data Collection**: We don't collect, store, or transmit any user data
- **Local Storage Only**: All data is stored in Chrome's local storage on your device
- **No Analytics**: No tracking, no telemetry, no third-party services

### Permissions Explained

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current LinkedIn tab for data extraction |
| `scripting` | Inject content script into LinkedIn pages |
| `storage` | Save chat history and preferences locally |
| `sidePanel` | Display the chat interface |
| `notifications` | Show status notifications |
| `offscreen` | Run Chrome AI in a separate context |

---

## 🎯 Chrome AI Challenge 2025

This project is built for the **Chrome Built-in AI Challenge 2025**, showcasing:

- ✅ **Innovative Use of Chrome AI**: Leverages Gemini Nano for career guidance
- ✅ **Privacy-First Design**: 100% on-device processing
- ✅ **Real-World Application**: Solves actual pain points in job searching and networking
- ✅ **Excellent UX**: Clean, intuitive interface with instant feedback
- ✅ **Technical Excellence**: Efficient architecture with proper error handling

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Chrome Team**: For building the amazing Chrome Built-in AI APIs
- **Gemini Nano**: For providing powerful on-device language models
- **LinkedIn**: For the platform that makes professional networking possible

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/smart-insight-chrome-ai/issues)
- **Documentation**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Chrome AI Docs**: [Chrome Built-in AI](https://developer.chrome.com/docs/ai/built-in)

---

## 🗺️ Roadmap

- [ ] Support for more LinkedIn page types (company pages, job postings)
- [ ] Additional scenarios (Interview Prep, Salary Negotiation)
- [ ] Export chat history to PDF
- [ ] Multi-language support
- [ ] Voice practice mode for elevator pitches
- [ ] Integration with calendar for scheduling follow-ups

---

<div align="center">

**Made with ❤️ using Chrome Built-in AI**

[⭐ Star this repo](https://github.com/your-repo/smart-insight-chrome-ai) | [🐛 Report Bug](https://github.com/your-repo/smart-insight-chrome-ai/issues) | [💡 Request Feature](https://github.com/your-repo/smart-insight-chrome-ai/issues)

</div>
