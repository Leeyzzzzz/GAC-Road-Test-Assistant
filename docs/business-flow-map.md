# 路测助手业务链路总览

> 基于 Phase 1 代码事实全量扫描生成，供增量开发和优化计划使用。
> 扫描日期: 2026-04-24

---

## 1. 产品结构

### 1.1 三层业务实体

```
项目 projects
  └── 试验 test_sessions
        └── 记录 records
```

外键级联: `projects` ← `test_sessions` (ON DELETE CASCADE) ← `records` (ON DELETE CASCADE)

### 1.2 完整数据模型

#### projects
| 字段 | 类型 | 约束 |
|------|------|------|
| id | INTEGER PK AUTOINCREMENT | |
| name | TEXT NOT NULL | |
| code | TEXT | 唯一索引 (WHERE code IS NOT NULL AND code != '') |
| tech_lead | TEXT | |
| archived_at | DATETIME | NULL=活跃, 非NULL=已归档 |
| created_at | DATETIME | 默认 `datetime('now','localtime')` |
| updated_at | DATETIME | 默认 `datetime('now','localtime')` |

#### test_sessions
| 字段 | 类型 | 约束 |
|------|------|------|
| id | INTEGER PK AUTOINCREMENT | |
| project_id | INTEGER NOT NULL | FK → projects(id) CASCADE |
| tester | TEXT NOT NULL | |
| test_date | TEXT NOT NULL | |
| vehicle_info | TEXT | |
| route | TEXT | |
| status | TEXT DEFAULT 'active' | CHECK(status IN ('active','completed')) |
| created_at | DATETIME | |
| updated_at | DATETIME | |

#### records
| 字段 | 类型 | 约束 |
|------|------|------|
| id | INTEGER PK AUTOINCREMENT | |
| session_id | INTEGER NOT NULL | FK → test_sessions(id) CASCADE |
| audio_url | TEXT | 相对路径 `/uploads/xxx` |
| raw_text | TEXT | ASR 转写结果 |
| attachments | TEXT DEFAULT '[]' | JSON 数组 `[{type, url}]` |
| summary | TEXT | AI 生成的一行描述 |
| problem_type | TEXT | 感知异常/规划异常/控制异常/接管/系统故障/其他 |
| severity | TEXT | 致命/严重/一般/轻微 |
| details | TEXT | AI 生成的补充说明 |
| gps_lat | REAL | |
| gps_lng | REAL | |
| gps_address | TEXT | **当前从未写入** |
| weather | TEXT | **当前从未写入** |
| occurred_at | DATETIME | |
| edited_text | TEXT | 用户编辑后的文本 |
| status | TEXT DEFAULT 'draft' | CHECK(status IN ('draft','submitted')) |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

## 2. 页面总览与路由

| 路径 | 页面 | 入口方式 |
|------|------|---------|
| `/pages/index/index` | 我的项目 (首页) | Tab Bar "项目" |
| `/pages/project-detail/index` | 项目详情/新建/编辑 | `?id=X` 查看, `?new=1` 新建, `?id=X&edit=1` 编辑 |
| `/pages/project-archive/index` | 归档项目 | 首页"归档项目"按钮 |
| `/pages/session-detail/index` | 试验详情/新建/编辑 | `?id=X` 查看, `?new=1&project_id=X&project_name=X&project_code=X` 新建, `?id=X&edit=1` 编辑 |
| `/pages/record/index` | 录音记录 | `?session_id=X` 新建记录, `?id=X&session_id=X` 查看已有 |
| `/pages/export/index` | 导出 | Tab Bar "导出" |

Tab Bar 仅 2 项: "项目" + "导出"

### 2.1 表单模式判断逻辑 (通用模式)

所有 detail 页面通过 URL 参数判断模式:
- `new=1` → 新建模式, 显示表单, 不加载数据
- `edit=1` → 编辑模式, 加载已有数据, 预填表单
- 无参数 → 查看模式, 加载数据展示详情

前端字段命名: camelCase (`techLead`, `vehicleInfo`, `testDate`), API 发送时映射为 snake_case (`tech_lead`, `vehicle_info`, `test_date`)

---

## 3. 项目管理链路

### 3.1 首页数据流

**页面**: `index/index.vue`

**onShow 加载**:
```
Promise.all([
  GET /api/projects        → projects[]  (WHERE archived_at IS NULL)
  GET /api/sessions        → sessions[]  (全部试验, 无 project_id 过滤)
])
```

**computed 增强**: `enrichedProjects` 对每个 project 做客户端数据联结:
```js
projectSessions = sessions.filter(s => s.project_id === project.id)
→ sessionCount:  试验总数
→ activeSessions: status === 'active' 的计数
→ lastSessionDate: 按 test_date 降序取第一个
```

**统计卡片**:
- 进行中项目: `projects.length`
- 进行中试验: 全量 `sessions.filter(s => s.status === 'active').length` (非按项目)
- 本周新增项目: `projects.filter(p => isSameWeek(p.created_at)).length`

**性能注意**: 首页加载全量 sessions, 无分页, 数据量大时会影响性能。

### 3.2 创建项目

**触发**: 首页 FAB / 空态按钮 → `?new=1`

**表单字段** (前端全部必填, 后端仅 name+code 必填):
| 表单字段 | API 字段 | 说明 |
|----------|----------|------|
| name | name | 项目名称 |
| code | code | 项目编号, 数据库唯一索引 |
| techLead | tech_lead | 技术负责人 |

**提交**: `POST /api/projects` → 成功后 `uni.redirectTo` 到项目详情

### 3.3 编辑项目

**触发**: 项目详情 "编辑项目" → `?id=X&edit=1`

**加载**: `GET /api/projects/:id` + `GET /api/sessions?project_id=X`

**提交**: `PUT /api/projects/:id` → 后端合并策略: undefined 字段使用现有值 (`val ?? existing`)

### 3.4 归档/恢复项目

- 归档: `PUT /api/projects/:id/archive` → 设置 `archived_at = datetime('now','localtime')`
- 恢复: `PUT /api/projects/:id/restore` → 设置 `archived_at = NULL`

归档后项目从首页 (`WHERE archived_at IS NULL`) 消失, 进入归档页。

### 3.5 删除项目

**双重确认弹窗** → `DELETE /api/projects/:id`

**后端级联**: `records → sessions → project` (事务内执行)

---

## 4. 试验管理链路

### 4.1 项目详情页 (试验列表)

**页面**: `project-detail/index.vue`

**onLoad 加载**: `GET /api/projects/:id` + `GET /api/sessions?project_id=X` (并行)

**试验列表排序**: 先按 `test_date` 升序, 同一天内 `active` 排在 `completed` 前

会话卡片展示: 测试人员, 状态标签, 车辆信息, 路线

### 4.2 创建试验

**触发**: 项目详情 FAB "新建试验" → `?new=1&project_id=X&project_name=X&project_code=X`

**表单**: tester (必填), testDate (日期选择器), vehicleInfo, route

**提交**: `POST /api/sessions` → status 默认 `active`

### 4.3 编辑试验

**触发**: 试验详情 "编辑试验" → `?id=X&edit=1`

**加载**: `GET /api/sessions/:id` + `GET /api/projects/:project_id`

**提交**: `PUT /api/sessions/:id`

**实现细节**: backend `updateSession()` 用 `||` 回退 (`tester || existing.tester`), 空字符串会回退到旧值

### 4.4 查看试验详情 & 记录列表

**页面**: `session-detail/index.vue`

**onLoad**: `GET /api/sessions/:id`, 然后 `GET /api/projects/:project_id` (失败则静默忽略), 最后 `GET /api/records?session_id=X` (onShow 也会重新加载 records)

**"结束试验"按钮**: 仅 `status === 'active'` 时显示

**记录 FAB**: 仅 `session.status === 'active'` 时显示

### 4.5 结束试验

**确认弹窗** → `PUT /api/sessions/:id` with `{ status: 'completed' }` → 刷新数据, 隐藏录音入口

### 4.6 删除试验

**只能从项目详情页发起**, 试验详情页没有删除按钮。

**双重确认** → `DELETE /api/sessions/:id` → 级联删除该试验下所有 records

---

## 5. 记录采集链路 (核心流程)

### 5.1 记录页职责

**页面**: `record/index.vue`

完整流程: 录音 → 创建草稿 → 上传音频 → ASR 转写 → 编辑文本 → AI 提取 → 附件上传 → 自动保存草稿 → 提交

### 5.2 录音生命周期

1. **开始**: `toggleRecording()` → `collectLocation()` + `recorderManager.start({ format: 'mp3', sampleRate: 16000, numberOfChannels: 1 })`
2. **进行中**: 每秒更新计时器, UI 显示脉冲动画+计时
3. **停止**: `recorderManager.stop()` → `onStop` 回调获取 `tempFilePath`

### 5.3 录音后处理流水线 (handleRecordingDone)

这是整个应用最核心的数据流水线, 录音停止后按序执行:

```
Step 1: 创建记录草稿
  POST /api/records  { session_id, occurred_at: new Date().toLocaleString('sv-SE') }

Step 2: 上传音频文件
  POST /api/upload   (uni.uploadFile, form field "file")
  → { url, filename, size, mimetype }

Step 3: 保存音频 URL
  PUT /api/records/:id  { audio_url }

Step 4: 语音转文字
  POST /api/ai/transcribe  { audio_url }
  → { text }

Step 5: 保存转写文字
  PUT /api/records/:id  { raw_text }
  → 更新 local state: record.raw_text, editableText
```

**一次录音共 5 次 API 调用**, 任一环节失败会中断后续流程。

### 5.4 AI 分析

用户点击 "AI 分析" (仅 `record.raw_text` 存在时显示):

```
POST /api/ai/extract  { text: editableText }   // 用编辑后的文本, 非原始 raw_text
→ { summary, problemType, severity, details }

PUT /api/records/:id  { summary, problem_type, severity, details }
→ UI 更新 AI 结果卡片 (severity 带颜色编码)
```

AI Prompt 模板 (ZhiPu / Qwen 各自实现一份):
```
你是一个路测问题分析助手。请从以下路测记录文字中提取结构化信息。
返回JSON: { summary, problemType, severity, details }
problemType: 感知异常|规划异常|控制异常|接管|系统故障|其他
severity: 致命|严重|一般|轻微
```

### 5.5 附件上传

- 拍照: `uni.chooseImage({ count: 1 })` → `POST /api/upload` → push `{ type: 'photo', url }`
- 录像: `uni.chooseVideo()` → `POST /api/upload` → push `{ type: 'video', url }`

### 5.6 自动草稿保存

3 秒间隔定时器 (`setInterval(saveDraft, 3000)`):
```
PUT /api/records/:id  { edited_text, attachments }
```
- 仅当 `record.id` 存在时执行
- 错误静默忽略
- 不会因为 record.status 而停止 (submitted 后仍会尝试保存)

### 5.7 提交记录

**前置条件**: `record.raw_text` 必须存在 (否则提交按钮 disabled)

**提交**: `PUT /api/records/:id` with `{ status: 'submitted', edited_text, attachments }`

**提交后**: toast 提示, 1 秒后返回上一页

### 5.8 查看已提交记录

进入 `?id=X&session_id=X`, 如果 `record.status !== 'draft'`, 展示只读视图: 勾选图标, "已提交" 文字, 问题类型, 严重程度

---

## 6. 导出链路

### 6.1 导出页流程

**页面**: `export/index.vue`

1. `onShow` → `GET /api/sessions` (全部试验)
2. 用户从 picker 选择试验 (显示 tester - date - route)
3. `GET /api/records?session_id=X` → 客户端过滤 `status === 'submitted'` 用于预览
4. 导出:
   - **H5**: `<a>` 标签下载, URL 由 `getExportUrl()` 构建
   - **非 H5** (App/小程序): `uni.downloadFile()` → `uni.openDocument()`

### 6.2 导出接口

| 接口 | 列数 | 说明 |
|------|------|------|
| `GET /api/export/excel?session_id=X` | 13 列 (2 个 sheet) | Sheet1 "路测记录" + Sheet2 "试验信息" |
| `GET /api/export/csv?session_id=X` | 10 列 | **比 Excel 少 4 列**: 编辑后文字, 地址, 发生时间, 创建时间 |

两者都只导出 `status='submitted'` 的记录。CSV 带 BOM 以支持 Excel 打开 UTF-8。

### 6.3 URL 构建

`getExportUrl()` 在 `api.js`:
- 调用 `buildApiUrl()` 拼接 base URL + 路径
- H5: 直接用作 `<a>` href
- 非 H5: 传给 `uni.downloadFile`

---

## 7. AI 服务层

### 7.1 适配器架构

```
BaseAIAdapter (抽象基类)
  ├── MockAdapter       ← 无 API Key 时的兜底 (返回硬编码中文数据)
  ├── ZhiPuAdapter      ← ZHIPU_API_KEY 配置时选中 (当前默认)
  └── QwenAdapter       ← DASHSCOPE_API_KEY 配置时选中 (备选)
```

**选择逻辑** (ai-service.js 单例, 懒初始化):
1. 有 `ZHIPU_API_KEY` → ZhiPuAdapter
2. 否则有 `DASHSCOPE_API_KEY` → QwenAdapter
3. 否则 → MockAdapter (回退)

### 7.2 各适配器实现细节

**ZhiPuAdapter**:
- Base URL: `https://open.bigmodel.cn/api/paas/v4`
- ASR 模型: `glm-asr-2512`, 端点 `POST /audio/transcriptions`
- Chat 模型: `glm-4-flash`, 端点 `POST /chat/completions`
- 音频发送: 读取本地文件为 Buffer → form-data multipart 上传 (使用 `form.getBuffer()` + 显式 `Content-Length` header)
- ASR 限制: 30 秒音频上限

**QwenAdapter**:
- Base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- ASR 模型: `qwen3-asr-flash`, 端点 `POST /chat/completions` (和 Chat 用同一个)
- Chat 模型: `qwen-plus`, 端点 `POST /chat/completions`
- 格式: OpenAI-compatible multimodal content array, Chat 用 `response_format: { type: 'json_object' }`
- 音频发送: 直接传 audioUrl 字符串到 `input_audio.data` (DashScope 期望 base64 或可访问 URL, **本地文件路径可能不可用**)

### 7.3 音频 URL 解析

`resolveAudioUrl()`: 如果 `audio_url` 以 `/uploads/` 开头 → 转为绝对文件系统路径 `server/uploads/{basename}`, 否则原样透传

### 7.4 未使用的端点

`POST /api/ai/process-record` 是完整 pipeline 端点 (转写+提取+更新记录), 但 **前端从未调用**, 前端使用两步调用 (`transcribe` + `extract`)。

---

## 8. 上传模块

| 端点 | 用途 | 前端调用 |
|------|------|---------|
| `POST /api/upload` | 单文件上传 (field "file") | **已使用** |
| `POST /api/upload/multiple` | 多文件上传 (field "files", 最多 10 个) | **从未调用** |

限制: 100MB, 允许 `.mp3 .wav .m4a .aac .ogg .mp4 .jpg .jpeg .png .mov`
文件名: `{timestamp}-{random6chars}{ext}`
存储: `server/uploads/`

---

## 9. API 接口总表

### 项目
| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/projects` | — | 活跃项目 (archived_at IS NULL) |
| GET | `/api/projects/archived` | — | 已归档项目 |
| GET | `/api/projects/:id` | — | 单个项目, 无则 404 |
| POST | `/api/projects` | `{name, code, tech_lead?}` | 创建, name+code 必填 |
| PUT | `/api/projects/:id` | `{name, code, tech_lead?}` | 更新, 使用合并策略 |
| PUT | `/api/projects/:id/archive` | — | 设置 archived_at |
| PUT | `/api/projects/:id/restore` | — | 清除 archived_at |
| DELETE | `/api/projects/:id` | — | 级联删除 (事务) |

### 试验
| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/sessions` | `?project_id=X` (可选) | 全部或按项目过滤 |
| GET | `/api/sessions/:id` | — | 单个, 无则 404 |
| POST | `/api/sessions` | `{project_id, tester, test_date, vehicle_info?, route?}` | status 默认 active |
| PUT | `/api/sessions/:id` | 字段子集 | `||` 回退策略, 空字符串会回退 |
| DELETE | `/api/sessions/:id` | — | 级联删除 records |

### 记录
| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/records` | `?session_id=X` (必填) | 缺少返回 400 |
| GET | `/api/records/:id` | — | 单个 |
| POST | `/api/records` | `{session_id, ...}` | attachments 内部 JSON.stringify |
| PUT | `/api/records/:id` | 允许字段子集 | 动态字段更新, 17 个允许字段 |

**注意**: 没有 DELETE 单条记录的端点, 只能通过级联删除。

### AI
| 方法 | 路径 | Body | 说明 |
|------|------|------|------|
| POST | `/api/ai/transcribe` | `{audio_url}` | → `{text}` |
| POST | `/api/ai/extract` | `{text}` | → `{summary, problemType, severity, details}` |
| POST | `/api/ai/process-record` | `{record_id, audio_url?}` | 一站式 pipeline, **前端未使用** |

### 导出
| 方法 | 路径 | Query | 说明 |
|------|------|------|------|
| GET | `/api/export/excel` | `?session_id=X` | 2 sheet Excel, submitted only |
| GET | `/api/export/csv` | `?session_id=X` | CSV + BOM, 10 列 |

---

## 10. 端到端主流程

```
我的项目 (首页)
  ├── 创建项目 → 项目表单 → POST /api/projects → 项目详情
  ├── 进入项目 → 项目详情
  │    ├── 查看试验列表 (GET /api/sessions?project_id=X)
  │    ├── 新建试验 → 试验表单 → POST /api/sessions → 试验详情
  │    ├── 进入试验 → 试验详情
  │    │    ├── 查看记录列表 (GET /api/records?session_id=X)
  │    │    ├── 录音记录 → 记录页
  │    │    │    ├── 录音 → 停止 → 5步流水线 (create/upload/transcribe/save)
  │    │    │    ├── AI 分析 → POST /api/ai/extract
  │    │    │    ├── 拍照/录像 → POST /api/upload
  │    │    │    ├── 自动保存 (每3秒 PUT 草稿)
  │    │    │    └── 提交 → PUT status='submitted'
  │    │    ├── 编辑试验 → 试验表单 → PUT /api/sessions/:id
  │    │    └── 结束试验 → PUT status='completed'
  │    ├── 编辑项目 → 项目表单 → PUT /api/projects/:id
  │    ├── 归档项目 → PUT /api/projects/:id/archive
  │    └── 删除项目 → 双重确认 → DELETE /api/projects/:id
  └── 归档项目页
       ├── 恢复项目 → PUT /api/projects/:id/restore
       └── 彻底删除 → 双重确认 → DELETE /api/projects/:id

导出 (Tab Bar)
  ├── 选择试验 → 预览 submitted 记录
  └── 导出 Excel / CSV
```

---

## 11. 已知问题与实现要点

### 11.1 Bug

| # | 问题 | 影响 |
|---|------|------|
| 1 | **GPS 采集死代码**: `collectLocation()` 检查 `if (!this.record.id) return;`, 但首次录音时 record.id 在录音结束后才创建, 导致 GPS 永远无法写入新记录 | GPS 数据丢失 |
| 2 | **QwenAdapter ASR 可能不可用**: 将本地文件路径直接传到 `input_audio.data`, DashScope 期望 base64 或可访问 URL | Qwen 转写失败 |
| 3 | **`weather` 和 `gps_address` 字段从未写入**: 数据库有列但无代码赋值 | 字段始终为空 |
| 4 | **CSV 列数少于 Excel**: CSV 缺少 编辑后文字、地址、发生时间、创建时间 | 导出数据不完整 |

### 11.2 设计问题

| # | 问题 | 建议 |
|---|------|------|
| 1 | 首页加载全量 sessions 做客户端统计, 无分页 | 加 `GET /api/sessions/stats` 或后端聚合 |
| 2 | `/api/ai/process-record` 已实现但前端未使用 | 可简化为单次调用 |
| 3 | `/api/upload/multiple` 已实现但前端未使用 | 是否保留取决于未来需求 |
| 4 | 无单条记录删除端点 | 只能通过级联删除 session/project |
| 5 | 无分页、无鉴权 | 所有接口全量返回, 无需登录 |
| 6 | ZhiPu ASR 30 秒限制 | 长录音会被截断 |

### 11.3 架构特点

- 前端状态管理: 组件 local `data()` (无 Vuex/Pinia)
- 生命周期: `onShow` 每次重新加载数据, `onLoad` 处理 URL 参数
- 错误处理: 统一 `uni.showToast({ title: err.message, icon: 'none' })`
- 删除操作: 双重确认弹窗 (但非文本输入确认)
- 草稿自动保存: 3 秒定时器, 静默失败
- AI 链路: "先转写再提取" 两步, 用户可编辑文本后再跑 AI 分析
- 时间戳: SQLite 使用 `datetime('now','localtime')` (非 UTC)
- 适配器选择: 环境变量驱动, 单例模式, 支持运行时 `setAdapter()` 切换
