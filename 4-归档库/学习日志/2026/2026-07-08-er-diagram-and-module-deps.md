---
id: "2026-07-08-er-diagram-and-module-deps"
date: "2026-07-08"
session_start: "2026-07-08T11:00:00+08:00"
duration_minutes: 90
category: "ai-coding"
subcategory: "engineering-quality"
title: "ER 图、模块依赖分析、变更影响分析 —— AI 辅助开发的工程质量"
summary: |
  今天从三个问题切入，系统学习了 AI 辅助开发的工程质量保障：
  1. 上下文太长怎么办？—— /compact 机制、分层存储体系（notes/memory/CLAUDE.md/logs）
  2. 如何提炼历史沟通记录？—— 四层架构：计划层(roadmap) → 过程层(logs) → 知识层(notes) → 上下文层(memory)
  3. 如何确保新代码不影响旧功能？—— 回归测试 + 变更影响分析

  重点学会了：
  - ER 图的业务对象 vs 系统对象的区分
  - 教育平台 9 个数据实体及其 CRUD 矩阵
  - JS 模块四层依赖关系（基础层→业务层→页面层→入口层）
  - 动代码前的"三个问题"影响分析模板

tags: ["ER图", "模块依赖", "影响分析", "回归测试", "上下文管理", "工程质量"]
key_decisions:
  - decision: "创建 logs/ 学习日志系统，Markdown + YAML frontmatter 格式"
    reason: "BA导师设计——补足现有体系中缺失的'过程记录'层"
    confidence: "高"
  - decision: "日志由 Claude 自动生成 70% + 人工补充 30%"
    reason: "非程序员友好，降低写日志的门槛"
    confidence: "高"
  - decision: "Agent 体系精简——6个 Agent 实际活跃 3 个（BA导师/测试大师/技术执行者）"
    reason: "用户学习场景不需要多 Agent 编排，简单优于完整"
    confidence: "高"
problems_encountered:
  - problem: "改 store.js 会影响多少页面？怎么提前知道？"
    status: "已解决"
aha_moments:
  - "\"ER 图不只是开发的事——BA 用 CRUD 矩阵就能梳理数据关系\""
  - "\"日志≠笔记：笔记记学会什么，日志记怎么学会的\""
  - "\"改代码前先画依赖图——从被依赖最多的底层模块开始评估风险\""
related_notes:
  - "notes/ai-coding/03-engineering-quality.md"
related_logs: []
mood: "充实"
session_type: "对话学习"
---

## 学习过程详记

### 对话脉络
1. 用户提出三个关键问题：上下文管理、信息提炼与检索、回归测试
2. Claude 逐一解答后，用户追问了 ER 图和模块依赖关系
3. 实际分析了教育平台的 20 个 JS 文件的依赖关系
4. 梳理了 9 个数据实体的 CRUD 矩阵和各页面的读写关系
5. BA导师后台完成了学习日志系统的完整设计
6. 落地创建了 logs/ 目录、模板和第一篇日志

### 关键对话片段
> 我："ER 图需要记录哪些是业务对象，哪些是系统对象，建立中间的各种关系"
> Claude："业务对象=真实世界存在的东西（课程、用户）；系统对象=为了让系统运转而存在的东西（通知、日志）"

> 我："怎么确保更新的代码不会影响以前的东西？"
> Claude："回归测试——旧功能全部跑一遍。你的教育平台已经有 Playwright 自动化测试了，改完代码跑 node tests/run-tests.js"

> 我："动代码之前，是不是应该先判断更新内容是否会影响别的东西？"
> Claude："对，这叫变更影响分析（Impact Analysis）。问三个问题：谁依赖它？是加东西还是改行为？数据格式变了吗？"

### 我的理解总结
1. **ER 图**：画清楚数据实体和它们之间的关系（一对一/一对多/多对多）。区分业务对象和系统对象。
2. **模块依赖**：加载顺序就是依赖层——先加载的被后面所有人依赖。改底层的 store.js，所有页面都受影响。
3. **CRUD 矩阵**：一张表搞定"哪些页面在操作哪些数据"——谁读谁写谁改谁删，一目了然。
4. **变更影响分析**：动代码前看三层——谁依赖这个文件？谁在操作这个数据？跑一遍测试验证。
5. **学习日志 ≠ 知识笔记**：笔记是成品知识，日志是学习过程。两者互补。

### 下次想聊
- [ ] 鉴权（Authentication）的原理和实现
- [ ] 教育平台跑一次完整的 Playwright 测试
- [ ] 学习日志系统要不要接到 dashboard 做可视化？
