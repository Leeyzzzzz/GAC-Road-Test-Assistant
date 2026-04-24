# UX 布局优化 · 分阶段实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将路测助手剩余5个页面的UX/UI风格统一到设计系统（#1E293B主色 + 白色卡片 + 24rpx圆角），优化信息密度和操作布局。

**架构说明：** 所有变更均为前端模板+样式改动，不涉及后端API。每个页面独立，无共享组件依赖，可按任意顺序实施。

**Tech Stack:** UniApp + Vue3 + TDesign UniApp 0.8.x

**UX 预览参考:** `ux-preview/index.html` — 包含每个页面的前后对比手机框

---

## 分阶段策略

| 阶段 | 页面 | 文件数 | 风险 | 工作量 | 建议 |
|------|------|--------|------|--------|------|
| **Phase 1** | 导出页面 | 1 | 低 | ~150行 | 最独立，风格脱节最严重，快速出效果 |
| **Phase 2** | 首页 + 归档 | 2 | 低 | ~300行 | 模式相似，批量改效率高 |
| **Phase 3** | 项目详情 + 试验详情 | 2 | 低 | ~300行 | 改动较轻，收尾阶段 |

---

## Phase 1: 导出页面翻新

**文件:** `client/pages/export/index.vue`

**问题清单：** 蓝色渐变头部不统一、原生picker简陋、自定义tag非t-tag、原生button非t-button、缺少loading反馈

### 模板变更

- [ ] **Step 1: 替换头部区域**
  - 去掉 `background: linear-gradient(135deg, #1890ff, #36cfc9)` 的header
  - 改为和其他页面一致的简单标题+副标题结构，使用 `--td-text-color-primary` 色值

- [ ] **Step 2: 替换试验选择器**
  - 把原生picker包装到卡片 `class="card"` 内
  - picker盒子改用 `background: #f8fafc; border: 2rpx solid #d7dce3; border-radius: 16rpx; padding: 24rpx;`
  - 选中后文本显示试验名+日期+路线，placeholder 显示"请选择试验"

- [ ] **Step 3: 替换预览卡片**
  - 每条的容器改为 `class="card section-card"` 风格（白色背景+圆角+阴影）
  - 使用 `t-tag` 替代自定义 `.tag` 元素
  - 预览卡片添加严重度左侧色条：`border-left: 6rpx solid var(--td-error-color)`

- [ ] **Step 4: 替换导出按钮**
  - Excel导出用 `t-button theme="primary" block :loading="exporting"`
  - CSV导出用 `t-button variant="outline" block`
  - 去掉 `disabled` 时的opacity样式（t-button自带）

- [ ] **Step 5: 重写CSS**
  - 移除所有旧样式（`.header`, `.btn-export`, `.btn-csv`, `.tag`, `.preview-card` 等）
  - 使用 `.page { background: #f3f5f7; padding: 24rpx; }`
  - 使用 `.card { background: #fff; border-radius: 24rpx; box-shadow; padding: 28rpx; }` 统一卡片
  - 使用 `--td-*` CSS变量引用主题色

### Script 变更（少量）

- [ ] **Step 6: 保持script逻辑不变，只在`doExport`方法中通过 `exporting = true/false` 控制loading状态**（已有）
  - 验证 `exporting` 状态切换逻辑完整

### 验收标准

- [ ] 导出页面看起来和其他页面风格一致（白底+卡片）
- [ ] 试验选择器在卡片内，选中后显示清楚的信息
- [ ] 预览记录使用t-tag显示类型和严重度
- [ ] 导出按钮有loading状态（t-button自带动画）
- [ ] Excel/CSV两个按钮视觉有主次区分

---

## Phase 2: 首页 + 归档页面优化

**文件:**
- `client/pages/index/index.vue` — 项目列表首页
- `client/pages/project-archive/index.vue` — 归档项目页

### Task 2A: 首页（项目列表）

**问题清单：** Hero区空间浪费、统计卡片信息密度低、3个操作按钮混乱、缺少搜索筛选

- [ ] **Step 1: 紧凑化Hero区**
  - 标题 "我的项目" 字号从44rpx → 36rpx
  - 去掉副标题或简化为一行
  - "归档项目" 按钮从底部 toolbar 移到标题右侧，作为链接文字

- [ ] **Step 2: 统计区改为inline badges**
  - 去掉 `stats-grid` 的grid布局（3列卡片）
  - 改为 `display: flex; gap: 12rpx; flex-wrap: wrap` 的badge行
  - 每个badge：`padding: 6rpx 16rpx; border-radius: 20rpx; font-size: 24rpx`
  - 进行中项目数使用 `background: var(--td-brand-color); color: #fff`
  - 本周新增使用 `background: var(--td-success-color); color: #fff`

- [ ] **Step 3: 添加搜索栏UI**
  - 在项目列表上方添加搜索栏（纯UI，搜索功能后续实现）
  - 样式：`background: #fff; border-radius: 16rpx; padding: 20rpx 24rpx; font-size: 26rpx; color: #94a3b8`
  - 内容："🔍 搜索项目名称或编号…" 作为placeholder

- [ ] **Step 4: 优化项目卡片布局**
  - 卡片添加左侧色条：`border-left: 6rpx solid`
    - 有进行中试验使用 `--td-success-color`
    - 全部已结束使用 `#94a3b8`
  - 右上角"编辑/归档/删除"3按钮替换为 "查看项目"（primary） + "⋯ 更多"（outline）
  - 在meta行增加"最近试验日期"
  - 项目编号 tag 移到标题右侧

- [ ] **Step 5: 重写CSS**
  - 移除 `.stats-grid`, `.stat-card`, `.stat-value`, `.stat-label`
  - 移除 `.toolbar`（功能迁移）
  - 新增 badge 样式、搜索栏样式
  - 缩减 `.hero` 的 padding

### Task 2B: 归档页面

**问题清单：** 和首页同质化严重、缺少筛选、布局冗余

- [ ] **Step 1: 替换头部**
  - 标题 "归档项目" 加图标标识（text "🗄" + title）
  - 副标题保留但缩短
  - 添加 "选择模式" 链接文字在标题右侧

- [ ] **Step 2: 添加筛选tabs**
  - 添加一行filter：全部 / 近期归档 / 更早
  - 样式：和首页badge一致（选中态用主色填充，非选中用灰色）

- [ ] **Step 3: 卡片紧凑化**
  - 卡片内边距从28rpx缩减到20rpx
  - 卡片添加左侧灰色色条 `border-left: 6rpx solid #94a3b8`
  - 项目编号+归档时间合并到一行副标题
  - 操作按钮改为 inline 紧凑样式
  - 去掉 `.project-actions` 的flex布局，改为按钮直接放在卡片内容右侧

- [ ] **Step 4: 重写CSS**
  - 移除冗余的hero样式
  - 删除 `.project-head`, `.project-meta` 旧样式
  - 新增filter tabs样式

### 验收标准

- [ ] 首页显示了更多项目信息（最近试验日期、进度）
- [ ] 统计数字变为更紧凑的badge
- [ ] 搜索栏存在（UI，功能后续）
- [ ] 项目卡片操作按钮从3个减为2个（查看+更多）
- [ ] 归档页面和首页视觉上有明显区分
- [ ] 归档页面有筛选tabs

---

## Phase 3: 项目详情 + 试验详情优化

**文件:**
- `client/pages/project-detail/index.vue` — 项目详情（含试验列表）
- `client/pages/session-detail/index.vue` — 试验详情（含记录列表）

### Task 3A: 项目详情

**问题清单：** 操作按钮3个并列、日期分组视觉弱、表单无实时校验

- [ ] **Step 1: Hero卡片改为深色背景**
  - 白色卡片 → 深色卡片 `background: var(--td-brand-color); color: #fff`
  - 项目名称白色，编号半透明
  - 操作按钮（编辑/归档/删除）移到右上角"⋯"菜单
  - 增加统计行：总试验 / 进行中 / 总记录 / 最近活动
  - 去除 `.project-actions` 的3按钮布局

- [ ] **Step 2: 添加筛选tabs**
  - 在试验列表上方添加：全部 / 进行中 / 已结束
  - 交互：点击切换时过滤 `groupedSessions`（前端过滤）

- [ ] **Step 3: 日期分组增强**
  - 每组增加日历图标 `📅` + 日期 + "N条试验"
  - 组标题字号从28rpx→26rpx，颜色 `#64748B`
  - 添加分割线 `border-top: 2rpx solid #f0f2f5` 在组之间

- [ ] **Step 4: 试验卡片紧凑化**
  - 卡片左右结构：左侧内容 + 右侧状态tag
  - 车辆信息和路线合并到一行
  - "编辑/删除" 按钮改为右上角的图标按钮
    - 编辑：`t-button size="small" variant="outline"` + icon
    - 删除：`t-button size="small" variant="outline" theme="danger"` + icon
  - 可选：添加记录数tag

- [ ] **Step 5: 表单增加输入提示（可选）**
  - 在字段下方增加辅助文字（如 "例如：GAC-ADAS-001"）
  - 提交时如果有空字段，在对应字段下方显示红色提示文字（而非toast）

- [ ] **Step 6: CSS调整**
  - 新增深色hero卡片样式
  - 调整日期分组样式
  - 新增筛选tabs样式

### Task 3B: 试验详情

**问题清单：** 记录卡片信息单薄、FAB遮挡风险（已有padding）

- [ ] **Step 1: 信息卡片紧凑化**
  - 顶部大卡片保留但压缩内边距
  - 测试人员 + 日期 + 车辆 + 路线合并到两行
  - 右上角状态tag + "⋯"菜单（编辑/结束试验）
  - 增加统计行：总记录 / 已提交 / 草稿

- [ ] **Step 2: 记录卡片增强**
  - 每条记录添加左侧色条指示严重度
    - 致命/严重：`border-left: 6rpx solid var(--td-error-color)`
    - 一般：`border-left: 6rpx solid var(--td-warning-color)`
    - 轻微：`border-left: 6rpx solid #94a3b8`
  - 显示问题类型和严重度的小tag（使用 `t-tag size="small"`）
  - 时间戳移到右侧紧凑显示
  - 草稿状态使用左侧灰色虚线色条

- [ ] **Step 3: 添加筛选tabs**
  - 记录列表上方添加：全部 / 草稿 / 已提交
  - 交互：点击切换过滤 `records`（前端filter）

- [ ] **Step 4: CSS调整**
  - 移除 `session-card` 部分冗余样式
  - 新增记录卡片色条样式
  - 新增filter tabs（与Phase 2保持一致）

### 验收标准

- [ ] 项目详情头部改为深色卡片，信息更丰富
- [ ] 3个操作按钮收敛到"⋯"菜单
- [ ] 试验列表可筛选（全部/进行中/已结束）
- [ ] 日期分组更清晰
- [ ] 试验详情卡片显示更多信息
- [ ] 记录卡片有严重度色条
- [ ] 记录列表可筛选

---

## 注意事项

### 实施时需保持的
- 所有script逻辑不变（data、methods、生命周期）
- CSS变量引用 `var(--td-*)` 而非硬编码色值
- 使用TDesign组件（`t-button`, `t-tag`）而非自定义元素
- 页面底部保留 `160rpx` padding 给FAB/底部栏

### 实施时需避免的
- 不要新增后端依赖（搜索、批量操作等仅做UI骨架）
- 不要修改其他页面或全局样式
- 不要引入新npm包
- 不要修改 `pages.json` 或路由

### Commit规范
```
feat: redesign export page with card-based layout and t-button/t-tag
feat: optimize homepage with compact hero, search bar, and streamlined cards
feat: enhance project detail with dark hero card and session filters
feat: enrich session detail records with severity indicators and filters
```

每个Phase完成后独立commit，方便回滚。
