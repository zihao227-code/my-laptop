# 教育培训平台 · 轻量架构 Plan

> 日期：2026-07-06 | 版本：v1.0
> 依赖：[Discovery 文档](edu-platform-discovery.md)
> 修改规则：后续有较大改动时，必须更新本文档

---

## 一、技术选型（由 Claude 决策，后续教基础知识）

| 层 | 选择 | 后续要学的基础知识 |
|----|------|------------------|
| 前端 | 单页 HTML + CSS + JS | HTML 标签结构、CSS 布局、JS 事件处理 |
| 数据 | JSON → localStorage | 什么是 JSON、数据的 CRUD |
| 路由 | Hash-based 页面切换 | 前端路由是什么、为什么需要它 |
| 模块通信 | 事件机制（EventBus） | 模块间怎么发消息 |

> **学习计划**：每个技术概念在用到时，BA导师 用 BA 能理解的方式讲解。

---

## 二、数据模型

### 实体关系图

```
User ──┬── Course ──┬── FundingAgreement
       │            │
       │            ├── Order ──── Payment
       │            │
       │            └── Session ─── Exam ─── Score
       │
       └── Notification
```

### course_id 全局契约

```
course_id 格式：C + 3位数字，例如 C001

所有模块必须遵守：
- 课程管理 → 生成 course_id
- Funding  → 通过 course_id 关联课程
- 订单     → 记录 course_id + user_id
- 支付     → 关联 order_id
- 上课     → 通过 course_id + user_id 获取权限
- 考试     → 关联 course_id
- 消息     → 通过 user_id 发送

原则：所有模块都知道 course_id，但只修改自己负责的字段。
```

### 核心表结构（详见 Discovery 文档第 4 节）

| 实体 | 主键 | 所属模块 | 关键字段 |
|------|------|---------|---------|
| User | user_id | 用户中心 | name, role, learner_info |
| Course | course_id | 课程管理 | title, price_original, funding_eligible, status |
| FundingAgreement | agreement_id | Funding | course_ids[], conditions, funding_amount |
| Order | order_id | 订单 | user_id, course_id, price_final, funding_applied |
| Payment | payment_id | 支付 | order_id, amount, status |
| Session | session_id | 上课 | course_id, date, attendance[] |
| Exam | exam_id | 考试 | course_id, questions[], pass_score |
| Score | score_id | 考试 | exam_id, user_id, score, source |
| Notification | notif_id | 消息 | user_id, type, content, read |

---

## 三、模块间数据契约

```
模块 A → 模块 B 的数据流向和格式约定

1. 课程管理 → Funding
   提供：course_id, price_original, course_type
   Funding 回写：course.funding_eligible = true

2. 课程管理 → 官网
   提供：course_id, title, schedule, price_original, funding_eligible, tags

3. Funding → 官网
   提供：course_id, funding_amount, conditions
   官网计算：Learner 是否满足条件 → 动态显示价格

4. 官网 → 订单
   提供：user_id, course_id, price_final, funding_applied

5. 订单 → 支付
   提供：order_id, amount
   支付回写：order.status = "paid"

6. 支付 → 上课系统
   校验：order.status = "paid" → 允许上课

7. 上课系统 → 考试
   提供：course_id, user_id → 判断是否有考试资格

8. 各模块 → 消息
   提供：user_id, type, content → 推送到 Notification
```

---

## 四、关键业务规则

| # | 规则 | 涉及模块 |
|---|------|---------|
| 1 | 课程发布 ≠ Funding 生效 —— 解耦 | 课程 + Funding |
| 2 | 有订单 + 已支付 → 才能上课 | 订单 + 支付 + 上课 |
| 3 | Learner 只能看到和自己相关的数据 | 全部 |
| 4 | Trainer 只能看到被分配的课程 | 课程 + 上课 |
| 5 | 线下数据录入标记 source="offline_entry" | 考试 + 出勤 |
| 6 | Funding 条件自动匹配，不匹配则原价购买 | Funding + 订单 |
| 7 | 价格计算：final_price = original_price - funding_amount（仅当条件满足） | 官网 + 订单 |

---

## 五、状态定义

### Course 状态
```
draft → published → in_progress → completed
  ↓         ↓
archived  cancelled
```

### Order 状态
```
pending → paid → completed
  ↓         ↓
cancelled  refunded
```

### FundingAgreement 状态
```
draft → active → expired
          ↓
       revoked
```

---

## 六、模块开发顺序

| 批次 | 优先级 | 模块 | 依赖 | 核心交付 |
|------|--------|------|------|---------|
| P0 | 基石 | 课程管理 | 用户中心 | Editor 创建/配置/发布课程 |
| P1 | 闭环 | 订单 & 支付 | 课程管理 | Learner 下单 → 支付 |
| P1 | 差异化 | Funding | 课程管理 | Editor 配置资助 + Learner 动态价格 |
| P2 | 体验 | 官网 | 课程+Funding+订单 | Learner 浏览/选课/下单 |
| P2 | 核心 | 上课系统 | 课程+订单+支付 | Trainer 备课 + Learner 上课+考试 |
| P3 | 辅助 | 消息系统 | 全部 | 支付成功/开课/成绩通知 |
| P3 | 补充 | 线下数据录入 | 上课系统 | 出勤率+考试成绩手动录入 |

---

## 七、修改日志

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-07-06 | v1.0 | 初始版本，基于 Discovery v1.0 |
