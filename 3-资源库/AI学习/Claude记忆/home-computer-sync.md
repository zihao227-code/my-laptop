---
name: home-computer-sync
description: Setup checklist for syncing learning environment from work to home computer via GitHub
metadata:
  type: reference
---

# 多电脑同步方案

## 原理
GitHub 作为中转站。公司写完 push → 家里 pull 继续，反之亦然。

## 家里电脑一次性搭建
1. 装 VS Code + Node.js(LTS) + Git
2. `git clone https://github.com/YOUR_USERNAME/start-learning.git`
3. VS Code 扩展: Live Server, Prettier, Markdown All in One, vscode-icons
4. `npm install -g @larksuite/cli`
5. 手动恢复加密文件（从公司电脑复制）:
   - `.mcp.json` — 飞书 MCP 配置（gitignored，含密钥）
   - `.claude/settings.json` — 权限白名单
6. 飞书认证: `lark-cli config init --new` → OAuth 登录

## 日常同步流程
- 写完就 push，打开就 pull
- 不要两边同时改同一个文件
- 能同步: 代码/笔记/Agent配置/CLAUDE.md/memory
- 不能同步: 对话历史、lark-cli登录态、VS Code个人设置、npm全局包

**Why:** 用户家里有电脑，想要下班后继续学习，需要保持两边的项目文件同步。GitHub 是最可靠的方案——所有学习内容都在 repo 里。
**How to apply:** 每次学习结束前，提醒用户 git push；每次新会话开始，检查 git status 是否有未提交的变更。
