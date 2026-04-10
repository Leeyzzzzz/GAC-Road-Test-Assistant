# 路测助手 MVP

智驾场地试验用例管理系统。

## 快速开始

### 后端
```bash
cd server
npm install
npm run dev
```
服务运行在 http://localhost:3000

### 前端
```bash
cd client
npm install
npm run dev:h5
```

### 运行测试
```bash
cd server
npm test
```

## 技术栈
- 前端: UniApp + Vue3 (企业微信小程序 + H5)
- 后端: Node.js + Express
- 数据库: SQLite (MVP)
- AI: 通义千问 (语音转文字 + 结构化提取)
- 导出: xlsx (Excel/CSV)

## 项目结构
```
client/          # UniApp 前端
  src/pages/     # 页面 (首页/试验详情/录音记录/导出)
  src/services/  # API 服务
server/          # Node.js 后端
  src/routes/    # API 路由
  src/models/    # 数据模型
  src/services/  # AI 服务 (可插拔适配器)
  tests/         # 测试
```
