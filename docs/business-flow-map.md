# 路测助手业务链路总览

本文档基于当前已实现的 Phase 1 状态整理真实业务链路，供后续开发、联调和验收使用。

## 1. 当前产品结构

项目当前采用三层业务结构：

```text
项目 projects
  └── 试验 test_sessions
        └── 记录 records
```

首页不再直接管理试验，而是技术负责人先进入项目上下文，再在项目内创建和维护试验。

## 2. 核心业务实体

### 2.1 项目 projects

当前字段重点包括：

- `id`
- `name`
- `code`
- `tech_lead`
- `archived_at`
- `created_at`
- `updated_at`

说明：

- `code` 作为项目编号/代号，数据库中有唯一索引
- `archived_at` 为 `null` 表示活跃项目，非空表示已归档

### 2.2 试验 test_sessions

当前字段重点包括：

- `id`
- `project_id`
- `tester`
- `test_date`
- `vehicle_info`
- `route`
- `status`
- `created_at`
- `updated_at`

状态值：

- `active`
- `completed`

### 2.3 记录 records

当前字段重点包括：

- `id`
- `session_id`
- `audio_url`
- `raw_text`
- `attachments`
- `summary`
- `problem_type`
- `severity`
- `details`
- `gps_lat`
- `gps_lng`
- `gps_address`
- `weather`
- `occurred_at`
- `edited_text`
- `status`
- `created_at`
- `updated_at`

状态值：

- `draft`
- `submitted`

## 3. 页面总览

当前主要页面如下：

- [我的项目](D:/Projects/GAC-Road-Test-Assistant/client/pages/index/index.vue)
- [项目详情 / 创建项目 / 编辑项目](D:/Projects/GAC-Road-Test-Assistant/client/pages/project-detail/index.vue)
- [归档项目](D:/Projects/GAC-Road-Test-Assistant/client/pages/project-archive/index.vue)
- [试验详情 / 新建试验 / 编辑试验](D:/Projects/GAC-Road-Test-Assistant/client/pages/session-detail/index.vue)
- [记录页](D:/Projects/GAC-Road-Test-Assistant/client/pages/record/index.vue)
- [导出页](D:/Projects/GAC-Road-Test-Assistant/client/pages/export/index.vue)

## 4. 项目管理链路

### 4.1 首页职责

首页现在负责：

- 展示未归档项目
- 展示项目统计信息
- 进入项目详情
- 创建项目
- 归档项目
- 删除项目
- 进入归档项目页

首页不再负责：

- 直接创建试验
- 混合展示跨项目试验列表

### 4.2 首页数据流

首页展示时执行：

- `getProjects()` 获取未归档项目
- `getSessions()` 获取试验总览，用于统计试验总数、进行中试验数、最近试验日期

相关接口：

- `GET /api/projects`
- `GET /api/sessions`

### 4.3 创建项目

用户在首页点击“创建项目”后：

1. 进入项目表单页
2. 填写 `name`、`code`、`tech_lead`
3. 调用 `createProject()`
4. 创建成功后跳转到项目详情页

相关接口：

- `POST /api/projects`

### 4.4 编辑项目

用户在项目详情页点击“编辑项目”后：

1. 进入项目编辑表单
2. 更新 `name`、`code`、`tech_lead`
3. 调用 `updateProject()`
4. 保存成功后回到项目详情

相关接口：

- `PUT /api/projects/:id`

### 4.5 项目归档与恢复

归档项目：

1. 用户在首页或项目详情点击“归档项目”
2. 前端弹确认框
3. 调用 `archiveProject()`
4. 项目从首页消失，进入归档项目页

恢复项目：

1. 用户进入归档项目页
2. 点击“恢复”
3. 调用 `restoreProject()`
4. 项目回到首页

相关接口：

- `PUT /api/projects/:id/archive`
- `PUT /api/projects/:id/restore`

### 4.6 项目删除

项目删除采用双重确认：

1. 第一次弹窗说明删除后会删除项目下全部试验和记录
2. 第二次弹窗再次确认不可恢复
3. 调用 `deleteProject()`
4. 后端级联删除 `test_sessions` 和 `records`

相关接口：

- `DELETE /api/projects/:id`

## 5. 试验管理链路

### 5.1 项目详情页职责

项目详情页负责：

- 展示项目基本信息
- 按测试日期升序展示该项目下的试验
- 同一天内 `active` 排在 `completed` 前
- 新建试验
- 编辑试验
- 删除试验
- 归档/删除当前项目

### 5.2 项目详情页数据流

进入项目详情页后执行：

- `getProject(projectId)` 获取项目信息
- `getSessions(projectId)` 获取该项目下试验列表

相关接口：

- `GET /api/projects/:id`
- `GET /api/sessions?project_id=...`

### 5.3 创建试验

创建试验现在必须在项目上下文中进行：

1. 用户进入项目详情页
2. 点击“新建试验”
3. 跳转到试验表单页，并携带 `project_id`、`project_name`、`project_code`
4. 用户填写 `tester`、`test_date`、`vehicle_info`、`route`
5. 调用 `createSession()`
6. 创建成功后跳转到试验详情页

当前不再支持：

- 手填项目名创建试验
- 在试验创建时顺带创建项目

相关接口：

- `POST /api/sessions`

### 5.4 编辑试验

用户在试验详情页点击“编辑试验”后：

1. 进入编辑表单
2. 修改试验字段
3. 调用 `updateSession()`
4. 保存成功后回到试验详情

相关接口：

- `PUT /api/sessions/:id`

### 5.5 删除试验

试验删除同样采用双重确认：

1. 第一次弹窗说明会删除该试验下全部记录
2. 第二次弹窗再次确认不可恢复
3. 调用 `deleteSession()`
4. 后端级联删除该试验下的 `records`

相关接口：

- `DELETE /api/sessions/:id`

### 5.6 结束试验

用户在试验详情页点击“结束试验”后：

1. 前端弹确认框
2. 调用 `updateSession(id, { status: 'completed' })`
3. 试验状态改为 `completed`
4. 页面隐藏“录音记录”入口

相关接口：

- `PUT /api/sessions/:id`

## 6. 记录采集链路

记录页仍是核心执行页，负责：

- 录音
- 创建记录草稿
- 上传音频
- 语音转文字
- 编辑文本
- AI 提取结构化字段
- 上传图片/视频附件
- 自动保存草稿
- 提交记录

### 6.1 新记录创建

当用户从试验详情点击“录音记录”时：

1. 进入记录页
2. 开始录音
3. 若当前没有 `record.id`，会先创建草稿记录
4. 后续音频、文本、AI 结果、附件都会更新到该记录

相关接口：

- `POST /api/records`
- `PUT /api/records/:id`
- `POST /api/upload`
- `POST /api/ai/transcribe`
- `POST /api/ai/extract`

### 6.2 提交记录

用户点击“提交”后：

1. 保存 `edited_text`、`attachments`
2. 将 `status` 改为 `submitted`
3. 返回试验详情页

导出链路只会导出 `submitted` 状态记录。

## 7. 导出链路

导出页负责：

- 选择试验
- 预览该试验下已提交记录
- 导出 Excel
- 导出 CSV

当前流程：

1. `getSessions()` 获取试验列表
2. 用户选择试验
3. `getRecords(sessionId)` 获取记录
4. 前端筛出 `submitted` 记录用于预览
5. 调用导出接口下载文件

相关接口：

- `GET /api/sessions`
- `GET /api/records?session_id=...`
- `GET /api/export/excel`
- `GET /api/export/csv`

## 8. 后端接口总表

项目：

- `GET /api/projects`
- `GET /api/projects/archived`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `PUT /api/projects/:id/archive`
- `PUT /api/projects/:id/restore`
- `DELETE /api/projects/:id`

试验：

- `GET /api/sessions`
- `GET /api/sessions/:id`
- `POST /api/sessions`
- `PUT /api/sessions/:id`
- `DELETE /api/sessions/:id`

记录：

- `GET /api/records?session_id=...`
- `POST /api/records`
- `GET /api/records/:id`
- `PUT /api/records/:id`

AI：

- `POST /api/ai/transcribe`
- `POST /api/ai/extract`
- `POST /api/ai/process-record`

导出：

- `GET /api/export/excel`
- `GET /api/export/csv`

## 9. 当前值得注意的实现特点

- 项目唯一性现在由 `projects.code` 的唯一索引保证
- 项目/试验删除在后端已形成级联删除闭环
- 危险操作已经升级为双重确认，但还不是输入 `DELETE` 的文本确认
- 记录页与导出页仍沿用原有 UI，尚未完全统一到 Phase 1 的组件风格
- AI 仍然以前端“先转写、再提取”的两步链路为主，尚未切到 `process-record`
- 首次录音时 GPS 是否稳定写入，仍值得后续专门回归验证

## 10. 当前端到端主流程

```text
我的项目
  -> 创建项目 / 进入项目 / 归档项目 / 删除项目
  -> 项目详情
       -> 查看项目概览
       -> 新建试验 / 编辑试验 / 删除试验
       -> 进入试验详情
            -> 查看记录列表
            -> 创建录音记录
                 -> 创建草稿
                 -> 上传音频
                 -> 语音转文字
                 -> AI 提取
                 -> 上传附件
                 -> 自动保存
                 -> 提交记录
            -> 结束试验
归档项目
  -> 恢复项目 / 彻底删除项目
导出
  -> 选择试验
  -> 预览已提交记录
  -> 导出 Excel / CSV
```
