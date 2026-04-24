# Claude Code Skills 管理

> 更新于 2026-04-24 · 已通过 symlink 按来源项目分组

## 总览

共 **30 个 skill**，来自 3 个独立来源：

| 来源 | 项目链接 | 数量 | 加载方式 |
|------|---------|------|---------|
| `takleb3rry/claude-global-appbuilding-skills` | [GitHub](https://github.com/takleb3rry/claude-global-appbuilding-skills) | 14 | symlink → `~/claude-skills/takleb3rry-appbuilding/` |
| `obra/superpowers` 插件 | [GitHub](https://github.com/obra/superpowers) | 14 | 插件系统自动管理 |
| 独立来源 | — | 1 (`pdf`) | 普通目录 |

---

## 来源 1：takleb3rry/claude-global-appbuilding-skills（14 个）

**定位：** 项目生命周期管理（从创意到交付的完整流程）

**本地路径：** `~/claude-skills/takleb3rry-appbuilding/skills/`

**更新命令：**
```bash
cd ~/claude-skills/takleb3rry-appbuilding && git pull
```

| # | Skill | 功能 | 触发场景 |
|---|-------|------|---------|
| 1 | `ideation-simple` | 探索问题空间、理解用户 | 项目创意初期 |
| 2 | `ideation-complex` | 复杂项目分块识别 + 结构化输出 | 大型项目创意引导 |
| 3 | `ideation-research` | 深度市场调研和假设映射 | 创意阶段第二步 |
| 4 | `ideation-synthesize` | 生成解决方案假设 | 准备进入 kickoff |
| 5 | `kickoff` | 分析源文档 → 生成 requirements.md + design.md | 项目启动 |
| 6 | `tech-stack` | 技术选型讨论 | 新技术项目 |
| 7 | `plan-phase` | 规划实施阶段、评估工作量 | 编码前的计划阶段 |
| 8 | `execute-phase` | 执行已批准的计划（自动测试 + UI 验证）| 开始编码 |
| 9 | `commit-phase` | 完整 git 工作流：分支、提交、合并、清理 | 阶段完成 |
| 10 | `harmonize` | 规范化代码风格、添加 data-testid | E2E 测试前 |
| 11 | `comprehensive-test` | 全面预部署测试（Playwright/Cypress + MSW）| 部署前 |
| 12 | `ai-governance` | AI 治理审计、评估 AI 使用风险 | 审查 AI 使用 |
| 13 | `diagnose` | 系统化根因分析 | Bug 排查 |
| 14 | `verify` | 轻量级验证——修改后确认正确 | 完成修复后 |

---

## 来源 2：obra/superpowers 插件（14 个）

**定位：** 开发工作流模式（底层执行技巧）

**版本：** 5.0.7（通过 `superpowers@claude-plugins-official` 安装）

**更新命令：**
```bash
claude plugins update superpowers
```

| # | Skill | 功能 |
|---|-------|------|
| 1 | `brainstorming` | 头脑风暴 |
| 2 | `dispatching-parallel-agents` | 并行 agent 调度 |
| 3 | `executing-plans` | 执行计划 |
| 4 | `finishing-a-development-branch` | 完成开发分支 |
| 5 | `receiving-code-review` | 接收代码审查 |
| 6 | `requesting-code-review` | 请求代码审查 |
| 7 | `subagent-driven-development` | 子 agent 驱动开发 |
| 8 | `systematic-debugging` | 系统化调试 |
| 9 | `test-driven-development` | 测试驱动开发 (TDD) |
| 10 | `using-git-worktrees` | 使用 Git Worktree |
| 11 | `using-superpowers` | Superpowers 使用指南 |
| 12 | `verification-before-completion` | 完成前验证 |
| 13 | `writing-plans` | 编写计划 |
| 14 | `writing-skills` | 编写 Skill |

---

## 来源 3：独立 skill（1 个）

| # | Skill | 功能 |
|---|-------|------|
| 1 | `pdf` | PDF 读写、合并、拆分、OCR、表单填充 |

---

## 如何添加新来源

```bash
# 1. 克隆
git clone <repo-url> ~/claude-skills/<project-name>

# 2. 创建 symlink
cd ~/.claude/skills
python -c "
import os
src = os.path.expanduser('~/claude-skills/<project-name>/skills')
for name in os.listdir(src):
    os.symlink(os.path.join(src, name), os.path.join(os.getcwd(), name), target_is_directory=True)
"
```

## 日常维护 checklist

```bash
# 更新 takleb3rry skill
cd ~/claude-skills/takleb3rry-appbuilding && git pull

# 更新 superpowers 插件
claude plugins update superpowers

# 查看所有 skill 来源
cd ~/.claude/skills && python -c "
import os
for name in sorted(os.listdir('.')):
    p = os.path.join(os.getcwd(), name)
    src = os.readlink(p) if os.path.islink(p) else '(plain dir)'
    print(f'{name:30s} {src}')
"
```
