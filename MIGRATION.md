# 📋 文件迁移索引

> 从 `start learning/` 项目迁移到知识库的文件映射表

---

## 迁移时间：2026-07-09

## 📊 迁移统计

| 目标库 | 文件数 | 主要内容 |
|--------|--------|----------|
| 1-项目库 | 22 | 教育平台项目（BA文档+源码） |
| 2-资产库 | 13 | Claude Agent配置、仪表盘HTML、脚本、模板 |
| 3-资源库 | 12 | AI学习笔记、Claude记忆、面试资料、外部链接 |
| 4-归档库 | 2 | 历史学习日志 |
| 6-技能库 | 6 | AI基础(3篇) + AI编程(3篇) |

---

## 🔄 详细映射

### → 1-项目库/教育平台/

| 原路径 | 新路径 |
|--------|--------|
| `practice/ba-tools/edu-platform-discovery.md` | `BA文档/edu-platform-discovery.md` |
| `practice/ba-tools/edu-platform-notes.md` | `BA文档/edu-platform-notes.md` |
| `practice/ba-tools/edu-platform-plan.md` | `BA文档/edu-platform-plan.md` |
| `practice/ba-tools/module-course-mgmt.md` | `BA文档/module-course-mgmt.md` |
| `practice/mini-projects/edu-platform/` | `源码/` (不含node_modules) |

### → 2-资产库/

| 原路径 | 新路径 |
|--------|--------|
| `.claude/agents/*.md` | `Claude-Agent配置/` (6个Agent) |
| `agent-dashboard.html` 等 | `仪表盘/` (5个HTML) |
| `scripts/sync-minutes.js` | `脚本/sync-minutes.js` |

### → 3-资源库/

| 原路径 | 新路径 |
|--------|--------|
| `.claude/memory/*.md` | `AI学习/Claude记忆/` (6篇记忆) |
| `SETUP.md` | `AI学习/SETUP.md` |
| `MEMORY.md` | `AI学习/MEMORY.md` |
| `roadmap.md` | `AI学习/roadmap.md` |
| `resources/useful-links.md` | `AI学习/useful-links.md` |
| *新创建* | `大厂AI产品经理面试全景.md` ⭐ |

### → 4-归档库/

| 原路径 | 新路径 |
|--------|--------|
| `logs/2026/2026-07-08-er-diagram*.md` | `学习日志/2026/` |
| `logs/template.md` | `学习日志/template.md` |

### → 6-技能库/

| 原路径 | 新路径 |
|--------|--------|
| `notes/ai-basics/01-what-is-llm.md` | `AI基础/01-what-is-llm.md` |
| `notes/ai-basics/02-ai-can-and-cannot.md` | `AI基础/02-ai-can-and-cannot.md` |
| `notes/ai-basics/03-rag-agent-mcp.md` | `AI基础/03-rag-agent-mcp.md` |
| `notes/ai-coding/02-flowchart-and-tech-basics.md` | `AI编程/02-flowchart-and-tech-basics.md` |
| `notes/ai-coding/03-engineering-quality.md` | `AI编程/03-engineering-quality.md` |
| `notes/ai-coding/04-er-diagram-and-dependency.md` | `AI编程/04-er-diagram-and-dependency.md` |

---

## ⚠️ 保留在原目录的内容

以下文件**未迁移**，保留在 `start learning/` 中继续作为 Claude Code 运行时配置：

- `CLAUDE.md` — Claude Code 项目配置
- `.claude/settings.json` / `settings.local.json` — 运行时设置
- `.claude/mcp.json` / `.mcp.json` — MCP 服务配置
- `.git/` — 原项目 Git 历史
- `.vscode/` — 编辑器配置
- `node_modules/` — 依赖包
- `inbox/` — 空目录
- `minutes/` — 会议记录

---

> 💡 **原则**：知识内容（笔记、文档、代码）→ 知识库；运行时配置（settings、mcp）→ 保留原处
