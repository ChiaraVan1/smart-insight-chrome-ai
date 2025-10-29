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
- [Best Practices](#-best-practices)
- [FAQ](#-faq)
- [Comparison with Other Tools](#-comparison-with-other-tools)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Contributing](#-contributing)
- [Support](#-support)

---

## ⚡ What's New in v3.0.0

### Major Improvements
- 💬 **Conversational Chat Interface**: Multi-chat support with persistent history
  - Create unlimited conversations with different people
  - Each chat maintains full conversation context
  - Automatic chat naming based on target profile
  - Easy switching between multiple active conversations
  
- 🤖 **Auto Profile Personalization**: Automatically fetches your LinkedIn profile for better AI responses
  - Silent background fetch on first installation
  - AI uses your profile to personalize all responses
  - Highlights shared experiences and connections
  - One-time fetch, stored locally for future use
  
- 🔔 **Smart Detection**: Toast prompts automatically appear on LinkedIn profiles
  - Detects profile and company pages automatically
  - Shows profile name and company in toast notification
  - One-click import directly from toast
  - Graceful fallback if not on LinkedIn page
  
- 📊 **Real-time Progress**: Live model download progress with retry logic
  - Visual progress bar showing download percentage
  - Detailed status messages (downloading, initializing, ready)
  - Automatic retry mechanism (3 attempts with delays)
  - Toast notifications for each progress milestone
  
- 🎯 **One-Click Scenarios**: Select Coffee Chat or Networking to auto-import and generate
  - Streamlined user flow: select scenario → auto-import → instant generation
  - No manual import step needed
  - Automatic data fetching from current LinkedIn page
  - Scenario-specific AI guidance
  
- 💾 **Chat History Panel**: Collapsible sidebar to manage all conversations
  - Persistent storage of all conversations
  - Quick access to past chats
  - Timestamp and preview for each conversation
  - Easy deletion and organization
  
- 🌐 **Full English Support**: All UI and AI responses in English
  - Complete English localization of all interface text
  - AI prompts configured for English responses
  - Consistent language across all features
  - Professional English tone throughout
  
- ⚙️ **Robust Architecture**: Offscreen document with LanguageModel API integration
  - Efficient offscreen document for AI processing
  - Proper session management and lifecycle
  - Error handling and recovery mechanisms
  - Optimized for performance and reliability

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
   - Creates a local copy of the extension files
   - All source code is now available for customization

2. **Load the Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
     - Type the URL directly in the address bar
     - You'll see a list of installed extensions
   - Enable "Developer mode" (toggle in top-right corner)
     - This allows loading unpacked extensions
     - Required for development and testing
   - Click "Load unpacked"
     - Opens a file browser dialog
   - Select the `smart-insight-chrome-ai` folder
     - Choose the folder containing manifest.json
     - The extension will be loaded immediately

3. **Verify Installation**:
   - You should see the SmartInsight icon in your extensions toolbar
     - Icon appears next to the address bar
     - Click to open the side panel
   - A notification will appear when the AI service is ready
     - "AI model ready" notification after model downloads
     - May take 5-15 minutes on first use
   - Check extension details page for any errors
     - Go back to `chrome://extensions/`
     - Click "Details" on SmartInsight
     - Check for any error messages in red

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
     - Happens automatically on first installation
     - Stored locally for future personalization
     - No manual action required
   - Gemini Nano model downloads automatically (~1.5GB, one-time)
     - Triggered when offscreen document loads
     - Download happens in background
     - Can take 5-15 minutes depending on connection speed
   - Real-time progress shown via toast notifications
     - "AI model downloading: 25%", "50%", etc.
     - "AI model ready" when complete
     - Automatic retry if download fails

2. **Using the Extension**
   - Visit any LinkedIn profile page (e.g., `https://www.linkedin.com/in/username`)
   - Toast prompt appears automatically: "📥 Detected Profile: [Name]"
     - Shows target's name and company
     - Appears within 1-2 seconds of page load
     - Can be dismissed or clicked for quick import
   - Click extension icon to open Side Panel
     - Opens on the right side of the browser
     - Shows chat interface and history panel
   - Choose scenario: **☕ Coffee Chat** or **🤝 Networking**
     - Coffee Chat: For 30-60 minute 1-on-1 meetings
     - Networking: For 2-10 minute career fair interactions

3. **AI Processing**
   - Extension automatically imports target's profile data
     - Extracts: name, title, company, experience, education, skills
     - Extracts company info: about, website, industry, size
     - All data stays on your device
   - AI analyzes profile using your context + their background
     - Uses your LinkedIn profile for personalization
     - Considers shared experiences and connections
     - Analyzes their career trajectory and expertise
   - Generates personalized conversation guide (5-15 seconds)
     - Scenario-specific questions and talking points
     - Professional advice and best practices
     - Context-aware recommendations
   - Displays in clean chat interface
     - Message bubbles with timestamps
     - Clear distinction between user and AI messages
     - Formatted for easy reading

4. **Interactive Chat**
   - Ask follow-up questions: "shorter", "more specific", "what about X?"
     - AI understands context from previous messages
     - Maintains conversation history
     - Provides relevant responses based on context
   - AI responds contextually using conversation history
     - References specific details from the person's profile
     - Builds on previous responses
     - Maintains professional tone
   - All chats saved locally in history panel
     - Automatic saving after each message
     - Accessible even after closing the extension
     - Timestamped for reference
   - Switch between multiple conversations easily
     - Click on any chat in history panel
     - Instantly load previous conversation
     - Manage multiple people simultaneously

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
  - On-device language model
  - ~1.5GB model size
  - Supports text generation and understanding
  - No external API calls required
  
- **Chrome Extensions API**: 
  - **Manifest V3**: Latest extension architecture
    - Enhanced security and privacy
    - Service worker-based background script
    - Content security policy enforcement
  - **Side Panel API**: Conversational UI
    - Right-side panel interface
    - Persistent across page navigation
    - Clean, integrated user experience
  - **Offscreen Document API**: AI processing
    - Separate context for LanguageModel API
    - Isolated from main extension context
    - Proper lifecycle management
  - **Content Scripts**: LinkedIn scraping
    - Injects into LinkedIn pages
    - DOM access for data extraction
    - Message passing to background
  - **Storage API**: Chat persistence
    - Local storage for data persistence
    - Automatic encryption by Chrome
    - Sync across browser instances (optional)
  - **Notifications API**: Model status
    - Toast notifications for user feedback
    - Progress updates and status messages
    - Error alerts and warnings
    
- **Vanilla JavaScript**: Zero external dependencies for maximum performance and privacy
  - No npm dependencies in production
  - Pure JavaScript implementation
  - Minimal code footprint
  - Maximum performance and security
  
- **Local Storage**: Chrome Storage API for chat history and user data
  - Persistent storage across sessions
  - Automatic data encryption
  - User-controlled data deletion
  - No cloud sync by default
  
- **LinkedIn Scraping**: 
  - **Profile data extraction**: name, title, experience, education, skills
    - DOM-based scraping
    - Handles various page layouts
    - Graceful fallback for missing data
  - **Company data extraction**: about, website, industry, size
    - Company page scraping
    - Website and industry detection
    - Employee count extraction
  - **Smart page detection**: auto-prompt on profile pages
    - URL pattern matching
    - Page type identification
    - Toast notification triggering
    
- **Auto Profile Personalization**: Silent background fetch of user's LinkedIn profile
  - Background service worker fetch
  - User profile caching
  - Context enhancement for AI responses
  - One-time initialization

### Data Flow Architecture

```
User Action
    ↓
Content Script (LinkedIn Page)
    ↓ (Extract Data)
Background Service Worker
    ↓ (Process & Route)
Offscreen Document (Chrome AI)
    ↓ (Generate Response)
Background Service Worker
    ↓ (Format Response)
Side Panel (Chat UI)
    ↓ (Display to User)
Chrome Storage (Persist)
```

### Message Flow

1. **Profile Import Flow**
   - Content Script detects profile page
   - Extracts profile data from DOM
   - Sends data to Background via message
   - Background stores and forwards to Sidepanel
   - Sidepanel displays confirmation

2. **AI Generation Flow**
   - Sidepanel sends user message + context
   - Background builds prompt with personalization
   - Forwards to Offscreen document
   - Offscreen calls LanguageModel API
   - Returns generated response
   - Background formats and sends back
   - Sidepanel displays in chat

3. **Model Download Flow**
   - Offscreen document initializes on load
   - Triggers LanguageModel.create()
   - Model download begins automatically
   - Progress events sent to Background
   - Background sends notifications to Sidepanel
   - Toast notifications show progress
   - Ready notification when complete

---

## 🎨 Features in Detail

### 1. Smart LinkedIn Detection & Import
- **Auto-Detection**: Toast prompts automatically appear when you visit LinkedIn profile or company pages
  - Detects `/in/` URLs for profile pages
  - Detects `/company/` URLs for company pages
  - Toast appears within 1-2 seconds of page load
  - Shows profile name and company information
  
- **One-Click Import**: Click the prompt to instantly import profile data
  - Direct import from toast notification
  - No need to open the side panel first
  - Automatic data extraction
  - Instant feedback with loading indicator
  
- **Scenario-Triggered Import**: Selecting Coffee Chat or Networking automatically imports data
  - No separate import step needed
  - Streamlined user experience
  - Automatic data fetching from current page
  - Graceful error handling if not on LinkedIn
  
- **Rich Data Extraction**: Captures name, title, company, experience, education, skills
  - Name: Full name from profile header
  - Title: Current job title
  - Company: Current company name
  - Experience: Work history with dates and descriptions
  - Education: Schools, degrees, and graduation years
  - Skills: Endorsed skills and expertise areas
  
- **Company Analysis**: Extracts company info including about, website, industry, size
  - Company description and mission
  - Official website URL
  - Industry classification
  - Company size (employees)
  - Headquarters location
  
- **Privacy First**: All data stays on your device, never sent to external servers
  - No external API calls for data extraction
  - All processing happens locally
  - Data stored in Chrome's local storage
  - No third-party tracking or analytics
  
- **Smart Fallback**: Clear error messages if not on LinkedIn page
  - "Please navigate to a LinkedIn profile page" if on wrong page
  - Helpful guidance on where to go
  - No silent failures or confusing errors

### 2. Auto Profile Personalization
- **Silent Background Fetch**: Automatically fetches your LinkedIn profile on first install
  - Happens in background without user interaction
  - Triggered during extension initialization
  - No popup or notification required
  - Seamless user experience
  
- **Context Enhancement**: AI uses your profile to personalize responses
  - Your background influences AI recommendations
  - AI considers your experience level
  - Tailors advice based on your career stage
  - Makes suggestions more relevant to your situation
  
- **Relevant Connections**: Highlights shared experiences, companies, or schools
  - Identifies common alma maters
  - Finds shared company experiences
  - Suggests connection points for conversation
  - Makes networking more effective
  
- **Better Questions**: Generates questions that reference your background
  - Questions leverage your expertise
  - Avoids generic or irrelevant topics
  - Creates more meaningful conversations
  - Shows genuine interest and preparation
  
- **One-Time Fetch**: Only fetches once, stored locally for future use
  - Efficient use of resources
  - Profile data cached locally
  - No repeated fetching
  - Faster subsequent uses

### 3. Conversational Chat Interface
- **Multi-Chat Support**: Manage multiple conversations with different people
  - Create unlimited conversations
  - Each conversation is independent
  - Easy switching between chats
  - Organize by person or date
  
- **Chat History Panel**: Collapsible sidebar showing all past conversations
  - Shows all previous conversations
  - Displays target person's name
  - Shows conversation timestamp
  - Quick preview of last message
  - Click to load any previous chat
  
- **Persistent Storage**: All chats saved locally and restored on restart
  - Automatic saving after each message
  - Survives browser restart
  - No data loss
  - Accessible anytime
  
- **Real-Time Responses**: Instant AI-powered replies to your questions
  - Fast response generation (typically 2-5 seconds)
  - No network latency
  - Smooth user experience
  - Immediate feedback
  
- **Scenario Toolbar**: Visual indicator showing active scenario (Coffee Chat/Networking)
  - Shows current scenario with emoji
  - Easy to identify conversation type
  - Quick scenario switching
  - Visual context for responses
  
- **Clean UI**: Modern gradient design with smooth animations
  - Professional appearance
  - Easy to read message bubbles
  - Smooth transitions and animations
  - Responsive design for different screen sizes

### 4. AI-Powered Personalization
- **Context-Aware Responses**: AI references actual companies, roles, and experiences
  - Uses real data from LinkedIn profiles
  - References specific job titles and companies
  - Mentions actual experiences and achievements
  - Creates authentic, relevant responses
  
- **Real Data Usage**: Uses actual names and details from LinkedIn profiles
  - Incorporates target's real name
  - References their actual company
  - Mentions their real job title
  - Uses their actual experience details
  
- **No Generic Templates**: Every response tailored to the specific person
  - Avoids placeholder text like "[Company Name]"
  - Customized for each individual
  - Unique recommendations
  - Personalized advice
  
- **Natural Language**: Conversational, professional tone in English
  - Friendly yet professional
  - Easy to read and understand
  - Natural conversation flow
  - Appropriate formality level
  
- **Follow-up Support**: Ask clarifying questions like "shorter" or "more specific"
  - AI understands context refinements
  - Can adjust response length
  - Can provide more details
  - Maintains conversation history

### 5. Two Optimized Scenarios
- **Coffee Chat Mode** (☕): Deep conversation guide for 30-60 minute meetings
  - Icebreaker questions based on their background
    - Warm opening questions
    - Based on their career history
    - Helps build rapport
  - Industry insights about their company and role
    - Company culture and values
    - Role responsibilities and growth
    - Industry trends and challenges
  - Career advice and skill development guidance
    - Skills to develop
    - Career progression tips
    - Learning resources
    
- **Networking Mode** (🤝): Quick strategy for 2-10 minute career fair interactions
  - Elevator pitch suggestions
    - How to introduce yourself
    - What to highlight
    - How to show interest in them
  - Targeted questions about projects and opportunities
    - Current projects they're working on
    - Career opportunities at their company
    - Quick conversation starters
  - Professional contact exchange approaches
    - How to ask for contact info
    - What to say in follow-up
    - Best practices for networking
    
- **Scenario-Specific**: Questions and advice tailored to each context
  - Different questions for different time frames
  - Appropriate depth for each scenario
  - Context-aware recommendations
  - Optimized for success in each setting
  
- **Professional Guidance**: Best practices and things to avoid
  - What to do for best results
  - Common mistakes to avoid
  - Professional etiquette tips
  - Follow-up recommendations

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

- **`background.js`** (Service Worker):
  - Manages AI service initialization and model prewarming
    - Initializes offscreen document on startup
    - Implements retry logic for model download
    - Monitors model readiness status
  - Routes messages between components
    - Handles messages from content-script
    - Forwards requests to offscreen document
    - Manages response routing back to sidepanel
  - Handles profile/company analysis with AI
    - Builds chat prompts with context
    - Sends analysis requests to Gemini Nano
    - Formats AI responses for display
  - Auto-fetches user's LinkedIn profile on install
    - Triggered during extension initialization
    - Stored in Chrome storage for personalization
    - Used to enhance all AI responses
  - Manages offscreen document lifecycle
    - Creates/maintains offscreen document
    - Handles lifecycle events
    - Manages session state
  
- **`content-script.js`** (LinkedIn Page Injection):
  - Injects into LinkedIn pages
    - Runs on all linkedin.com pages
    - Accesses DOM for data extraction
    - Communicates with background.js
  - Smart detection of profile/company pages
    - Detects `/in/` URLs for profiles
    - Detects `/company/` URLs for companies
    - Ignores other LinkedIn pages
  - Shows toast prompts for import
    - Displays profile name and company
    - Provides one-click import option
    - Dismissible notifications
  - Extracts profile and company data via scrapers
    - Uses dedicated scraper modules
    - Handles various page layouts
    - Graceful fallback for missing data
  
- **`sidepanel.js`** (Chat UI Logic):
  - Chat interface with history panel
    - Renders message bubbles
    - Handles user input
    - Displays AI responses
  - Scenario activation and management
    - Handles Coffee Chat selection
    - Handles Networking selection
    - Manages scenario state
  - Message rendering and state management
    - Maintains conversation state
    - Renders messages with timestamps
    - Handles loading states
  - Handles pending imports and user interactions
    - Manages import flow
    - Handles user messages
    - Manages UI state transitions
  
- **`offscreen.js`** (Chrome AI Integration):
  - Wraps Chrome's LanguageModel API
    - Provides abstraction layer
    - Handles API errors gracefully
    - Manages session lifecycle
  - Manages Gemini Nano session
    - Creates and maintains session
    - Handles session errors
    - Manages resource cleanup
  - Monitors model download progress
    - Tracks download percentage
    - Reports status updates
    - Handles download failures
  - Auto-initializes on page load
    - Triggers model download
    - Sends progress updates
    - Notifies when ready

### Scripts

```bash
# Run tests
npm test

# Create distribution package
npm run zip

# Open demo page
npm run demo
```

### Performance & Optimization

**Model Download Optimization:**
- Lazy loading: Model downloads only when needed
- Background downloading: Doesn't block user interactions
- Retry mechanism: Automatic recovery from download failures
- Progress monitoring: Real-time feedback to user

**Memory Management:**
- Efficient session management in offscreen document
- Proper cleanup of resources
- Minimal memory footprint
- No memory leaks from long-running chats

**Response Generation:**
- Typical response time: 2-5 seconds
- Optimized prompt construction
- Efficient context management
- Streaming responses for large outputs

**Storage Optimization:**
- Compressed chat history
- Efficient data serialization
- Automatic cleanup of old data (optional)
- Minimal storage footprint

**Network Efficiency:**
- No external API calls
- Zero network dependency after model download
- Offline-capable operation
- No background sync or telemetry

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
| "Please open a LinkedIn profile page" | Navigate to a LinkedIn profile page (URL contains `/in/` or `/company/`). Make sure you're on a profile or company page, not the feed or search results. |
| "AI model downloading: X%" | Wait for download to complete (5-15 min first time). Progress shown in toast notifications. Check your internet connection if stuck. |
| AI generation timeout | Wait up to 120 seconds for response. Check Chrome AI flags are enabled in `chrome://flags/`. Restart extension if needed. |
| Generic questions | Verify profile data imported correctly. Check Console: `📊 Profile data:`. Ensure you're on a real LinkedIn profile page. |
| Model download stuck | Check `chrome://components/` → Optimization Guide On Device Model. Try restarting Chrome. Check available disk space (~1.5GB needed). |
| Chat history not showing | Click ⏱️ icon in header to toggle history panel. History is stored locally in Chrome storage. |
| Responses in wrong language | All prompts configured for English. Check Console for errors. Verify Chrome AI is properly initialized. |
| Extension icon not appearing | Reload extension: go to `chrome://extensions/`, find SmartInsight, click reload button. |
| Side panel won't open | Make sure you're on a LinkedIn page. Try clicking extension icon again. Check Console for errors. |
| Profile import fails | Ensure you're on a LinkedIn profile page (URL: `/in/username`). Check Console for specific error messages. Try refreshing the page. |

### Detailed Troubleshooting

**Model Download Issues:**
1. Open `chrome://components/`
2. Find "Optimization Guide On Device Model"
3. Check status (should show "Component updated")
4. If stuck, click "Check for update"
5. Restart Chrome if needed

**Console Debugging:**
1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. Go to Console tab
3. Look for `[OFFSCREEN]`, `[BACKGROUND]`, `[SIDEPANEL]` logs
4. Check for error messages in red
5. Search for specific keywords like "error", "failed", "timeout"

**Extension Reload:**
1. Go to `chrome://extensions/`
2. Find SmartInsight extension
3. Click the reload button (circular arrow)
4. Wait for extension to reinitialize
5. Try using the extension again

**Clear Data:**
1. Go to `chrome://extensions/`
2. Click "Details" on SmartInsight
3. Click "Clear data" button
4. Confirm the action
5. Reload the extension
6. Note: This will delete all saved chats

---

## 🔒 Privacy & Security

### Data Handling

- **No External Servers**: All AI processing happens locally using Chrome's built-in model
  - Gemini Nano runs entirely on your device
  - No API calls to external services
  - No data transmitted over the internet
  - Completely offline-capable after initial model download
  
- **No Data Collection**: We don't collect, store, or transmit any user data
  - No analytics tracking
  - No telemetry collection
  - No user behavior monitoring
  - No data sharing with third parties
  
- **Local Storage Only**: All data is stored in Chrome's local storage on your device
  - Chat history stored in Chrome storage
  - Profile data stored locally
  - Conversation context never leaves your device
  - Data persists across browser sessions
  
- **No Analytics**: No tracking, no telemetry, no third-party services
  - No Google Analytics
  - No Mixpanel or similar services
  - No crash reporting to external servers
  - Complete privacy protection

### Data Security

- **Encryption**: Data stored in Chrome's storage is encrypted by Chrome
- **Access Control**: Only the extension can access stored data
- **No Backups**: Data is not synced to cloud or backed up externally
- **User Control**: You can clear all data anytime via extension settings
- **No Passwords**: Extension doesn't store LinkedIn credentials
- **LinkedIn API**: Only uses public data extraction, no authentication required

### Permissions Explained

| Permission | Purpose | Why Needed |
|------------|---------|-----------|
| `activeTab` | Access current LinkedIn tab for data extraction | Allows reading profile information from the page you're viewing |
| `scripting` | Inject content script into LinkedIn pages | Enables the extension to run on LinkedIn pages and extract data |
| `storage` | Save chat history and preferences locally | Stores conversations and settings in Chrome's local storage |
| `sidePanel` | Display the chat interface | Shows the chat panel on the right side of the browser |
| `notifications` | Show status notifications | Displays toast notifications for model download progress |
| `offscreen` | Run Chrome AI in a separate context | Allows Chrome's LanguageModel API to run in offscreen document |

### What Data is Collected

**Data Extracted from LinkedIn (stays on your device):**
- Profile name, title, company
- Work experience and education
- Skills and endorsements
- Company information (about, website, industry)

**Data Stored Locally:**
- Your LinkedIn profile (for personalization)
- All chat conversations and messages
- Conversation history and timestamps
- Scenario selections

**Data NOT Collected:**
- Your LinkedIn password or credentials
- Your email address
- Your phone number
- Your location
- Your browsing history outside LinkedIn
- Any personal data beyond what's visible on LinkedIn profiles

### Open Source & Transparency

- Full source code available on GitHub
- No obfuscated or minified code
- Community can review and audit the code
- Contributions welcome
- Transparent about all dependencies

---

## 🎯 Chrome AI Challenge 2025

This project is built for the **Chrome Built-in AI Challenge 2025**, showcasing:

### Innovation & Impact

- ✅ **Innovative Use of Chrome AI**: Leverages Gemini Nano v3nano via LanguageModel API for career guidance
  - First-of-its-kind LinkedIn networking assistant using Chrome AI
  - Demonstrates practical real-world application of on-device AI
  - Shows how Chrome AI can solve professional networking challenges
  - Proves viability of local AI for privacy-sensitive applications
  
- ✅ **Privacy-First Design**: 100% on-device processing with zero external API calls
  - No data leaves the user's device
  - No cloud dependencies
  - No third-party services
  - Complete user data sovereignty
  - GDPR and privacy regulation compliant
  
- ✅ **Real-World Application**: Solves actual pain points in job searching and networking
  - Addresses real user need: preparing for networking conversations
  - Helps professionals make better first impressions
  - Reduces anxiety around career networking
  - Provides personalized, context-aware guidance
  - Applicable to millions of job seekers and professionals
  
- ✅ **Excellent UX**: Clean chat interface with real-time progress feedback and smart detection
  - Intuitive one-click scenario selection
  - Real-time model download progress
  - Automatic profile detection and import
  - Clean, modern chat interface
  - Smooth animations and responsive design
  - Helpful error messages and guidance
  
- ✅ **Technical Excellence**: 
  - **Efficient offscreen document architecture**
    - Proper separation of concerns
    - Optimized for performance
    - Clean API abstraction
  - **Robust model download handling with retry logic**
    - 3-attempt retry mechanism
    - Exponential backoff delays
    - Progress monitoring and reporting
    - Graceful error recovery
  - **Multi-conversation state management**
    - Handles unlimited conversations
    - Maintains context for each chat
    - Efficient state persistence
    - Quick conversation switching
  - **Auto profile personalization**
    - Silent background profile fetch
    - Intelligent context enhancement
    - Relevant connection identification
    - Improved response quality
  - **Comprehensive error handling and user feedback**
    - Descriptive error messages
    - Helpful troubleshooting guidance
    - Toast notifications for status updates
    - Console logging for debugging

### Challenge Alignment

- **Demonstrates Chrome AI Capabilities**: Shows what's possible with Gemini Nano
- **Solves Real Problems**: Addresses genuine user needs in professional networking
- **Privacy Leadership**: Sets example for privacy-first AI applications
- **Developer-Friendly**: Open source, well-documented, easy to extend
- **Performance**: Fast, responsive, efficient use of resources
- **Reliability**: Robust error handling and recovery mechanisms

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

## 💡 Best Practices

### For Best Results

**Before Using SmartInsight:**
1. **Complete Your LinkedIn Profile**
   - Add a professional photo
   - Write a compelling headline
   - Include detailed work experience
   - List your skills and endorsements
   - This helps AI personalize responses better

2. **Research the Person**
   - Look at their LinkedIn profile thoroughly
   - Note their background and achievements
   - Identify common connections or experiences
   - SmartInsight will enhance this research

3. **Prepare Your Questions**
   - Think about what you want to learn
   - Consider what value you can offer
   - Plan your conversation goals
   - Use SmartInsight to refine your approach

**While Using SmartInsight:**
1. **Read the Full Response**
   - Don't just skim the AI suggestions
   - Understand the reasoning behind recommendations
   - Adapt suggestions to your personal style
   - Make them authentic to you

2. **Customize the Advice**
   - AI suggestions are starting points
   - Personalize based on your knowledge
   - Add your own insights and experiences
   - Make it natural and conversational

3. **Ask Follow-up Questions**
   - Use "shorter" or "longer" to adjust length
   - Ask for specific aspects (e.g., "focus on technical skills")
   - Request different angles or perspectives
   - Refine until you're satisfied

**During the Conversation:**
1. **Be Authentic**
   - Use the AI suggestions as a guide, not a script
   - Speak naturally and genuinely
   - Show genuine interest in the person
   - Build real connections

2. **Listen Actively**
   - Don't just ask questions
   - Listen carefully to their responses
   - Ask follow-up questions based on what they say
   - Show you're engaged

3. **Take Notes**
   - Write down key points during/after the conversation
   - Note action items and follow-ups
   - Record contact information
   - Use this for future reference

**After the Conversation:**
1. **Follow Up Promptly**
   - Send a thank you message within 24 hours
   - Reference specific points from your conversation
   - Offer value or assistance if possible
   - Keep the relationship warm

2. **Save the Chat**
   - Keep the SmartInsight conversation for reference
   - Review what worked well
   - Learn from the interaction
   - Use insights for future conversations

3. **Build Your Network**
   - Connect on LinkedIn if appropriate
   - Share relevant articles or opportunities
   - Maintain regular contact
   - Nurture the relationship

### Scenario-Specific Tips

**Coffee Chat Tips:**
- Aim for 30-60 minutes of conversation
- Ask deeper, more thoughtful questions
- Explore their career journey in detail
- Discuss challenges and solutions
- Share your own experiences when relevant
- Look for mentorship opportunities

**Networking Event Tips:**
- Keep conversations to 2-10 minutes
- Focus on making a good first impression
- Ask one or two strong questions
- Exchange contact information
- Plan to follow up later
- Collect business cards or LinkedIn connections

### Maximizing AI Assistance

1. **Provide Context**
   - Tell the AI about your background
   - Mention your career goals
   - Share relevant experiences
   - This helps personalization

2. **Iterate and Refine**
   - Don't settle for the first response
   - Ask for variations
   - Request different perspectives
   - Keep refining until it's perfect

3. **Learn from Patterns**
   - Notice what questions work well
   - Identify your most effective approaches
   - Build your own conversation style
   - Improve over time

4. **Combine with Other Tools**
   - Use LinkedIn's search to research people
   - Check company websites for context
   - Review recent news about the company
   - SmartInsight works best with preparation

### Privacy Best Practices

1. **Be Mindful of Sensitive Information**
   - Don't share passwords or sensitive data
   - Keep personal information private
   - Be careful with confidential company info
   - Remember conversations are stored locally

2. **Regular Data Cleanup**
   - Periodically review saved conversations
   - Delete conversations you no longer need
   - Clear data before sharing your computer
   - Maintain privacy hygiene

3. **Secure Your Device**
   - Use strong passwords
   - Enable two-factor authentication
   - Keep Chrome updated
   - Use antivirus software

---

## ❓ FAQ

### General Questions

**Q: Is SmartInsight free?**
A: Yes! SmartInsight is completely free. There are no subscriptions, no API keys required, and no hidden costs. The extension is open source and available on GitHub.

**Q: Do I need an API key or account?**
A: No. SmartInsight uses Chrome's built-in AI (Gemini Nano), which requires no API keys or external accounts. Everything runs locally on your device.

**Q: What data does SmartInsight collect?**
A: SmartInsight collects NO data. All processing happens locally on your device. Your LinkedIn profile data, conversations, and chat history are stored only in your browser's local storage. Nothing is sent to external servers.

**Q: Is my data safe?**
A: Yes. Your data is completely safe because:
- All AI processing happens locally on your device
- No external API calls are made
- Data is stored in Chrome's encrypted local storage
- No third-party services have access to your data
- You can delete all data anytime

**Q: Can I use SmartInsight offline?**
A: After the initial model download (~1.5GB), yes! SmartInsight works completely offline. The Gemini Nano model is stored locally on your device.

### Technical Questions

**Q: What are the system requirements?**
A: You need:
- Chrome Canary (version 127 or higher)
- ~1.5GB free disk space for the AI model
- Chrome AI flags enabled (see Quick Start section)

**Q: Why do I need Chrome Canary?**
A: Chrome's built-in AI (LanguageModel API) is currently only available in Chrome Canary. It will be available in stable Chrome in the future.

**Q: How long does the model download take?**
A: The initial download typically takes 5-15 minutes depending on your internet connection speed. Subsequent uses are instant.

**Q: Can I use SmartInsight on multiple computers?**
A: Yes, but you need to install and set up the extension on each computer separately. Each installation has its own local model and data storage.

**Q: Does SmartInsight work on mobile?**
A: Not currently. SmartInsight is a Chrome extension and only works on desktop/laptop Chrome browsers.

### Feature Questions

**Q: Can I use SmartInsight with other LinkedIn profiles?**
A: Yes! You can create conversations with any LinkedIn profile. Just navigate to their profile page and select a scenario. Each conversation is independent.

**Q: How many conversations can I have?**
A: Unlimited! You can create as many conversations as you want. They're all stored locally and easily accessible from the history panel.

**Q: Can I export my conversations?**
A: Currently, conversations are stored locally in your browser. You can copy and paste conversations manually. Export to PDF/Markdown is planned for a future release.

**Q: What if the AI gives bad advice?**
A: The AI provides suggestions based on LinkedIn profile information. Always use your judgment and verify information independently. The AI is a tool to help you prepare, not a replacement for your own research and judgment.

**Q: Can I customize the scenarios?**
A: Currently, Coffee Chat and Networking scenarios are built-in. Custom scenarios are planned for future releases. You can request specific scenarios via GitHub Issues.

### Troubleshooting Questions

**Q: The extension icon doesn't appear. What should I do?**
A: Try these steps:
1. Go to `chrome://extensions/`
2. Find SmartInsight
3. Click the reload button
4. Make sure you're on a LinkedIn page
5. Try clicking the extension icon again

**Q: The AI model won't download. What should I do?**
A: Try these steps:
1. Check your internet connection
2. Ensure you have ~1.5GB free disk space
3. Go to `chrome://components/`
4. Find "Optimization Guide On Device Model"
5. Click "Check for update"
6. Restart Chrome

**Q: The AI is responding in the wrong language. What should I do?**
A: SmartInsight is configured to respond in English. If you're getting responses in another language:
1. Check the Console for errors (F12)
2. Reload the extension
3. Try again with a fresh conversation

**Q: I'm getting a timeout error. What should I do?**
A: Timeout errors can happen if:
1. The AI model is still downloading (wait for "AI model ready" notification)
2. Your internet connection is slow
3. Your computer is low on resources
Try waiting a few minutes and trying again.

### Privacy & Security Questions

**Q: Does SmartInsight track my activity?**
A: No. SmartInsight has no analytics, no telemetry, and no tracking. We don't know how many users there are or how the extension is being used.

**Q: Can SmartInsight access my LinkedIn password?**
A: No. SmartInsight only reads publicly visible information from LinkedIn profiles. It doesn't require or store your LinkedIn credentials.

**Q: Is my data synced to the cloud?**
A: No. All data is stored only in your local Chrome storage. It's not synced to Google Drive or any cloud service unless you explicitly enable Chrome sync.

**Q: What happens to my data if I uninstall the extension?**
A: All data is deleted when you uninstall the extension. You can back up your data before uninstalling if needed.

**Q: Is the source code open?**
A: Yes! SmartInsight is open source. You can review the entire codebase on GitHub to verify privacy and security claims.

### Contribution Questions

**Q: Can I contribute to SmartInsight?**
A: Yes! Contributions are welcome. Please see the Contributing section for guidelines.

**Q: How can I report a bug?**
A: Please report bugs via GitHub Issues with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Console error messages (if any)

**Q: How can I request a feature?**
A: Please submit feature requests via GitHub Issues. Include:
- Description of the feature
- Why it would be useful
- How it fits with SmartInsight's mission

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ChiaraVan1/smart-insight-chrome-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ChiaraVan1/smart-insight-chrome-ai/discussions)

---

## 🔄 Comparison with Other Tools

### SmartInsight vs. Traditional AI Services

| Feature | SmartInsight | ChatGPT | Claude | Gemini |
|---------|--------------|---------|--------|--------|
| **Privacy** | 100% Local | Cloud-based | Cloud-based | Cloud-based |
| **Cost** | Free | $20/month | $20/month | Free (limited) |
| **Internet Required** | No (after download) | Yes | Yes | Yes |
| **Data Collection** | None | Yes | Yes | Yes |
| **LinkedIn Integration** | Native | Manual | Manual | Manual |
| **Offline Capable** | Yes | No | No | No |
| **Setup Time** | 5-15 min | Instant | Instant | Instant |
| **Response Speed** | 2-5 sec | 5-30 sec | 5-30 sec | 5-30 sec |
| **Personalization** | Automatic | Manual | Manual | Manual |
| **Scenario-Specific** | Yes (2 modes) | Generic | Generic | Generic |

### Why Choose SmartInsight?

**Privacy & Security:**
- ✅ No data leaves your device
- ✅ No account or login required
- ✅ No tracking or analytics
- ✅ GDPR compliant
- ❌ Other tools: Send data to cloud servers

**Cost:**
- ✅ Completely free
- ✅ No subscriptions
- ✅ No API costs
- ✅ Open source
- ❌ Other tools: $20/month or more

**Convenience:**
- ✅ Works offline
- ✅ Automatic profile detection
- ✅ One-click scenario selection
- ✅ Integrated with LinkedIn
- ❌ Other tools: Require manual setup

**Performance:**
- ✅ Fast responses (2-5 seconds)
- ✅ No network latency
- ✅ Runs locally
- ✅ Always available
- ❌ Other tools: Depend on internet speed

**Specialization:**
- ✅ Optimized for networking
- ✅ LinkedIn-specific features
- ✅ Career-focused scenarios
- ✅ Professional guidance
- ❌ Other tools: Generic AI assistants

### When to Use SmartInsight vs. Alternatives

**Use SmartInsight when:**
- You want maximum privacy
- You're preparing for LinkedIn networking
- You want free, no-subscription tools
- You need offline capability
- You want automatic profile integration
- You're on a budget

**Use other AI tools when:**
- You need general-purpose AI assistance
- You want advanced reasoning capabilities
- You need multi-modal input (images, etc.)
- You want real-time web search integration
- You need specialized domain knowledge
- You want to compare multiple AI responses

**Ideal Combination:**
- Use SmartInsight for LinkedIn networking prep
- Use ChatGPT/Claude for general writing and research
- Use Gemini for web search and real-time info
- Use SmartInsight for privacy-sensitive conversations

---

## 🗺️ Roadmap

### Current Features (v3.0.0)
- ✅ Coffee Chat and Networking scenarios
  - Optimized conversation guides for different time frames
  - Scenario-specific questions and advice
  - Professional guidance and best practices
  
- ✅ LinkedIn profile and company data import
  - Automatic profile detection
  - Rich data extraction
  - Company information analysis
  
- ✅ Multi-chat conversation management
  - Unlimited conversations
  - Easy switching between chats
  - Persistent history
  
- ✅ Auto profile personalization
  - Silent background fetch
  - Context-aware responses
  - Relevant connection identification
  
- ✅ Smart page detection with toast prompts
  - Automatic detection on LinkedIn pages
  - One-click import from toast
  - Helpful notifications
  
- ✅ Real-time model download progress
  - Visual progress indicators
  - Status notifications
  - Retry logic with automatic recovery
  
- ✅ Chat history with persistent storage
  - Automatic saving
  - Easy access and organization
  - Timestamped conversations

### Planned Features (v3.1.0 - Near Term)
- [ ] **Additional Scenarios**
  - Interview Preparation: Technical and behavioral interview tips
  - Salary Negotiation: Strategies and talking points
  - Cold Email: Outreach templates and personalization
  - Mentor Matching: Finding and approaching mentors
  
- [ ] **Export Capabilities**
  - Export chat history to PDF
  - Export to Markdown format
  - Email conversation summaries
  - Share conversation snippets
  
- [ ] **Enhanced Data Analysis**
  - Job posting analysis and application tips
  - Skills gap identification
  - Career path recommendations
  - Salary insights based on role and company

### Future Features (v3.2.0+ - Long Term)
- [ ] **Company Insights**
  - Company culture insights from LinkedIn company pages
  - Employee reviews and ratings integration
  - Company growth and hiring trends
  - Industry comparison and benchmarking
  
- [ ] **Follow-up System**
  - Follow-up reminder system with notifications
  - Email template generation
  - LinkedIn message suggestions
  - Conversation notes and action items
  
- [ ] **Interactive Practice**
  - Conversation practice mode with AI role-play
  - Real-time feedback on responses
  - Recording and playback of practice sessions
  - Performance metrics and improvement tips
  
- [ ] **Localization**
  - Multi-language support (Spanish, French, German, etc.)
  - Localized LinkedIn profile detection
  - Language-specific AI responses
  - Regional customization
  
- [ ] **UI Enhancements**
  - Browser action popup for quick access
  - Keyboard shortcuts for common actions
  - Dark mode support
  - Customizable UI themes
  
- [ ] **Advanced Features**
  - Integration with calendar for meeting prep
  - CRM integration for contact management
  - LinkedIn connection tracking
  - Networking analytics and insights

### Community-Driven Features
- Contributions welcome for any of the above features
- Feature requests via GitHub Issues
- Community voting on priority features
- Open to collaboration and partnerships

---

<div align="center">

**Made with ❤️ using Chrome Built-in AI (Gemini Nano v3nano)**

[⭐ Star this repo](https://github.com/ChiaraVan1/smart-insight-chrome-ai) | [🐛 Report Bug](https://github.com/ChiaraVan1/smart-insight-chrome-ai/issues) | [💡 Request Feature](https://github.com/ChiaraVan1/smart-insight-chrome-ai/issues)

</div>
