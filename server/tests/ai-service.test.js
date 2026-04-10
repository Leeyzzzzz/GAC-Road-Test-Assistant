const MockAdapter = require('../src/services/mock-adapter');
const QwenAdapter = require('../src/services/qwen-adapter');
const { setAdapter, speechToText, extractFields } = require('../src/services/ai-service');

describe('AI Service Layer', () => {
  beforeEach(() => {
    setAdapter(new MockAdapter());
  });

  test('speechToText returns text from mock adapter', async () => {
    const text = await speechToText('any-url');
    expect(text).toContain('障碍物');
  });

  test('extractFields returns structured data from mock adapter', async () => {
    const result = await extractFields('测试文字');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('problemType');
    expect(result).toHaveProperty('severity');
    expect(result.problemType).toBe('感知异常');
  });

  test('adapter is pluggable - can switch implementation', async () => {
    const customAdapter = new MockAdapter();
    customAdapter.speechToText = async () => 'custom result';
    setAdapter(customAdapter);
    const text = await speechToText('url');
    expect(text).toBe('custom result');
  });
});

describe('QwenAdapter', () => {
  test('has required methods', () => {
    const adapter = new QwenAdapter({ apiKey: 'test-key' });
    expect(typeof adapter.speechToText).toBe('function');
    expect(typeof adapter.extractFields).toBe('function');
  });

  test('constructor uses defaults when no config provided', () => {
    const adapter = new QwenAdapter();
    expect(adapter.asrModel).toBe('qwen3-asr-flash');
    expect(adapter.chatModel).toBe('qwen-plus');
    expect(adapter.baseUrl).toContain('dashscope');
  });
});
