---
name: learning-log-system
description: 学习日志系统——四层架构（计划→过程→知识→上下文），Markdown + YAML frontmatter 格式
metadata:
  type: project
---

用户建立了完整的"学习日志"系统，由 BA导师设计，四层架构：

## 四层架构

| 层 | 位置 | 内容 | 更新频率 |
|---|------|------|---------|
| 计划层 | `roadmap.md` | 学什么、先学什么 | 阶段性 |
| 过程层 | `logs/` | 每次学习的过程记录 | 每次会话后 |
| 知识层 | `notes/` | 结构化知识体系 | 学透一个主题后 |
| 上下文层 | `CLAUDE.md` + `.claude/memory/` | AI 的固定上下文 | 有重要决策时 |

## 存储格式

- Markdown + YAML frontmatter
- 按年归档：`logs/2026/YYYY-MM-DD-topic-slug.md`
- 模板：`logs/template.md`

## 写日志方式

Claude 自动生成 70%（对话摘要、关键决策、遗留问题）+ 用户补充 30%（心情、理解总结、下次想聊）

## 检索方式

现阶段用 Claude Code 的 Grep 能力直接搜索，不建搜索引擎。

**Why:** 补足现有体系中缺失的"过程记录"层。notes/ 记"学会了什么"，logs/ 记"怎么学会的"。日志是一手数据源，notes 和 memory 从日志中提炼。

**How to apply:** 每次学习会话结束时说"/log"或"帮我生成今天的日志"，Claude 自动按模板生成。前 5 篇日志用来磨合模板格式，10 篇后迭代优化。
