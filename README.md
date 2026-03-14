
# GAC新技术科- 智驾网联室 - 测试用例管理系统

智驾场地试验用例管理系统，基于 Kiwi TCMS。

## 技术栈

| 层级 | 技术 |
|-----|------|
| 后端 | FastAPI + Python |
| 前端 | React + Ant Design |
| 测试管理 | Kiwi TCMS |
| 官方 API | tcms-api |

## 项目结构

```
路测助手/
├── .trae/                    # Trae IDE 配置
│   ├── rules/               # 项目规则
│   │   ├── core_principles.md
│   │   └── lessons_learned.md
│   └── mcp.json            # MCP 配置
├── glue-service/            # 后端胶水服务
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务服务
│   │   └── models/         # 数据模型
│   ├── venv/               # Python 虚拟环境
│   └── requirements.txt    # Python 依赖
├── road-test-frontend/     # 前端
│   ├── src/
│   └── package.json
└── 项目文档/               # 项目文档
    ├── 功能验收清单.md
    ├── 用例管理需求-需求文档.md
    └── 胶水编程.md
```

## 快速开始

### 前置条件

- Windows 10/11
- PowerShell 终端
- Docker Desktop (使用 WSL2)
- Python 3.12+
- Node.js 18+

### 后端启动

```powershell
cd glue-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```powershell
cd road-test-frontend
npm install
npm run dev
```

### Kiwi TCMS

使用 Docker Desktop (WSL2) 运行：

```powershell
docker run -d --name kiwi -p 8443:8443 kiwitcms/kiwi:latest
```

**注意**：首次访问 https://localhost:8443 时，浏览器会提示证书不安全，这是正常的，可以忽略。

---

## 另一台电脑首次设置

### 1. 克隆仓库

```powershell
git clone https://github.com/tiae8823-byte/Test-Case-Management-System.git
cd Test-Case-Management-System
```

### 2. 安装前置条件

- Windows 10/11
- PowerShell 终端
- Docker Desktop (使用 WSL2)
- Python 3.12+
- Node.js 18+
- Trae IDE（推荐，项目已包含 Trae 配置）

### 3. 创建 Python 虚拟环境

```powershell
cd glue-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. 安装前端依赖

```powershell
cd road-test-frontend
npm install
```

### 5. 启动 Kiwi TCMS

```powershell
docker run -d --name kiwi -p 8443:8443 kiwitcms/kiwi:latest
```

### 6. 用 Trae IDE 打开项目

用 Trae IDE 打开项目根目录，Trae 会自动加载：
- `.trae/rules/`
- `.trae/.ignore` - 索引忽略配置
- `.trae/mcp.json` - MCP 配置

---

## 开发指南

### Trae IDE 配置

项目已包含 Trae IDE 配置，开箱即用：

- `.trae/rules/core_principles.md` - 核心原则（始终生效）
- `.trae/rules/lessons_learned.md` - 经验教训（手动触发生效）

### 胶水编程方法论

遵循项目文档中的胶水编程原则：
- 凡是能不写的就不写，凡是能少写的就少写
- 凡是能 CV 就 CV
- 不修改原仓库代码
- 自定义代码越少越好

## MVP 1.0 进度

| 功能 | 状态 |
|-----|------|
| F001 - 测试用例 CRUD | 🔄 进行中 |
| F002 - 层级展示 | 🔄 进行中 |
| F003 - 批量导入导出 | ⏳ 待验收 |
| F004 - 分类筛选搜索 | ⏳ 待验收 |
| F005 - 权限管理 | ⏳ 待验收 |

## 许可证

MIT

