---
tags: [工具, Claude-Code, 操作]
created: 2026-07-09
status: 已完成
---

# Claude Code 操作手册（新手版）

## 这是什么

Claude Code 是 Anthropic 出的 AI 编程助手。你在 VS Code 里跟它对话，它能读文件、搜代码、写代码、执行命令——相当于一个能直接操作你电脑的 AI。

## 基本操作

| 操作 | 怎么做 |
|------|--------|
| 跟 Claude 说话 | 在对话框里打字，回车发送 |
| 让它读文件 | "帮我读一下这个文件" 或直接拖文件到对话框 |
| 让它搜代码 | "搜索项目中所有用到 auth 的地方" |
| 让它执行命令 | "帮我跑 npm install"（需要你手动点确认） |
| 清空对话 | 输入 `/clear` |
| 切换模型 | 输入 `/model` |
| 查看帮助 | 输入 `/help` |

## 常用命令

```
/help          — 查看所有命令
/clear         — 清空当前对话，重新开始
/compact       — 压缩对话历史（对话太长时用，防止超出上下文）
/skills        — 查看当前可用的所有 skill
/plugin        — 管理插件（安装/卸载/浏览市场）
/config        — 修改设置（主题、模型等）
/init          — 为当前项目生成 CLAUDE.md
```

## Skill（技能）怎么用

Skill 是别人写好的"专业指令包"。比如 `dataviz` 是画图表的，`commit-commands` 是管 Git 提交的。

```
# 查看所有已安装 skill
/skills

# 调用一个 skill
/dataviz              — 画图的
/commit-commands:commit  — 提交代码的
/feature-dev          — 开发新功能的

# 从 GitHub 安装新 skill
npx skills add 作者名/仓库名 -a claude-code -y
```

## Agent 是什么

Agent 是 Claude Code 里的"子专家"。你在跟 Claude 对话，但遇到特定任务时 Claude 会自动调用对应的 Agent。你不需要手动操作。

比如你说"帮我写测试用例"，Claude 会自动调用"测试大师"Agent 来分析。你说"帮我解释这个技术概念"，它会调用"BA导师"Agent 用 BA 语言解释。

当前活动的 Agent 可以在 Agent 仪表盘 `agent-dashboard.html` 查看。

## 提速技巧

1. **一个任务一个对话**：不要在一个长对话里跳来跳去。做新任务按 `/clear`
2. **直接给文件路径**：说"读 `src/app.js` 的第 50-80 行"比"帮我看看那个入口文件"快得多
3. **让 Claude 自己验证**：做完修改后说"帮我检查一下有没有报错"
4. **对话太长要紧凑**：超过 50 轮对话后，用 `/compact` 压缩

## 常见问题

**Q: Claude 执行命令时总让我手动确认，能自动吗？**
A: 能。在 `.claude/settings.json` 里配置权限白名单。但不建议新手全开——先保留手动确认，熟悉了再逐步放开。

**Q: 怎么让 Claude 更了解我的项目？**
A: 在项目根目录放一个 `CLAUDE.md`，写清楚你是谁、项目结构、命名规范。Claude 每次启动都会先读这个文件。

**Q: 提示 "context window exceeded" 怎么办？**
A: 按 `/compact`。这个命令会把历史对话压缩成摘要，腾出空间。

---

> 关联阅读：[[AI学习三层金字塔]] · [[01-什么是Prompt]]
