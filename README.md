# 🏆 SmartInsight Career Assistant

> **Chrome Built-in AI powered career networking assistant. 100% private LinkedIn analysis with Gemini Nano. Zero cost, offline-capable, personalized conversation guides.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Built with Chrome AI](https://img.shields.io/badge/Built%20with-Chrome%20AI-4285F4?logo=google-chrome)](https://developer.chrome.com/docs/ai/built-in)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](https://github.com/ChiaraVan1/smart-insight-chrome-ai)

---

## 📑 Table of Contents

- [What's New](#-whats-new-in-v300)
- [Overview](#-overview)
- [Screenshots](#-screenshots)
- [Use Cases](#-use-cases)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Features in Detail](#-features-in-detail)
- [Development](#%EF%B8%8F-development)
- [Testing](#-testing)
- [Privacy & Security](#-privacy--security)
- [Chrome AI Challenge 2025](#-chrome-ai-challenge-2025)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Contributing](#-contributing)
- [Support](#-support)

---

## ⚡ What's New in v3.0.0

- 💬 **Conversational Chat Interface**: Multi-chat support with persistent history
- 🤖 **Auto Profile Personalization**: Automatically fetches your LinkedIn profile for better AI responses
- 🔔 **Smart Detection**: Toast prompts automatically appear on LinkedIn profiles
- 📊 **Real-time Progress**: Live model download progress with retry logic
- 🎯 **One-Click Scenarios**: Select Coffee Chat or Networking to auto-import and generate
- 💾 **Chat History Panel**: Collapsible sidebar to manage all conversations
- 🌐 **Full English Support**: All UI and AI responses in English
- ⚙️ **Robust Architecture**: Offscreen document with LanguageModel API integration

---

## 🌟 Overview

**SmartInsight** is an intelligent career networking assistant that leverages **Chrome's Built-in AI (Gemini Nano v3nano)** to generate personalized conversation guides for LinkedIn profiles. Unlike traditional AI tools that send your data to external servers, SmartInsight processes everything **locally on your device** using Chrome's LanguageModel API — ensuring complete privacy, zero cost, and offline capability.

### ✨ Key Features

- 🔒 **100% Private**: All AI processing happens locally on your device using Chrome's built-in Gemini Nano model
- 💰 **Zero Cost**: No API keys, no subscriptions, completely free
- ⚡ **Instant Analysis**: Real-time personalized conversation guides without network latency
- 🌐 **Offline Capable**: Works without internet connection once the model is downloaded
- 🎯 **Smart Scenarios**: Tailored guidance for Coffee Chats (30-60 min) and Networking events (2-10 min)
- 📊 **LinkedIn Integration**: Automatic profile and company data import with smart detection
- 💬 **Conversational Interface**: Clean chat-based UI with multi-conversation support
- 🤖 **Auto Profile Personalization**: Automatically fetches your LinkedIn profile to personalize AI responses
- 📝 **Chat History**: Persistent conversation storage with easy navigation

---

## 📸 Screenshots

### Chat Interface
![SmartInsight Chat Interface](https://via.placeholder.com/800x500?text=Chat+Interface+Screenshot)
*Clean conversational UI with scenario toolbar and chat history panel*

### Smart Detection
![LinkedIn Profile Detection](https://via.placeholder.com/800x200?text=Smart+Detection+Toast)
*Automatic toast prompts when visiting LinkedIn profiles*

### Model Download Progress
![Model Download](https://via.placeholder.com/400x200?text=Model+Download+Progress)
*Real-time progress updates during first-time model download*

---

## 🎯 Use Cases

### ☕ Coffee Chat Scenario
Perfect for informal 1-on-1 meetings with professionals:
- **Automatic LinkedIn Import**: One-click scenario activation automatically imports target profile data
- **Personalized Questions**: AI generates conversation starters based on their background and your profile
- **Industry Insights**: Deep-dive questions about their company and role
- **Career Advice**: Guidance on skills, preparation, and career growth
- **Interactive Chat**: Ask follow-up questions and get instant AI-powered responses

### 🤝 Networking Scenario
Ideal for career fairs, conferences, and networking events:
- **Quick Profile Analysis**: Fast import and analysis for time-sensitive networking
- **Elevator Pitch Suggestions**: AI-crafted introductions highlighting relevant connections
- **Smart Questions**: Targeted questions about their company and projects
- **Company Insights**: Automatic company data scraping and analysis
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
   git clone https://github.com/ChiaraVan1/smart-insight-chrome-ai.git
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
- Install the extension (auto-initialization starts immediately)
- First open the Side Panel
- The offscreen document loads and triggers model download

**What to expect:**
- 📥 Toast notification: "AI model downloading: X%"
- ⏱️ Download takes 5-15 minutes depending on your connection
- 📊 Real-time progress updates in the Side Panel
- ✅ Once complete: "AI model ready" notification

**After the model is downloaded:**

1. Visit any LinkedIn profile page (e.g., `https://www.linkedin.com/in/andrewyng/`)
2. Click the SmartInsight extension icon to open the Side Panel
3. Choose your scenario: **☕ Coffee Chat** or **🤝 Networking**
4. The extension will:
   - Automatically import the target's LinkedIn profile data
   - Fetch your LinkedIn profile (first time only) for personalization
   - Generate personalized conversation guides instantly
5. Start chatting! Ask follow-up questions and get AI-powered responses

**Smart Features:**
- 🔔 **Auto-detection**: Toast prompts appear when you visit LinkedIn profiles
- 💾 **Chat History**: All conversations are saved and accessible via the history panel
- 🔄 **Multi-conversation**: Manage multiple chats with different people
- 🎯 **Context-aware**: AI remembers your profile and conversation context

**Tip:** Check Console for detailed logs: `[OFFSCREEN][LM] ✅ Session created successfully!`

---

## 📖 How It Works

### User Workflow

1. **Installation & Setup**
   - Install extension in Chrome Canary (v127+)
   - Extension auto-fetches your LinkedIn profile (background, silent)
   - Gemini Nano model downloads automatically (~1.5GB, one-time)
   - Real-time progress shown via toast notifications

2. **Using the Extension**
   - Visit any LinkedIn profile page (e.g., `/in/username`)
   - Toast prompt appears: "📥 Detected Profile: [Name]"
   - Click extension icon to open Side Panel
   - Choose scenario: **☕ Coffee Chat** or **🤝 Networking**

3. **AI Processing**
   - Extension automatically imports target's profile data
   - AI analyzes profile using your context + their background
   - Generates personalized conversation guide (5-15 seconds)
   - Displays in clean chat interface

4. **Interactive Chat**
   - Ask follow-up questions: "shorter", "more specific", "what about X?"
   - AI responds contextually using conversation history
   - All chats saved locally in history panel
   - Switch between multiple conversations easily

### Architecture

```
┌──────────────────────┐
│   LinkedIn Page      │
│   (Content Script)   │
│   - Profile Scraper  │
│   - Company Scraper  │
│   - Smart Detector   │
└──────────┬───────────┘
           │ Extract & Send Data
           ▼
┌──────────────────────┐
│   Background.js      │◄─────────┐
│   (Service Worker)   │          │
│   - Message Router   │          │
│   - Storage Manager  │          │
│   - Auto Profile     │          │
│     Fetcher          │          │
└──────────┬───────────┘          │
           │                      │
           │ Forward AI Calls     │
           ▼                      │
┌──────────────────────┐          │
│   Offscreen.html     │          │
│   (LanguageModel)    │          │
│   - Gemini Nano      │          │
│   - Session Manager  │          │
│   - Progress Monitor │          │
└──────────┬───────────┘          │
           │ Generate Response    │
           ▼                      │
┌──────────────────────┐          │
│   Sidepanel.html     │──────────┘
│   (Chat Interface)   │
│   - Chat History     │
│   - Scenario Toolbar │
│   - Message Display  │
└──────────────────────┘
```

### Technology Stack

- **Chrome Built-in AI**: Gemini Nano v3nano via LanguageModel API
- **Chrome Extensions API**: 
  - Manifest V3
  - Side Panel API (conversational UI)
  - Offscreen Document API (AI processing)
  - Content Scripts (LinkedIn scraping)
  - Storage API (chat persistence)
  - Notifications API (model status)
- **Vanilla JavaScript**: Zero external dependencies for maximum performance and privacy
- **Local Storage**: Chrome Storage API for chat history and user data
- **LinkedIn Scraping**: 
  - Profile data extraction (name, title, experience, education)
  - Company data extraction (about, website, industry)
  - Smart page detection (auto-prompt on profile pages)
- **Auto Profile Personalization**: Silent background fetch of user's LinkedIn profile

---

## 🎨 Features in Detail

### 1. Smart LinkedIn Detection & Import
- **Auto-Detection**: Toast prompts automatically appear when you visit LinkedIn profile or company pages
- **One-Click Import**: Click the prompt to instantly import profile data
- **Scenario-Triggered Import**: Selecting Coffee Chat or Networking automatically imports data
- **Rich Data Extraction**: Captures name, title, company, experience, education, skills
- **Company Analysis**: Extracts company info including about, website, industry, size
- **Privacy First**: All data stays on your device, never sent to external servers
- **Smart Fallback**: Clear error messages if not on LinkedIn page

### 2. Auto Profile Personalization
- **Silent Background Fetch**: Automatically fetches your LinkedIn profile on first install
- **Context Enhancement**: AI uses your profile to personalize responses
- **Relevant Connections**: Highlights shared experiences, companies, or schools
- **Better Questions**: Generates questions that reference your background
- **One-Time Fetch**: Only fetches once, stored locally for future use

### 3. Conversational Chat Interface
- **Multi-Chat Support**: Manage multiple conversations with different people
- **Chat History Panel**: Collapsible sidebar showing all past conversations
- **Persistent Storage**: All chats saved locally and restored on restart
- **Real-Time Responses**: Instant AI-powered replies to your questions
- **Scenario Toolbar**: Visual indicator showing active scenario (Coffee Chat/Networking)
- **Clean UI**: Modern gradient design with smooth animations

### 4. AI-Powered Personalization
- **Context-Aware Responses**: AI references actual companies, roles, and experiences
- **Real Data Usage**: Uses actual names and details from LinkedIn profiles
- **No Generic Templates**: Every response tailored to the specific person
- **Natural Language**: Conversational, professional tone in English
- **Follow-up Support**: Ask clarifying questions like "shorter" or "more specific"

### 5. Two Optimized Scenarios
- **Coffee Chat Mode** (☕): Deep conversation guide for 30-60 minute meetings
  - Icebreaker questions based on their background
  - Industry insights about their company and role
  - Career advice and skill development guidance
- **Networking Mode** (🤝): Quick strategy for 2-10 minute career fair interactions
  - Elevator pitch suggestions
  - Targeted questions about projects and opportunities
  - Professional contact exchange approaches
- **Scenario-Specific**: Questions and advice tailored to each context
- **Professional Guidance**: Best practices and things to avoid

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

- **`background.js`**: 
  - Manages AI service initialization and model prewarming
  - Routes messages between components
  - Handles profile/company analysis with AI
  - Auto-fetches user's LinkedIn profile on install
  - Manages offscreen document lifecycle
  
- **`content-script.js`**: 
  - Injects into LinkedIn pages
  - Smart detection of profile/company pages
  - Shows toast prompts for import
  - Extracts profile and company data via scrapers
  
- **`sidepanel.js`**: 
  - Chat interface with history panel
  - Scenario activation and management
  - Message rendering and state management
  - Handles pending imports and user interactions
  
- **`offscreen.js`**: 
  - Wraps Chrome's LanguageModel API
  - Manages Gemini Nano session
  - Monitors model download progress
  - Auto-initializes on page load

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
2. Wait for toast prompt: "📥 Detected Profile: Andrew Ng"
3. Open SmartInsight Side Panel (click extension icon)
4. Click **☕ Coffee Chat** or **🤝 Networking**
5. Extension automatically imports profile data
6. AI generates personalized conversation guide (5-15 seconds)
7. Verify AI response mentions:
   - ✅ Real name: "Andrew Ng"
   - ✅ Real company: "DeepLearning.AI"  
   - ✅ Real role: "Founder & CEO"
   - ✅ Specific experiences or projects
   - ❌ No placeholders like `[Company Name]` or `[Project]`
8. Test chat: Type "shorter" or ask a follow-up question
9. Verify AI responds contextually in English

### Common Issues

| Issue | Solution |
|-------|----------|
| "Please open a LinkedIn profile page" | Navigate to a LinkedIn profile page (URL contains `/in/` or `/company/`) |
| "AI model downloading: X%" | Wait for download to complete (5-15 min first time), progress shown in toast |
| AI generation timeout | Wait up to 120 seconds, check Chrome AI flags are enabled in `chrome://flags/` |
| Generic questions | Verify profile data imported correctly in Console: `📊 Profile data:` |
| Model download stuck | Check `chrome://components/` → Optimization Guide On Device Model |
| Chat history not showing | Click ⏱️ icon in header to toggle history panel |
| Responses in wrong language | All prompts configured for English, check Console for errors |

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

- ✅ **Innovative Use of Chrome AI**: Leverages Gemini Nano v3nano via LanguageModel API for career guidance
- ✅ **Privacy-First Design**: 100% on-device processing with zero external API calls
- ✅ **Real-World Application**: Solves actual pain points in job searching and networking
- ✅ **Excellent UX**: Clean chat interface with real-time progress feedback and smart detection
- ✅ **Technical Excellence**: 
  - Efficient offscreen document architecture
  - Robust model download handling with retry logic
  - Multi-conversation state management
  - Auto profile personalization
  - Comprehensive error handling and user feedback

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

- **Issues**: [GitHub Issues](https://github.com/ChiaraVan1/smart-insight-chrome-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ChiaraVan1/smart-insight-chrome-ai/discussions)
- **Documentation**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Chrome AI Docs**: [Chrome Built-in AI](https://developer.chrome.com/docs/ai/built-in)
- **LanguageModel API**: [Prompt API Reference](https://developer.chrome.com/docs/ai/built-in-apis)

---

## 🗺️ Roadmap

### Current Features (v3.0.0)
- ✅ Coffee Chat and Networking scenarios
- ✅ LinkedIn profile and company data import
- ✅ Multi-chat conversation management
- ✅ Auto profile personalization
- ✅ Smart page detection with toast prompts
- ✅ Real-time model download progress
- ✅ Chat history with persistent storage

### Planned Features
- [ ] Additional scenarios (Interview Prep, Salary Negotiation, Cold Email)
- [ ] Export chat history to PDF/Markdown
- [ ] Job posting analysis and application tips
- [ ] Company culture insights from LinkedIn company pages
- [ ] Follow-up reminder system
- [ ] Conversation practice mode with AI role-play
- [ ] Multi-language support (currently English-only)
- [ ] Browser action popup for quick access

---

<div align="center">

**Made with ❤️ using Chrome Built-in AI (Gemini Nano v3nano)**

[⭐ Star this repo](https://github.com/ChiaraVan1/smart-insight-chrome-ai) | [🐛 Report Bug](https://github.com/ChiaraVan1/smart-insight-chrome-ai/issues) | [💡 Request Feature](https://github.com/ChiaraVan1/smart-insight-chrome-ai/issues)

</div>
