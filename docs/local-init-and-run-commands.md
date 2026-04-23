# 本地初始化与启动命令

本文档用于记录这个项目在本地开发时最常用的初始化、启动、调试、测试与排查命令。

适用环境：
- Windows
- PowerShell
- HBuilderX
- 微信开发者工具

---

## 1. 首次初始化

### 1.1 克隆项目

```powershell
git clone https://github.com/tiae8823-byte/GAC-Road-Test-Assistant.git
cd GAC-Road-Test-Assistant
```

### 1.2 安装后端依赖

```powershell
cd server
npm install
cd ..
```

### 1.3 初始化后端环境变量

```powershell
Copy-Item .\server\.env.example .\server\.env
```

然后手动编辑：
- `server/.env`

至少填一个 AI Key：

```env
ZHIPU_API_KEY=你的key
```

或：

```env
DASHSCOPE_API_KEY=你的key
```

如果两个都不填，后端会使用 Mock AI。

---

## 2. 后端启动命令

### 2.1 开发模式启动后端

```powershell
cd server
npm run dev
```

说明：
- 使用 `nodemon`
- 代码变更后自动重启

### 2.2 普通模式启动后端

```powershell
cd server
npm start
```

### 2.3 后端健康检查

后端启动后，可用以下命令确认是否正常：

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/health
```

如果正常，返回内容里应包含：

```json
{"status":"ok"}
```

### 2.4 检查 3000 端口是否监听

```powershell
netstat -ano | findstr :3000
```

### 2.5 查找占用 3000 端口的进程

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen
```

---

## 3. 前端启动方式

### 3.1 打开前端工程

前端不是靠命令行直接启动，而是通过 HBuilderX。

操作：

1. 打开 HBuilderX
2. 选择 `client/` 目录

### 3.2 运行到 H5

在 HBuilderX 中：

1. 打开 `client/`
2. 菜单选择“运行”
3. 运行到浏览器

H5 默认通过代理访问后端：
- 前端地址通常是 `http://localhost:8080`
- 后端地址是 `http://localhost:3000`

---

## 4. 微信小程序启动方式

### 4.1 每次换网络后先同步本机 IP

如果你使用手机热点或经常切换局域网，先执行：

```powershell
.\scripts\sync-client-api-env.ps1
```

或双击执行：

```bat
scripts\sync-client-api-env.cmd
```

这个脚本会自动：

1. 识别当前活动网卡
2. 找到当前电脑的 IPv4 地址
3. 写入 `client/.env`
4. 在 `scripts/logs/` 下生成执行日志

写入内容类似：

```env
VITE_API_BASE_URL=http://10.164.148.44:3000
VITE_API_TIMEOUT=10000
```

如果脚本执行失败或窗口闪退，先查看最近日志：

```powershell
Get-ChildItem .\scripts\logs | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

### 4.2 查看当前前端小程序环境变量

```powershell
Get-Content .\client\.env
```

### 4.3 运行到微信小程序

在 HBuilderX 中：

1. 打开 `client/`
2. 菜单选择“运行”
3. 运行到小程序模拟器
4. 选择微信开发者工具

### 4.4 微信开发者工具重新编译

如果你刚改了 `.env` 或刚切网络，建议在微信开发者工具中：

1. 重新编译
2. 必要时清缓存再编译

---

## 5. 常见调试命令

### 5.1 查看当前电脑 IP

```powershell
ipconfig
```

### 5.2 只看活动 IPv4 网卡

```powershell
Get-NetIPConfiguration | Where-Object { $_.IPv4Address -and $_.NetAdapter.Status -eq 'Up' -and $_.IPv4DefaultGateway } | Select-Object InterfaceAlias,@{Name='IPv4';Expression={$_.IPv4Address.IPAddress}}
```

### 5.3 查看当前前端请求目标地址

```powershell
Get-Content .\client\.env
```

### 5.4 查看后端日志输出

如果你是前台运行：
- 直接看当前终端

如果你自己后台启动过，也可以查看：

```powershell
Get-Content .\server\server.stdout.log -Tail 50
Get-Content .\server\server.stderr.log -Tail 50
```

### 5.5 测试后端接口是否可访问

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/projects
```

### 5.6 测试热点 IP 下是否可访问后端

把下面 IP 替换成 `client/.env` 当前值：

```powershell
Invoke-WebRequest -UseBasicParsing http://10.164.148.44:3000/api/health
```

### 5.7 检查 HBuilderX 小程序日志回显端口

`uni-app` 运行到微信小程序开发者工具时，开发态还会额外建立一个日志回显 socket，默认会尝试连接电脑上的 `8090` 端口。

```powershell
netstat -ano | findstr :8090
```

如果这里超时，常见现象是微信开发者工具控制台出现：

```text
Error: timeout
开发模式下日志通道建立 socket 连接失败。
如果是运行到真机，请确认手机与电脑处于同一网络。
```

这类报错优先视为 `HBuilderX -> 微信开发者工具` 的开发日志通道异常，不是业务后端 `3000` 接口本身报错。

---

## 6. 测试命令

### 6.1 运行全部后端测试

```powershell
cd server
npm test
```

### 6.2 运行单个测试文件

```powershell
cd server
npx jest tests/queries.test.js --forceExit
```

---

## 7. 常见维护命令

### 7.1 查看 git 状态

```powershell
git status --short
```

### 7.2 查看某个文件的改动

```powershell
git diff -- .\client\services\api.js
```

---

## 8. 小程序网络排查结论

### 8.1 先区分两类超时

`3000` 端口：
- 这是你的业务后端接口
- 例如 `http://10.x.x.x:3000/api/projects`
- 如果失败，前端现在会弹出真实错误信息，并在控制台打印 `[API] request failed`

`8090` 端口：
- 这是 `uni-app/HBuilderX` 开发态日志回显 socket
- 超时只代表日志通道没有连上，不等于后端挂了

### 8.2 你现在这个项目的推荐判断顺序

1. 先执行 `.\scripts\sync-client-api-env.ps1`
2. 再确认 `client/.env` 里的 `VITE_API_BASE_URL` 是当前热点 IP
3. 用 `Invoke-WebRequest http://当前IP:3000/api/health` 验证后端
4. 重新运行到微信小程序
5. 如果页面弹出接口错误，看弹窗内容和控制台里的 `[API]` 日志
6. 如果只有 `Error: timeout` 且指向 `WAServiceMainContext.js`，同时页面数据正常加载，说明只是 `8090` 日志通道问题

### 8.3 如何减少 8090 日志通道误报

根据 uni-app 官方文档，小程序运行日志回显依赖 socket 连接。处理方式：

- 在微信开发者工具里勾选“不校验合法域名”
- 若是真机调试，确保手机和电脑在同一网段
- 确认 Windows 防火墙没有拦截相关连接
- 如果不需要 HBuilderX 控制台实时回显日志，可在 HBuilderX 控制台右上角关闭“小程序运行日志回显”，然后重新运行项目

### 8.4 查看前端环境变量示例

```powershell
Get-Content .\client\.env.example
```

---

## 9. 典型启动流程

### 9.1 H5 开发

```powershell
cd D:\Projects\GAC-Road-Test-Assistant\server
npm run dev
```

然后：

1. 打开 HBuilderX
2. 打开 `client/`
3. 运行到浏览器

### 9.2 微信小程序开发

```powershell
cd D:\Projects\GAC-Road-Test-Assistant
.\scripts\sync-client-api-env.ps1
cd .\server
npm run dev
```

然后：

1. 打开 HBuilderX
2. 打开 `client/`
3. 运行到微信开发者工具

---

## 10. 常见故障与对应处理

### 10.1 小程序访问不到后端

先检查：

```powershell
Get-Content .\client\.env
Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/health
ipconfig
```

排查顺序：

1. 后端是否启动
2. `.env` 中 IP 是否还是旧热点地址
3. 当前电脑 IP 是否已经变化
4. 微信开发者工具是否重新编译

### 10.2 切换热点后突然超时

执行：

```powershell
.\scripts\sync-client-api-env.ps1
```

然后重新运行到微信小程序。

### 10.3 HBuilderX 里可以运行，微信工具里不通

优先检查：

1. `client/.env` 是否为当前活动网卡地址
2. 后端是否监听 `3000`
3. 微信开发者工具是否用了旧缓存

---

## 11. 关键文件位置

- 前端环境变量：`client/.env`
- 前端环境变量示例：`client/.env.example`
- 后端环境变量：`server/.env`
- 小程序 IP 同步脚本：`scripts/sync-client-api-env.ps1`
- 双击版脚本：`scripts/sync-client-api-env.cmd`
- 前端 API 封装：`client/services/api.js`
- 前端运行时配置：`client/services/config.js`
- 后端入口：`server/src/app.js`
