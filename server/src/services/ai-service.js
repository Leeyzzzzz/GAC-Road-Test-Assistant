const ZhiPuAdapter = require('./zhipu-adapter');
const QwenAdapter = require('./qwen-adapter');
const path = require('path');

// Resolve relative web URL (/uploads/xxx) to absolute filesystem path
function resolveAudioUrl(audioUrl) {
  if (audioUrl && audioUrl.startsWith('/uploads/')) {
    return path.join(__dirname, '..', '..', 'uploads', path.basename(audioUrl));
  }
  return audioUrl;
}

// Singleton adapter - auto-detect by env var
// Set ZHIPU_API_KEY to use ZhiPu (智谱), or DASHSCOPE_API_KEY to use Qwen (通义千问)
let adapter = null;

function getAdapter() {
  if (!adapter) {
    if (process.env.ZHIPU_API_KEY) {
      adapter = new ZhiPuAdapter();
      console.log('AI适配器: 智谱GLM (glm-asr-2512 + glm-4-flash)');
    } else if (process.env.DASHSCOPE_API_KEY) {
      adapter = new QwenAdapter();
      console.log('AI适配器: 通义千问 (qwen3-asr-flash + qwen-plus)');
    } else {
      // No API key configured - use mock
      const MockAdapter = require('./mock-adapter');
      adapter = new MockAdapter();
      console.log('AI适配器: Mock (未配置API Key，请设置 ZHIPU_API_KEY 或 DASHSCOPE_API_KEY)');
    }
  }
  return adapter;
}

function setAdapter(newAdapter) {
  adapter = newAdapter;
}

async function speechToText(audioUrl) {
  return getAdapter().speechToText(resolveAudioUrl(audioUrl));
}

async function extractFields(text) {
  return getAdapter().extractFields(text);
}

module.exports = { getAdapter, setAdapter, speechToText, extractFields, resolveAudioUrl };
