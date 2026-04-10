// AI 适配器接口 - 可插拔设计
// 所有适配器必须实现这两个方法

class BaseAIAdapter {
  /**
   * 语音转文字
   * @param {string} audioUrl - 音频文件 URL 或 base64 data URI
   * @returns {Promise<string>} 转写文字
   */
  async speechToText(audioUrl) {
    throw new Error('speechToText not implemented');
  }

  /**
   * 结构化提取
   * @param {string} text - 路测记录文字
   * @returns {Promise<{summary: string, problemType: string, severity: string, details: string}>}
   */
  async extractFields(text) {
    throw new Error('extractFields not implemented');
  }
}

module.exports = BaseAIAdapter;
