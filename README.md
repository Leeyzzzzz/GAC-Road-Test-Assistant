# 路测助手 MVP

智驾场地试验用例管理系统。当前 Phase 1 已重构为“项目 -> 试验 -> 记录”三层工作流：技术负责人先管理项目，再在项目内创建和维护试验，执行人员继续在试验内录音、整理记录并导出。

## 环境要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.x | 后端运行时 |
| npm | >= 9.x | 随 Node.js 安装 |
| HBuilderX | 最新版 | 前端编译和运行（必须） |
| Git | 任意 | 版本管理 |

下载 HBuilderX：https://www.dcloud.io/hbuilderx.html

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/tiae8823-byte/GAC-Road-Test-Assistant.git
cd GAC-Road-Test-Assistant
```

### 2. 后端启动

```bash
cd server
npm install
cp .env.example .env
# 编辑 .env，填入 AI API Key（至少填一个）
#   ZHIPU_API_KEY=xxx       （智谱 GLM，默认）
#   DASHSCOPE_API_KEY=xxx   （通义千问，备选）
npm run dev
```

后端运行在 http://localhost:3000，首次启动自动创建 SQLite 数据库。

### 3. 前端启动

1. 打开 HBuilderX
2. 菜单：文件 → 打开目录 → 选择项目的 `client/` 文件夹
3. 菜单：运行 → 运行到浏览器（或运行到手机/模拟器）
4. H5 模式自动代理 `/api` 到后端 `localhost:3000`

H5 开发地址：http://localhost:8080

### 4. 真机调试

手机和电脑需在同一局域网或同一手机热点下。前端从 `client/.env` 读取后端地址，而不是把地址写死在源码里。

先复制示例文件并填写当前电脑可访问的后端地址：

```powershell
Copy-Item client/.env.example client/.env
```

`client/.env` 内容示例：

```env
VITE_API_BASE_URL=http://192.168.x.x:3000
VITE_API_TIMEOUT=10000
```

然后在 HBuilderX 中重新运行到手机（USB 连接或扫码）。

## 运行测试

```bash
cd server
npm test                    # 运行全部测试
npx jest tests/queries.test.js --forceExit  # 运行单个测试文件
```

## 环境变量说明

在 `server/.env` 中配置（参考 `.env.example`）：

| 变量 | 必填 | 说明 |
|------|------|------|
| `ZHIPU_API_KEY` | 二选一 | 智谱 GLM API Key（当前默认使用） |
| `DASHSCOPE_API_KEY` | 二选一 | 通义千问 API Key（推荐，ASR 无 30 秒限制） |
| `PORT` | 否 | 后端端口，默认 3000 |
| `DB_PATH` | 否 | SQLite 数据库路径，默认 `data/roadtest.db` |

## 项目结构

```
client/                  # UniApp + Vue3 前端（HBuilderX 管理）
  pages/
    index/               # 首页 - 我的项目工作台
    project-detail/      # 项目详情 / 创建项目 / 编辑项目
    project-archive/     # 归档项目列表
    session-detail/      # 试验详情 / 新建试验 / 编辑试验
    record/              # 录音记录（核心页面）
    export/              # 数据导出
  services/api.js        # API 调用封装
  services/config.js     # 环境变量读取（process.env.VITE_*）
  vite.config.js         # Vite 配置，注入客户端环境变量
  manifest.json          # UniApp 应用配置
  pages.json             # 页面路由和导航栏

server/                  # Node.js + Express 后端
  src/
    app.js               # 入口，挂载路由和中间件
    models/
      database.js        # SQLite 建表（自动执行）
      queries.js         # 所有 CRUD 查询函数
    routes/              # Express 路由（projects/sessions/records/upload/export/ai）
    services/
      ai-service.js      # AI 适配器选择器（根据环境变量自动切换）
      zhipu-adapter.js   # 智谱 GLM 适配器（ASR + 文本提取）
      qwen-adapter.js    # 通义千问适配器
      mock-adapter.js    # Mock 适配器（无 API Key 时使用）
  tests/                 # Jest + supertest 测试
  uploads/               # 上传文件存储目录
  data/                  # SQLite 数据库文件目录

docs/                    # 设计文档
  superpowers/specs/     # PRD / 产品需求文档
```

## 技术栈

| 组件 | 选型 | 说明 |
|------|------|------|
| 前端框架 | UniApp + Vue3 | 跨端（H5 + 企业微信小程序），HBuilderX 编译 |
| UI 组件 | TDesign UniApp | 首页、项目页、试验页优先复用组件能力 |
| 后端 | Node.js + Express | 轻量，快速出 MVP |
| 数据库 | SQLite (better-sqlite3) | MVP 阶段本地存储，后续可迁移 MySQL |
| 文件存储 | 本地 uploads 目录 | 后续迁移阿里云 OSS |
| AI 语音转文字 | 智谱 GLM-ASR-2512 / 通义千问 qwen3-asr-flash | 可插拔切换 |
| AI 文本提取 | 智谱 glm-4-flash / 通义千问 qwen-plus | 可插拔切换 |
| 导出 | xlsx 库 | Excel/CSV |

## 另一台电脑迁移指南

1. 安装 Node.js（>= 18）和 HBuilderX
2. `git clone` 拉取代码
3. `cd server && npm install`
4. 复制 `.env.example` 为 `.env`，填入 API Key
5. `npm run dev` 启动后端
6. HBuilderX 打开 `client/` 目录，运行到浏览器
7. 如果真机调试，复制 `client/.env.example` 为 `client/.env`，并把 `VITE_API_BASE_URL` 改成新电脑的内网 IP

## 当前页面流

- `我的项目`：只展示未归档项目，支持创建、编辑、归档、删除项目
- `归档项目`：查看已归档项目，支持恢复和彻底删除
- `项目详情`：查看项目概览，按测试日期升序管理该项目下的试验
- `试验详情`：只允许在已有项目上下文中创建试验，不再支持手填项目名建项目
- `录音记录` / `导出`：延续原有记录采集和导出流程
