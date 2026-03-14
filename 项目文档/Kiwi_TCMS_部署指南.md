# Kiwi TCMS 本地部署指南

## 前提条件

确保已安装以下软件：

1. **Docker Desktop** (Windows/Mac/Linux)
   - 下载地址: https://www.docker.com/products/docker-desktop/

## 部署步骤

### 1. 启动 Docker Desktop

在 Windows 系统上：
- 从开始菜单启动 **Docker Desktop**
- 等待 Docker 完全启动（右下角任务栏出现鲸鱼图标变为绿色

### 2. 验证 Docker 运行状态

打开 PowerShell 或命令提示符，执行：

```bash
docker --version
docker compose version
```

### 3. 启动 Kiwi TCMS

在项目目录 `d:\开发项目集\路测助手` 下执行：

```bash
cd d:\开发项目集\路测助手
docker compose --project-name kiwi-tcms up -d
```

### 4. 等待服务启动

首次启动会拉取镜像，需要等待几分钟。
查看启动状态：

```bash
docker compose --project-name kiwi-tcms ps
```

查看日志：

```bash
docker compose --project-name kiwi-tcms logs -f
```

### 5. 访问 Kiwi TCMS

服务完全启动后，在浏览器访问：

```
http://localhost:8080
```

### 6. 首次登录

- 访问 http://localhost:8080
- 点击右上角 "Create an account" 注册账号
- 或使用默认管理员账号（如已配置）

## 常用命令

| 命令 | 说明 |
|------|------|
| `docker compose --project-name kiwi-tcms up -d | 启动服务 |
| `docker compose --project-name kiwi-tcms down | 停止服务 |
| `docker compose --project-name kiwi-tcms ps | 查看容器状态 |
| `docker compose --project-name kiwi-tcms logs -f | 查看实时日志 |
| `docker compose --project-name kiwi-tcms logs web | 查看 Web 服务日志 |
| `docker compose --project-name kiwi-tcms logs db | 查看数据库日志 |

## 数据持久化

- PostgreSQL 数据存储在 Docker Volume: `kiwi-tcms_postgres_data`
- 上传文件存储在 Docker Volume: `kiwi-tcms_kiwi_uploads`

## 清理（慎用）

如需完全重置（删除所有数据）：

```bash
docker compose --project-name kiwi-tcms down -v
```

## 故障排查

### 端口被占用
如 8080 端口被占用，修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8081:8080"
```

### Docker Desktop 未启动
确保 Docker Desktop 正在运行且右下角图标为绿色
