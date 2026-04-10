# 路测助手 MVP 实现计划

基于设计文档: `docs/superpowers/specs/2026-04-09-road-test-assistant-design.md`

## 任务列表

### Task 1: 项目脚手架搭建
- 创建 UniApp + Vue3 前端项目
- 创建 Node.js + Express 后端项目
- 配置 SQLite 数据库连接
- Layer 0 skipped: 纯结构性脚手架

### Task 2: 数据库 Schema 与数据模型
- 创建 SQLite 建表脚本 (Project, TestSession, Record)
- 创建后端数据模型层 (查询/增删改函数)
- 测试 CRUD 操作

### Task 3: 后端 API - 项目与试验
- 项目 CRUD 路由
- 试验 CRUD 路由
- 输入验证
- API 测试

### Task 4: 后端 API - 记录管理
- 记录 CRUD 路由
- 状态管理 (草稿/已提交)
- API 测试

### Task 5: AI 服务层
- 创建可插拔适配器接口
- 实现通义千问适配器 (语音转文字 + 结构化提取)
- 单元测试

### Task 6: 文件上传服务
- 文件上传 API 端点
- MVP 使用本地存储 (后续迁移到 OSS)
- 测试

### Task 7: 导出服务
- Excel/CSV 导出 API
- 测试

### Task 8: 前端页面结构与路由
- 配置 5 个页面路由
- 底部导航栏
- 页面骨架

### Task 9: 首页 - 试验列表
- 试验列表展示
- 新建试验入口
- 点击进入详情

### Task 10: 新建试验页
- 表单填写与验证
- 日期自动填充
- 创建后跳转详情

### Task 11: 试验详情页
- 试验信息展示
- 记录列表 (按时间倒序)
- 悬浮录音按钮

### Task 12: 录音/记录页 (核心)
- 录音按钮 (开始/停止)
- GPS 自动采集
- 语音转文字展示
- AI 结构化提取展示
- 文字编辑
- 拍照/录像附件
- 草稿自动保存 (每3秒)
- 提交按钮

### Task 13: 导出页
- 选择试验
- 预览已提交记录
- 导出 Excel/CSV
