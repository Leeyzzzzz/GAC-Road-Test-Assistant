const BaseAIAdapter = require('./base-adapter');
const fs = require('fs');
const path = require('path');

const EXTRACT_PROMPT = `你是一个路测问题分析助手。请从以下路测记录文字中提取结构化信息。

请以JSON格式返回：
{
  "summary": "一句话问题描述",
  "problemType": "感知异常|规划异常|控制异常|接管|系统故障|其他",
  "severity": "致命|严重|一般|轻微",
  "details": "补充细节描述"
}

注意：
- problemType 只能是上述6种之一
- severity 基于描述的紧急程度判断
- 如果信息不足，尽量根据上下文推断，不确定的字段填 null
- 只返回JSON，不要其他内容`;

class ZhiPuAdapter extends BaseAIAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.ZHIPU_API_KEY;
    this.baseUrl = config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4';
    this.asrModel = config.asrModel || 'glm-asr-2512';
    this.chatModel = config.chatModel || 'glm-4-flash';
  }

  // Helper: send multipart form via Node.js native fetch
  // form-data npm stream is incompatible with native fetch, must use getBuffer()
  async _postMultipart(url, form) {
    const formBuffer = form.getBuffer();
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Length': formBuffer.length.toString(),
        ...form.getHeaders(),
      },
      body: formBuffer,
    });
  }

  async speechToText(audioPathOrUrl) {
    const url = `${this.baseUrl}/audio/transcriptions`;

    // If it's a local file path (starts with / or drive letter), read and send as multipart
    if (audioPathOrUrl.startsWith('/') || audioPathOrUrl.startsWith('file://') || /^[A-Za-z]:/.test(audioPathOrUrl)) {
      const filePath = audioPathOrUrl.replace(/^file:\/\/\/?/, '/');
      const fileName = path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const mimeType = ext === '.mp3' ? 'audio/mpeg' : 'audio/wav';

      const FormData = require('form-data');
      const form = new FormData();
      form.append('model', this.asrModel);
      form.append('stream', 'false');
      form.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

      const response = await this._postMultipart(url, form);

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`ZhiPu ASR error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      return data.text || '';
    }

    // If it's a URL (http/https), download first then send
    if (audioPathOrUrl.startsWith('http')) {
      const audioResp = await fetch(audioPathOrUrl);
      if (!audioResp.ok) {
        throw new Error(`Failed to download audio: ${audioResp.status}`);
      }
      const arrayBuffer = await audioResp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Guess mime from URL
      const urlPath = new URL(audioPathOrUrl).pathname;
      const ext = path.extname(urlPath).toLowerCase();
      const mimeType = ext === '.mp3' ? 'audio/mpeg' : 'audio/wav';
      const fileName = 'audio' + ext;

      const FormData = require('form-data');
      const form = new FormData();
      form.append('model', this.asrModel);
      form.append('stream', 'false');
      form.append('file', buffer, { filename: fileName, contentType: mimeType });

      const response = await this._postMultipart(url, form);

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`ZhiPu ASR error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      return data.text || '';
    }

    // Base64 data URI
    if (audioPathOrUrl.startsWith('data:')) {
      const matches = audioPathOrUrl.match(/^data:(audio\/\w+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid base64 audio format');
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType === 'audio/mpeg' ? '.mp3' : '.wav';

      const FormData = require('form-data');
      const form = new FormData();
      form.append('model', this.asrModel);
      form.append('stream', 'false');
      form.append('file', buffer, { filename: 'audio' + ext, contentType: mimeType });

      const response = await this._postMultipart(url, form);

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`ZhiPu ASR error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      return data.text || '';
    }

    throw new Error('Unsupported audio input format');
  }

  async extractFields(text) {
    const url = `${this.baseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.chatModel,
        messages: [
          { role: 'system', content: EXTRACT_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ZhiPu Chat error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error('Failed to parse ZhiPu response as JSON');
    }
  }
}

module.exports = ZhiPuAdapter;
