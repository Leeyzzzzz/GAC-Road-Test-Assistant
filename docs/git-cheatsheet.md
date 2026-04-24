# Git 速查手册

> 适用于个人项目日常开发，按使用频率排列。

---

## 一、日常工作流（每天用）

```
开始工作 → git pull
    ↓
写代码...
    ↓
git status          # 看改了啥
git diff            # 看具体改动
    ↓
git add <文件>      # 选定要提交的
git commit -m "说明"
    ↓
git push            # 推到远程
```

### 常用命令

```bash
# 查看状态
git status                  # 哪些文件改了、哪些还没跟踪
git status -s               # 简洁版（左边绿色=已暂存，右边红色=未暂存）

# 查看改动内容
git diff                    # 所有未暂存的改动
git diff --staged           # 已暂存的改动（即将提交的）
git diff file.js            # 只看某个文件

# 提交
git add file.js             # 添加指定文件
git add .                   # 添加所有改动（先 git status 确认一下）
git commit -m "feat: 新功能描述"
git commit -am "fix: 修复bug"  # add + commit 一步到位（仅限已跟踪文件）

# 同步
git pull                    # 拉取远程更新
git push                    # 推送到远程
```

### commit 消息规范（约定俗成）

```
feat: 新功能
fix:  修复 bug
docs: 文档改动
refactor: 重构（不改功能）
chore: 杂项（配置、gitignore 等）
style: 代码格式调整（不影响逻辑）
```

---

## 二、查看历史

```bash
git log --oneline           # 简洁版提交记录（最常用）
git log --oneline -10       # 最近 10 条
git log --oneline -- file.js  # 某个文件的历史
git show 8f279bb            # 看某次提交的具体改动
git blame file.js           # 每一行是谁在哪个 commit 改的
```

---

## 三、撤销和回退（最常搞混）

### 场景速查表

| 场景 | 命令 | 效果 |
|------|------|------|
| 改了文件，还没 add，想撤回 | `git restore file.js` | 文件回到上次 commit 的状态 |
| 已经 add，想取消暂存 | `git restore --staged file.js` | 退回工作区，改动不丢失 |
| 已经 commit，想撤回提交 | `git reset --soft HEAD~1` | 撤回 1 次 commit，改动保留在暂存区 |
| 已经 commit，想撤回且不保留暂存 | `git reset HEAD~1` | 撤回 1 次 commit，改动保留在工作区 |
| 想彻底回到远程状态 | `git fetch origin && git reset --hard origin/main` | **危险！丢弃所有本地改动** |

> **记忆：** `restore` 撤文件，`--staged` 退暂存，`reset` 退提交，`--hard` 最危险。

---

## 四、分支（Branch）

### 什么是分支？

把分支想象成**平行时间线**。你在主线（main）开发到一半，想试一个新想法，但又怕搞坏现有代码，就开一条新分支去实验。成功了再合并回主线，失败了直接删掉，主线毫发无损。

```
main:     A --- B --- C --- F --- G  （主线，稳定版本）
               \         /
feature:        D --- E              （实验分支，做完了合并回来）
```

### 为什么个人开发也用得上？

- **做新功能时**：在 `feature/xxx` 分支开发，做完了合并回 main，保持 main 随时可运行
- **修 bug 时**：在 `fix/xxx` 分支修，修完合并，不会中途污染 main
- **实验性改动**：不确定行不行，开分支试，不行就删掉，毫无风险

### 分支命令

```bash
# 查看
git branch                  # 列出所有本地分支（* 号标记当前分支）
git branch -a               # 包含远程分支

# 创建 + 切换
git switch -c feature/new-ui    # 创建新分支并切过去（一步到位）
git switch main                  # 切回主线

# 合并（先切回 main）
git switch main
git merge feature/new-ui        # 把 feature 分支的改动合并到 main

# 删除分支（合并成功后）
git branch -d feature/new-ui    # 删除已合并的分支

# 强制删除（不管有没有合并）
git branch -D feature/new-ui    # 实验失败，直接删掉

# 查看分支合并图
git log --oneline --graph --all
```

### 常用分支命名习惯

```
main                # 主线（稳定版本）
feature/pc-layout   # 新功能
fix/gps-bug         # 修 bug
experiment/xxx      # 实验
```

### 典型工作流

```bash
# 1. 在 main 上开始一个新功能
git switch -c feature/pc-layout

# 2. 在 feature 分支上正常开发、提交
git add .
git commit -m "feat: add PC responsive layout"

# 3. 功能做完了，合并回 main
git switch main
git merge feature/pc-layout

# 4. 删除已合并的分支
git branch -d feature/pc-layout

# 5. 推送到远程
git push
```

---

## 五、临时保存（Stash）

```bash
# 场景：做到一半，需要切分支处理别的事，但当前改动还没完成不想 commit
git stash                   # 临时藏起当前改动
git stash list              # 查看藏了哪些
git stash pop               # 取出最近一次（并删除记录）
git stash drop              # 丢弃最近一次 stash
```

> **类比：** 把桌上文件塞进抽屉，处理完别的事再拿出来继续。

---

## 六、远程仓库

```bash
git remote -v               # 查看远程仓库地址
git pull                    # 拉取远程更新并合并
git push                    # 推送本地提交
git push -u origin main     # 首次推送，设置上游（之后直接 git push）
git fetch                   # 只下载远程更新，不合并（比 pull 更安全）
```

---

## 七、.gitignore 相关

```bash
# .gitignore 加了新规则但没生效？清缓存
git rm -r --cached .
git add .
git commit -m "chore: update gitignore"
```

---

## 八、关于 PR（Pull Request）

**个人开发不需要 PR。** PR 是团队协作工具：你在一个分支上做完功能，发起 PR 让队友 review（代码审查），讨论通过后再合并。

你一个人开发，直接 `git merge` 就行了，不用绕 PR 这一步。

---

## 九、速查索引

| 我要做什么 | 命令 |
|-----------|------|
| 看改了啥 | `git status` / `git diff` |
| 提交改动 | `git add .` → `git commit -m "说明"` |
| 推到 GitHub | `git push` |
| 拉最新代码 | `git pull` |
| 撤回未提交的改动 | `git restore file.js` |
| 撤回刚提交的 commit | `git reset --soft HEAD~1` |
| 开新功能分支 | `git switch -c feature/xxx` |
| 合并分支 | `git switch main` → `git merge feature/xxx` |
| 临时存改动 | `git stash` → `git stash pop` |
| 删除分支 | `git branch -d feature/xxx` |
| 查看历史 | `git log --oneline` |
| 回退到远程状态 | `git fetch origin` → `git reset --hard origin/main` |
