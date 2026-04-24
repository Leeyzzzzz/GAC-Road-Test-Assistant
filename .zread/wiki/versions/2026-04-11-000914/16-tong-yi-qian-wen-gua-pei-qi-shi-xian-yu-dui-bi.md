本文深入解析 **QwenAdapter**（通义千问适配器）的完整实现，并将其与 [智谱 GLM 适配器实现（ASR + 结构化提取）](15-zhi-pu-glm-gua-pei-qi-shi-xian-asr-jie-gou-hua-ti-qu) 进行多维度对比。读者将理解通义千问适配器如何利用 DashScope 的 **OpenAI 兼容模式**大幅简化 ASR 调用，以及在结构化提取中如何通过原生 JSON 模式提高输出可靠性。

Sources: [qwen-adapter.js](server/src/services/qwen-adapter.js#L1-L104), [base-adapter.js](server/src/services/base-adapter.js#L1-L25)

## 架构定位：适配器体系中的第二候选人

通义千问适配器在[可插拔适配器模式：BaseAdapter 抽象与单例选择器](14-ke-cha-ba-gua-pei-qi-mo-shi-baseadapter-chou-xiang-yu-dan-li-xuan-ze-qi)体系中处于 **次优先级**。`ai-service.js` 的自动检测逻辑按 `ZHIPU_API_KEY` → `DASHSCOPE_API_KEY` → Mock 降级的顺序选择适配器。仅当环境变量中未配置 `ZHIPU_API_KEY` 但存在 `DASHSCOPE_API_KEY` 时，QwenAdapter 才会被实例化并注册为全局单例。这一设计将通义千问定位为智谱 GLM 的 **备选方案**，适用于需要多云容灾或对阿里云生态有依赖的部署场景。

Sources: [ai-service.js](server/src/services/ai-service.js#L14-L33)

## 构造函数与配置体系

QwenAdapter 的构造函数遵循与 ZhiPuAdapter 完全一致的 **配置注入模式**——支持通过 `config` 参数覆盖任何默认值，未提供时依次回退到环境变量和硬编码默认值：

```javascript
constructor(config = {}) {
  super();
  this.apiKey = config.apiKey || process.env.DASHSCOPE_API_KEY;
  this.baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  this.asrModel = config.asrModel || 'qwen3-asr-flash';
  this.chatModel = config.chatModel || 'qwen-plus';
}
```

| 配置项 | 环境变量 | 默认值 | 用途 |
|--------|----------|--------|------|
| `apiKey` | `DASHSCOPE_API_KEY` | — | 阿里云 DashScope API 密钥 |
| `baseUrl` | — | `https://dashscope.aliyuncs.com/compatible-mode/v1` | **OpenAI 兼容模式**端点 |
| `asrModel` | — | `qwen3-asr-flash` | 语音识别模型标识 |
| `chatModel` | — | `qwen-plus` | 结构化提取用对话模型 |

注意 `baseUrl` 中包含的 `/compatible-mode/v1` 路径段——这是通义千问适配器实现如此简洁的 **核心架构决策**。DashScope 提供了 OpenAI 兼容的 API 网关，使得所有请求（包括 ASR）都通过统一的 `chat/completions` 端点完成，无需适配专有的 multipart 上传协议。

Sources: [qwen-adapter.js](server/src/services/qwen-adapter.js#L19-L26)

## ASR 实现：Chat Completions 统一通道

通义千问适配器的 `speechToText` 方法是其与智谱 GLM 适配器差异最大的部分。它没有使用独立的 `/audio/transcriptions` 端点，而是将 ASR 请求伪装成一个 **多模态对话请求**，通过 `chat/completions` 端点传递音频：

```
┌──────────────────────────────────────────────────────────────┐
│                   QwenAdapter.speechToText                   │
│                                                              │
│  audioUrl ──► POST /chat/completions ──► { content: "..." }  │
│               │ model: qwen3-asr-flash                       │
│               │ messages[0].content[0]:                       │
│               │   { type: "input_audio",                     │
│               │     input_audio: { data: audioUrl } }        │
│               │ extra_body.asr_options:                      │
│               │   { enable_itn: false }                      │
└──────────────────────────────────────────────────────────────┘
```

关键实现细节如下：音频输入通过 `input_audio` 类型的 content part 传递，`data` 字段直接接收 `audioUrl`（可以是 HTTP URL 或 base64 data URI）。`extra_body.asr_options.enable_itn` 被显式设为 `false`，禁用了逆文本标准化——即 ASR 输出将保持口语化形式（如 "一百二十" 而非 "120"），这对路测场景中保留原始口述内容至关重要。响应解析则遵循标准 OpenAI 格式 `data.choices[0].message.content`。

Sources: [qwen-adapter.js](server/src/services/qwen-adapter.js#L28-L62)

## 结构化提取：原生 JSON 模式的优势

`extractFields` 方法调用 `qwen-plus` 模型执行路测文字的结构化信息提取。其 Prompt 与 ZhiPuAdapter 中完全一致（`EXTRACT_PROMPT`），要求输出包含 `summary`、`problemType`、`severity`、`details` 四个字段的 JSON。但 QwenAdapter 在请求参数中额外启用了 DashScope 的 **原生 JSON 输出模式**：

```javascript
response_format: { type: 'json_object' }
```

这一参数指示模型在 token 生成阶段直接约束输出为合法 JSON，从根本上消除了模型输出 Markdown 代码块包裹（如 ` ```json ... ``` `）或其他非 JSON 前缀后缀的可能性。配合 `temperature: 0.1` 的低温采样，QwenAdapter 在结构化提取的输出稳定性上具有架构性优势。

即使启用了 JSON 模式，代码仍保留了两层防御性解析：首先尝试直接 `JSON.parse`；失败后通过正则 `content.match(/\{[\s\S]*\}/)` 提取第一个 JSON 对象再解析。这一 fallback 逻辑与 ZhiPuAdapter 完全对称，确保在极端情况下（如模型忽略 `response_format` 指令）仍能恢复。

Sources: [qwen-adapter.js](server/src/services/qwen-adapter.js#L64-L100)

## 多维度对比：QwenAdapter vs ZhiPuAdapter

以下是两个适配器在所有关键架构维度上的系统对比：

| 维度 | QwenAdapter（通义千问） | ZhiPuAdapter（智谱 GLM） |
|------|------------------------|------------------------|
| **代码行数** | 104 行 | 176 行（多 69%） |
| **API 协议** | OpenAI 兼容模式（`compatible-mode/v1`） | 智谱专有 API（`/api/paas/v4`） |
| **ASR 端点** | `chat/completions`（统一端点） | `/audio/transcriptions`（独立端点） |
| **ASR 音频传递** | URL/Data URI 作为 message content | multipart form-data 上传二进制 |
| **外部依赖** | 零（纯 `fetch`） | `form-data` npm 包 |
| **音频输入格式** | URL / Data URI（由 DashScope 服务端处理） | 本地路径 / HTTP URL / Base64（客户端预处理） |
| **JSON 输出约束** | `response_format: { type: 'json_object' }`（原生支持） | 仅依赖 Prompt 指令 |
| **ASR 模型** | `qwen3-asr-flash` | `glm-asr-2512` |
| **Chat 模型** | `qwen-plus` | `glm-4-flash` |
| **API Key 环境变量** | `DASHSCOPE_API_KEY` | `ZHIPU_API_KEY` |
| **选择优先级** | 次选（第二顺位） | 首选（第一顺位） |
| **Multipart 辅助方法** | 不需要 | `_postMultipart` 处理 Buffer 转发 |

### ASR 架构差异的核心本质

两个适配器在 ASR 方面的根本分歧在于 **音频数据的处理责任归属**：

```
┌─────────────────────────────────────────────────────────────────────┐
│                        音频数据流对比                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ZhiPu (客户端负责):                                                │
│  audioUrl ──► 判断格式 ──► 读取/下载/解码 ──► Buffer                │
│              (本地路径?   fs.readFileSync     │                     │
│               HTTP URL?  fetch.arrayBuffer   │                     │
│               Base64?    Buffer.from)        │                     │
│              ──► FormData 封装 ──► multipart POST ──► 响应          │
│                                                                     │
│  Qwen (服务端负责):                                                  │
│  audioUrl ──► 嵌入 JSON message ──► POST JSON ──► 响应              │
│              (DashScope 服务端自行                                    │
│               下载/解码音频)                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

ZhiPuAdapter 需要在 Node.js 进程内完成音频文件的读取、下载或 Base64 解码，然后通过 `form-data` 库组装 multipart 请求体——这一流程占用了近 90 行代码（第 30–134 行）。而 QwenAdapter 将音频 URL 直接传递给 DashScope 服务端，由服务端负责资源获取和格式转换，客户端代码缩减到 35 行。这种设计权衡了 **网络开销**（多一次服务端到服务端的下载）与 **代码复杂度**（零依赖、极简实现）。

Sources: [zhipu-adapter.js](server/src/services/zhipu-adapter.js#L30-L134), [qwen-adapter.js](server/src/services/qwen-adapter.js#L28-L62)

## 可测试性设计

QwenAdapter 的构造函数设计使得 **无网络环境下的单元测试** 成为可能。测试套件通过直接注入 `config` 绕过环境变量依赖，验证构造函数的默认值回退逻辑：

```javascript
test('constructor uses defaults when no config provided', () => {
  const adapter = new QwenAdapter();
  expect(adapter.asrModel).toBe('qwen3-asr-flash');
  expect(adapter.chatModel).toBe('qwen-plus');
  expect(adapter.baseUrl).toContain('dashscope');
});
```

在 `ai-service.test.js` 的集成层面，测试通过 `setAdapter()` 注入 MockAdapter 来验证适配器可插拔性——这一机制对 QwenAdapter 和 ZhiPuAdapter 均透明生效，体现了 [可插拔适配器模式](14-ke-cha-ba-gua-pei-qi-mo-shi-xiang-yu-dan-li-xuan-ze-qi) 的架构优势。

Sources: [ai-service.test.js](server/tests/ai-service.test.js#L32-L45)

## 何时选择通义千问适配器

基于代码层面的实证分析，以下场景适合切换到 QwenAdapter：

1. **已有阿里云 DashScope 账户**——避免在两个云平台分别充值，直接复用现有 API Key
2. **需要最小化外部依赖**——QwenAdapter 零额外 npm 依赖，对 Docker 镜像体积和供应链安全有利
3. **追求结构化输出的高可靠性**——`response_format: { type: 'json_object' }` 提供模型层面的 JSON 保证，优于纯 Prompt 约束
4. **音频源均为 HTTP URL**——当音频始终以 URL 形式传递时，DashScope 的服务端下载模式消除了客户端的格式判断逻辑

切换方式只需在 `.env` 中注释掉 `ZHIPU_API_KEY` 并取消注释 `DASHSCOPE_API_KEY`，填入有效的 DashScope API Key 即可。无需修改任何路由或前端代码。

Sources: [.env.example](server/.env.example#L1-L9), [ai-service.js](server/src/services/ai-service.js#L18-L24)

## 延伸阅读

- 上一节：[智谱 GLM 适配器实现（ASR + 结构化提取）](15-zhi-pu-glm-gua-pei-qi-shi-xian-asr-jie-gou-hua-ti-qu)——理解首选适配器的 multipart 上传机制
- 下一节：[Mock 适配器：无 API Key 时的降级方案](17-mock-gua-qi-wu-api-key-shi-de-jiang-ji-fang-an)——了解开发环境下的零成本替代方案
- 关联：[可插拔适配器模式：BaseAdapter 抽象与单例选择器](14-ke-cha-ba-gua-pei-qi-mo-shi-baseadapter-chou-xiang-yu-dan-li-xuan-ze-qi)——适配器体系的设计模式基础
- 关联：[环境变量配置与 API Key 管理](25-huan-jing-bian-liang-pei-zhi-yu-api-key-guan-li)——两个 API Key 的运维配置细节