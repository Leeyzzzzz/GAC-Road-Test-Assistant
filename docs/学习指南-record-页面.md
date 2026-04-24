# record/index.vue 页面完全解析

## 一句话总结
这个页面让副驾驾员通过语音快速记录问题，系统自动转录、AI分析、后端存储。

---

## 📋 页面做什么

副驾看到这个页面的流程：
```
1. 打开页面 → 看到大红色录音按钮
2. 点击开始说话 → 系统实时录音
3. 点击停止 → 自自动化四板斧：
   ✓ 上传音频到服务器
   ✓ 后端语音转文字
   ✓ AI提取「问题类型」「严重程度」等
   ✓ 存入数据库
4. 用户审核（可编辑文字、拍照、划视频）
5. 点「提交」完成，回到上一页
```

---

## 🏗️ 文件结构（三层）

### 第一层：Template（HTML 页面结构）

#### 两种视觉状态：

**状态1：Draft（文本）**
- **什么时候显示**：`record.id 不存在 OR record.status === 'draft'`
- **显示内容**：
  - 蓝色提示文字框
  - 大红色录音按钮 + 计时器
  - 语音转文字文本框（可编辑）
  - AI识别结果卡片（问题摘要、类型、严重程度）
  - GPS + 天气信息
  - 拍照/录像附件区
  - AI分析 + 提交按钮

**状态2：Submitted（绿色勾号）**
- **什么时候显示**：`record.status === 'submitted'`（已提交）
- **显示内容**：
  - ✓ 绿色"已提交"标签
  - 问题描述（只读）
  - 问题类型和严重程度（只读）

### 第二层：Script（JavaScript 逻辑）

关键概念：所有状态变量都保存在 `data()` 中，页面会自动响应（Vue 的双向绑定）。

**state 核心变量**：

| 变量 | 含义 | 初始值 | 用途 |
|------|------|--------|------|
| `record` | 整条问题记录 | `{}` | id、audio_url、raw_text、summary（AI结果）、status 等 |
| `editableText` | 用户编辑的文字 | `''` | textarea 中的内容，用户可以修改 |
| `isRecording` | 正在录音？ | `false` | 控制录音按钮的视觉状态（红色脉冲） |
| `recordingDuration` | 录音多长了 | `0` | 显示计时器（MM:SS） |
| `attachments` | 照片和视频 | `[]` | 用户拍照/录像后的列表 |
| `sessionId` | 所属的测试环节 | `null` | 从上一页路由参数传来 |
| `audioFilePath` | 临时音频文件路径 | `''` | 录音停止后的文件位置 |

### 第三层：Style（CSS 样式）

- 大红色按钮、蓝色提示框、绿色标签等视觉设计
- `rpx` 单位 = 响应式像素（在不同设备上自动缩放）

---

## 🎬 核心方法流程解析

### 1️⃣ 录音开关（toggleRecording）

**用户操作**：点击大红色按钮

**代码逻辑**：
```
if (isRecording) {
  // 第二次点击 = 停止
  recorderManager.stop()
  // 自动触发 onStop 回调 → handleRecordingDone()
} else {
  // 第一次点击 = 开始
  collectLocation()          // 采集 GPS
  recorderManager.start()    // 开始录音
  启动计时器()              // 每秒 +1
}
```

### 2️⃣ 录音完成后的自动处理（handleRecordingDone）【🔥最重要】

**触发时机**：用户停止录音时，自动执行

**四步流程**：

```
【步骤1】创建记录（如果是新记录）
  const record = await createRecord({ session_id, occurred_at })
  
【步骤2】上传音频文件
  const {url} = await uploadFile(audioFilePath)
  把 url 保存回数据库
  
【步骤3】语音识别（音频 → 文字）
  const {text} = await transcribeAudio(url)
  此时 record.raw_text = 这个识别结果
  
【步骤4】保存文字到数据库
  await updateRecord(record.id, { raw_text: text })
```

**结果**：用户看到 textarea 中自动填充了语音转文字的内容。

### 3️⃣ AI 分析（runAI）

**用户操作**：点击「AI 分析」按钮

**代码逻辑**：
```
const result = await extractFields(editableText)
// 后端返回：{ summary, problemType, severity, details }

await updateRecord(record.id, {
  summary,
  problem_type: problemType,
  severity,
  details
})

// UI 自动显示 AI 结果卡片
```

### 4️⃣ 自动保存草稿（saveDraft）

**触发时机**：每 3 秒自动执行（即使用户不点东西）

**作用**：防止用户意外退出或浏览器崩溃

**内容**：保存 edited_text + attachments 到数据库

### 5️⃣ 提交（submitRecord）

**用户操作**：点击「提交」按钮

**代码逻辑**：
```
status = 'submitted'
edited_text = 用户编辑后的文字
attachments = 所有照片和视频

await updateRecord(record.id, { status, edited_text, attachments })

等待1秒 → 返回上一页（Session 列表）
```

### 6️⃣ 附件管理（takePhoto / chooseVideo）

**拍照流程**：
```
uni.chooseImage()         // 系统相机
↓
uploadFile(照片)          // 上传到服务器
↓
attachments.push({        // 添加到列表
  type: 'photo',
  url: 返回的URL
})
```

**录像流程**：完全相同，只是改成 `uni.chooseVideo()`

---

## 🔗 API 调用关系图

这个页面调用的所有 API 函数都来自`api.js`：

```
┌─ getRecord()          ← 加载已有记录
├─ createRecord()       ← 创建新记录
├─ updateRecord()       ← 保存任何字段更新
├─ uploadFile()         ← 上传音频/照片/视频
├─ transcribeAudio()    ← 语音识别（音频→文字）
└─ extractFields()      ← AI 分析（文字→结构化字段）
```

---

## 📊 数据流向

```
User Input
    ↓
Vue Component (record/index.vue)
    ↓ (通过 methods 调用)
api.js (HTTP 客户端)
    ↓ (网络请求)
Backend Server (app.js)
    ↓ (处理、调用 AI / ASR 模型)
Database (SQLite)
    ↓ (读取/保存 record 对象)
返回结果 → 更新 record 对象 → UI 自动刷新
```

---

## 🎯 学习路线

1. **先理解 api.js**（已学习 ✓）
   - 这个页面就是调用那些 API 函数的
   
2. **理解这个页面的两个状态**（draft vs submitted）
   - 核心区别：v-if 条件式切换模板
   
3. **理解四大核心流程**
   - toggleRecording() → handleRecordingDone()
   - runAI()
   - submitRecord()
   - saveDraft() 的自动保存机制

4. **理解"双向绑定"**
   - 改变 record.raw_text → UI 自动显示
   - 用户修改 textarea → editableText 自动更新

---

## ⚡ 关键"坑"

| 坑 | 说明 | 解决方案 |
|----|------|--------|
| GPS 时机问题 | GPS 采集在按下录音时，但记录是录音结束时才创建。运行常丢失 | 已知 bug，未修复 |
| ASR 30 秒限制 | ZhiPu 只能转录 <30 秒的音频 | 已知，推荐用 Qwen 替代 |
| 草稿超时 | saveDraft 是无声的，用户不知道是否成功保存 | 正常设计--放心 |
| 附件和 editableText 的同步 | 自动保存时需要把两个都保存 | 已经处理好了 |

---

## 💡 总结一句话

**这个页面 = 让用户通过语音 + 手工修改 + 拍照/录像，完成一条完整的问题记录，系统全程自动处理 ASR、AI 识别和保存。**
