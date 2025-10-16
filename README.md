# 🏆 SmartInsight Career Assistant

> **Chrome Built-in AI powered career assistant. 100% private LinkedIn analysis with Gemini Nano. Zero cost, offline-capable, instant insights.**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![Built with Chrome AI](https://img.shields.io/badge/Built%20with-Chrome%20AI-4285F4?logo=google-chrome)](https://developer.chrome.com/docs/ai/built-in)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](https://github.com/your-repo/smart-insight-chrome-ai)

---

## 🌟 Overview

**SmartInsight** is an intelligent career assistant that leverages **Chrome's Built-in AI (Gemini Nano)** to provide personalized career guidance directly from LinkedIn profiles. Unlike traditional AI tools that send your data to external servers, SmartInsight processes everything **locally on your device** — ensuring complete privacy, zero cost, and offline capability.

### ✨ Key Features

- 🔒 **100% Private**: All AI processing happens locally on your device using Chrome's built-in Gemini Nano model
- 💰 **Zero Cost**: No API keys, no subscriptions, completely free
- ⚡ **Instant Analysis**: Real-time insights without network latency
- 🌐 **Offline Capable**: Works without internet connection once the model is downloaded
- 🎯 **Smart Scenarios**: Tailored guidance for Coffee Chats and Networking events
- 📊 **LinkedIn Integration**: One-click import of LinkedIn profile data
- 💬 **Interactive Timeline**: Structured conversation guides with time segments
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

1. Visit any LinkedIn profile page (e.g., `https://www.linkedin.com/in/andrewyng/`)
2. Look for the floating **"✨ 导入"** button in the bottom-right corner
3. Click the button to import profile data
4. The Side Panel will open automatically with AI-generated insights
5. Choose your scenario (Coffee Chat or Networking) to get started

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

### 1. Smart Import
- **Automatic Detection**: Detects LinkedIn profile pages automatically
- **One-Click Import**: Floating button for instant data extraction
- **Rich Data**: Extracts name, title, company, experience, education, skills
- **Privacy First**: All data stays on your device

### 2. AI-Powered Analysis
- **Scenario Recommendation**: Automatically suggests the best scenario based on profile
- **Personalized Questions**: Generates specific questions referencing actual experience
- **Context-Aware**: Uses real company names, projects, and roles from the profile
- **Quality Scoring**: Each question is tagged with quality indicators

### 3. Interactive Timeline
- **Time-Segmented**: Questions organized by conversation phases
- **Visual Design**: Clean, modern interface with emoji indicators
- **Interactive Actions**: Favorite, note-taking, copy, and mark-as-used features
- **Progress Tracking**: Visual indicators for used questions

### 4. Follow-up Tools
- **Email Templates**: Personalized thank-you and follow-up emails
- **Pitch Practice**: Interactive elevator pitch generator for networking
- **Contact Scripts**: Professional ways to exchange contact information

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
2. Click the floating import button
3. Verify AI generates personalized questions mentioning:
   - ✅ Real name: "Andrew Ng"
   - ✅ Real company: "DeepLearning.AI"
   - ✅ Real role: "Founder"
   - ❌ No placeholders like `[Company Name]` or `[Project]`

### Common Issues

| Issue | Solution |
|-------|----------|
| Import button not appearing | Refresh the LinkedIn page, check Console for errors |
| AI generation timeout | Wait up to 120 seconds, check Chrome AI flags are enabled |
| Generic questions instead of personalized | Verify profile data was imported correctly in Console |

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
