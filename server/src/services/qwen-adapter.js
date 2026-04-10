const BaseAIAdapter = require('./base-adapter');

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

class QwenAdapter extends BaseAIAdapter {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.DASHSCOPE_API_KEY;
    this.baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.asrModel = config.asrModel || 'qwen3-asr-flash';
    this.chatModel = config.chatModel || 'qwen-plus';
  }

  async speechToText(audioUrl) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.asrModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: { data: audioUrl },
              },
            ],
          },
        ],
        stream: false,
        extra_body: {
          asr_options: { enable_itn: false },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ASR API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async extractFields(text) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Chat API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      return JSON.parse(content);
    } catch {
      // Try to extract JSON from the response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}

module.exports = QwenAdapter;
