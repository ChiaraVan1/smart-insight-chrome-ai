// offscreen.js —— 使用 LanguageModel（Gemini Nano v3nano）最小实现
// 说明：由 background.js 通过 chrome.runtime.sendMessage 调用本页
console.log('[OFFSCREEN] ready');

let session = null;

// 统一会话配置：指定输出语言（否则会有控制台警告）
const LM_OPTS = {
  expectedInputs:  [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
  monitor(m) {
    // 首次需要时会触发模型下载；这里监听进度方便调试
    m.addEventListener('downloadprogress', (e) => {
      const pct = Math.round((e.loaded || 0) * 100);
      console.log('[OFFSCREEN][LM] downloading:', pct + '%');
    });
  }
};

// 懒加载 + 单例会话
async function getSession() {
  if (!('LanguageModel' in self)) {
    throw new Error('LanguageModel API is not available in offscreen context (Windows 环境出现).');
  }
  if (!session) {
    const a = await LanguageModel.availability(LM_OPTS);
    if (a === 'unavailable') throw new Error('On-device model unavailable');
    session = await LanguageModel.create(LM_OPTS);
  }
  return session;
}

// 跑一条 prompt（最小封装）
async function runPrompt(text) {
  const s = await getSession();
  const reply = await s.prompt(text);
  return reply;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
   
  // Offscreen 只处理 OFFSCREEN_*，其余一律忽略
  if (!msg?.action?.startsWith?.('OFFSCREEN_')) {
    return;  // 不 sendResponse，也不 return true，让 SW 去处理
  }

  (async () => {
    if (!msg || !msg.action) return;

    if (msg.action === 'OFFSCREEN_SMOKE') {
      await getSession();
      sendResponse({ ok: true, data: 'OK' });
      return;
    }

    if (msg.action === 'OFFSCREEN_PROMPT') {
      const { text } = msg;
      if (!text || typeof text !== 'string') {
        sendResponse({ ok: false, error: 'Missing text' });
        return;
      }
      const out = await runPrompt(text);
      sendResponse({ ok: true, data: out });
      return;
    }

    if (msg.action === 'OFFSCREEN_SUMMARY') {
      const { text: raw, url } = msg;
      const prompt = [
        'Summarize the following content into 5 concise bullet points.',
        'Be specific and avoid generic advice.',
        url ? `Source URL: ${url}` : '',
        '',
        raw || ''
      ].join('\n');
      const out = await runPrompt(prompt);
      sendResponse({ ok: true, data: out });
      return;
    }

    // 改: 预热（提前 materialize）
    if (msg.action === 'OFFSCREEN_PREWARM') {
      const s = await getSession();        // 触发 LanguageModel.create(...)
      try { await s.prompt('OK'); } catch (_) {} // 一句短 prompt 进一步预热
      sendResponse({ ok: true });
      return;
    }


    sendResponse({ ok: false, error: 'Unknown offscreen action: ' + msg.action });
  })().catch(err => {
    sendResponse({ ok: false, error: String(err?.message || err) });
  });

  return true; // ← 必须：告知异步 sendResponse
});

