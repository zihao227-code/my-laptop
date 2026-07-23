---
tags: [技能, AI工具, Claude-Code, Skill, 提效]
source: 抖音
created: 2026-07-22
level: 熟悉
---

# 高频 Claude Code Skills 推荐

## 📌 一句话总结

黄仁勋要求全员用 Codex。搭配 Skills 后，AI 从"你说一句它立刻动手"变成"先理解→规划→验证→再执行"。

---

## 🔧 三个高频 Skills

### 1. Superpowers（GitHub 20万星）

**解决什么问题**：大模型总是还没理解清楚需求就急着动手。

| 模式 | 流程 | 问题 |
|------|------|------|
| 普通 | 你说 → 它立刻做 | 方向经常偏，浪费 Token |
| Superpowers | 你说 → 理解任务 → 规划 → 验证 → 动手 | 方向对，一次到位 |

### 2. AnySearch

**解决什么问题**：通用搜索引擎覆盖不到垂直领域（金融、法律、学术）。

- 聚合垂直数据源，统一 API 输出
- 返回结构化 Markdown 格式
- 支持通用搜索 + 垂直领域搜索（学术/金融/法律等）
- 可搜索 PubMed 等专业数据库

### 3. SkillCharacter

**解决什么问题**：每次做重复的事都要重新讲一遍流程和提示词。

- 把重复流程自动打包成可复用的 Skill
- 后面直接调用，不用每次重复说明
- 例如：每次读文献都要讲"先摘要→再分析→再对比" → 做成一个 Skill 一键调用

---

## 📦 安装方式（以 AnySearch 为例）

```bash
# 1. 在 GitHub 找到 skill 链接
# 2. 在 Claude Code 中安装
# 3. 重启 Claude Code
# 4. 配置 API Key
cp .env.example .env
# 编辑 .env 填入 API Key
# 5. 使用 doc 命令查看支持的参数
```

---

## 🔗 关联笔记

- [[Spec-Driven-Development非程序员AI产品开发全流程]] — CLAUDE.md 是灵魂文件，Skills 是灵魂文件的执行器
- [[企业级AI开发四大核心能力]] — 工具调用能力
