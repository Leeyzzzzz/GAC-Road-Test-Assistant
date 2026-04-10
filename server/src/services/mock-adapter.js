const BaseAIAdapter = require('./base-adapter');

class MockAdapter extends BaseAIAdapter {
  async speechToText(audioUrl) {
    return '模拟语音转文字结果：前方发现障碍物需要紧急避让';
  }

  async extractFields(text) {
    return {
      summary: '前方障碍物紧急避让',
      problemType: '感知异常',
      severity: '一般',
      details: '行驶过程中前方出现障碍物，系统进行了紧急避让操作',
    };
  }
}

module.exports = MockAdapter;
