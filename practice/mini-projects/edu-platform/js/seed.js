// ===== 种子数据 =====
// 仅在 localStorage 为空时初始化

const Seed = {
  init() {
    if (localStorage.getItem('edu_users')) return; // 已初始化

    // 用户
    const users = [
      { user_id: 'U001', name: '张管理', email: 'admin@edu.cn', password: '123456', role: 'Admin', created_at: '2026-01-01' },
      { user_id: 'U002', name: '王编辑', email: 'editor@edu.cn', password: '123456', role: 'Editor', created_at: '2026-01-15' },
      { user_id: 'U003', name: '李老师', email: 'trainer@edu.cn', password: '123456', role: 'Trainer', subjects: ['Python', '数据分析'], created_at: '2026-02-01' },
      { user_id: 'U004', name: '赵老师', email: 'trainer2@edu.cn', password: '123456', role: 'Trainer', subjects: ['AI', '机器学习'], created_at: '2026-02-15' },
      { user_id: 'U005', name: '陈同学', email: 'learner@edu.cn', password: '123456', role: 'Learner', learner_info: { company: '某科技公司', position: 'BA' }, created_at: '2026-04-01' },
      { user_id: 'U006', name: '刘同学', email: 'learner2@edu.cn', password: '123456', role: 'Learner', learner_info: { company: '某互联网公司', position: '产品经理' }, created_at: '2026-04-15' },
      { user_id: 'U007', name: '张同学', email: 'learner3@edu.cn', password: '123456', role: 'Learner', learner_info: { company: '创业公司', position: '全栈开发' }, created_at: '2026-05-01' },
    ];

    // 课程
    const courses = [
      { course_id: 'C001', title: 'Python 数据分析实战', description: '从零基础到能独立完成数据分析项目，覆盖 Pandas、NumPy、Matplotlib 等核心库。', type: 'online', tags: ['Python', '数据', '初级'], trainer_ids: ['U003'],
        schedule: [{ date: '2026-07-15', time: '09:00-12:00' }, { date: '2026-07-16', time: '09:00-12:00' }, { date: '2026-07-17', time: '09:00-12:00' }],
        price_original: 3000, funding_eligible: true, exam_config: { method: 'online', pass_score: 60 }, status: 'published', version: 1, created_at: '2026-07-01', updated_at: '2026-07-01' },
      { course_id: 'C002', title: 'Java 后端开发训练营', description: 'Spring Boot + MyBatis 全栈实战，从零搭建企业级后端服务。', type: 'offline', tags: ['Java', '后端', '中级'], trainer_ids: ['U003'],
        schedule: [{ date: '2026-08-01', time: '14:00-17:00' }, { date: '2026-08-08', time: '14:00-17:00' }],
        price_original: 5000, funding_eligible: true, exam_config: { method: 'offline', pass_score: 70 }, status: 'published', version: 1, created_at: '2026-07-03', updated_at: '2026-07-03' },
      { course_id: 'C003', title: 'AI 产品经理入门', description: '从需求分析到产品上线，AI PM 全流程实战指南。学习如何定义 AI 产品、评估技术可行性、管理 ML 项目。', type: 'hybrid', tags: ['AI', '产品', '初级'], trainer_ids: ['U004'],
        schedule: [{ date: '2026-07-20', time: '10:00-12:00' }, { date: '2026-07-21', time: '10:00-12:00' }, { date: '2026-07-22', time: '10:00-12:00' }],
        price_original: 4500, funding_eligible: true, exam_config: { method: 'online', pass_score: 60 }, status: 'published', version: 1, created_at: '2026-06-28', updated_at: '2026-06-28' },
      { course_id: 'C004', title: '前端开发实战课', description: 'HTML + CSS + JavaScript 全套教程，从静态页面到 SPA 应用。', type: 'online', tags: ['前端', 'JS', '初级'], trainer_ids: ['U003', 'U004'],
        schedule: [{ date: '2026-09-01', time: '19:00-21:00' }, { date: '2026-09-03', time: '19:00-21:00' }, { date: '2026-09-05', time: '19:00-21:00' }],
        price_original: 2800, funding_eligible: false, exam_config: { method: 'online', pass_score: 60 }, status: 'published', version: 1, created_at: '2026-07-05', updated_at: '2026-07-05' },
      { course_id: 'C005', title: 'UI/UX 设计思维', description: '从用户研究到高保真原型，Figma 实战 + 设计方法论。', type: 'hybrid', tags: ['设计', 'Figma', '中级'], trainer_ids: ['U004'],
        schedule: [{ date: '2026-08-15', time: '14:00-17:00' }],
        price_original: 3800, funding_eligible: true, exam_config: { method: 'offline', pass_score: 60 }, status: 'published', version: 1, created_at: '2026-07-04', updated_at: '2026-07-04' },
      { course_id: 'C006', title: '机器学习基础', description: '深入理解 ML 核心算法，从线性回归到神经网络。', type: 'online', tags: ['AI', 'ML', '高级'], trainer_ids: ['U004'],
        schedule: [{ date: '2026-10-01', time: '09:00-12:00' }],
        price_original: 6800, funding_eligible: false, exam_config: { method: 'online', pass_score: 70 }, status: 'in_progress', version: 1, created_at: '2026-07-02', updated_at: '2026-07-02' },
    ];

    // Funding 协议
    const fundingAgreements = [
      { agreement_id: 'F001', title: '2026年第三季度技能提升补贴', course_ids: ['C001', 'C003', 'C005'],
        conditions: { min_work_years: 0, eligible_roles: ['Learner'] },
        funding_type: 'fixed', funding_amount: 2500, total_budget: 50000,
        valid_from: '2026-07-01', valid_to: '2026-09-30', status: 'active', created_at: '2026-07-01', created_by: 'U002' },
      { agreement_id: 'F002', title: '企业合作 Java 人才培养计划', course_ids: ['C002'],
        conditions: { min_work_years: 1, eligible_roles: ['Learner'], eligible_companies: ['某科技公司'] },
        funding_type: 'fixed', funding_amount: 3500, total_budget: 35000,
        valid_from: '2026-08-01', valid_to: '2026-12-31', status: 'active', created_at: '2026-07-02', created_by: 'U002' },
    ];

    // 订单
    const orders = [
      { order_id: 'O001', user_id: 'U005', course_id: 'C001', price_original: 3000, funding_applied: 'F001', funding_amount: 2500, price_final: 500, status: 'paid', created_at: '2026-07-02' },
      { order_id: 'O002', user_id: 'U006', course_id: 'C001', price_original: 3000, funding_applied: 'F001', funding_amount: 2500, price_final: 500, status: 'pending', created_at: '2026-07-05' },
      { order_id: 'O003', user_id: 'U005', course_id: 'C003', price_original: 4500, funding_applied: 'F001', funding_amount: 2500, price_final: 2000, status: 'paid', created_at: '2026-07-03' },
    ];

    // 支付记录
    const payments = [
      { payment_id: 'P001', order_id: 'O001', amount: 500, method: 'wechat', status: 'completed', paid_at: '2026-07-02' },
      { payment_id: 'P002', order_id: 'O003', amount: 2000, method: 'alipay', status: 'completed', paid_at: '2026-07-03' },
    ];

    // 上课记录 (Sessions)
    const sessions = [
      { session_id: 'S001', course_id: 'C001', date: '2026-07-15', topic: 'Python 基础语法与环境搭建', trainer_id: 'U003', attendance: ['U005'] },
    ];

    // 考试
    const exams = [
      { exam_id: 'E001', course_id: 'C001', title: 'Python 数据分析 - 期末测验', duration_minutes: 30, pass_score: 60,
        questions: [
          { id: 'q1', type: 'single', title: '以下哪个是 Python 的数据分析核心库？', options: ['NumPy', 'Spring', 'React', 'Vue'], answer: 0, score: 20 },
          { id: 'q2', type: 'single', title: 'Pandas 中读取 CSV 文件使用哪个函数？', options: ['pd.read_csv()', 'pd.load()', 'pd.open()', 'pd.import()'], answer: 0, score: 20 },
          { id: 'q3', type: 'multiple', title: '以下哪些是 Python 的数据可视化库？（多选）', options: ['Matplotlib', 'Seaborn', 'jQuery', 'Bootstrap'], answer: [0, 1], score: 20 },
          { id: 'q4', type: 'multiple', title: '以下哪些属于机器学习类型？（多选）', options: ['监督学习', '无监督学习', '强化学习', '静态学习'], answer: [0, 1, 2], score: 20 },
          { id: 'q5', type: 'boolean', title: 'Python 是编译型语言。', options: ['正确', '错误'], answer: 1, score: 10 },
          { id: 'q6', type: 'boolean', title: 'DataFrame 是 Pandas 的核心数据结构。', options: ['正确', '错误'], answer: 0, score: 10 },
        ]
      },
      { exam_id: 'E002', course_id: 'C003', title: 'AI PM - 基础概念测验', duration_minutes: 20, pass_score: 60,
        questions: [
          { id: 'q1', type: 'single', title: 'LLM 的全称是什么？', options: ['Large Language Model', 'Long List Manager', 'Low Latency Module', 'Logic Layer Machine'], answer: 0, score: 25 },
          { id: 'q2', type: 'boolean', title: 'AI 不会产生幻觉（编造事实）。', options: ['正确', '错误'], answer: 1, score: 25 },
          { id: 'q3', type: 'single', title: 'RAG 的主要目的是什么？', options: ['让 AI 先查资料再回答', '让 AI 更快运行', '让 AI 支持多语言', '让 AI 生成图片'], answer: 0, score: 25 },
          { id: 'q4', type: 'multiple', title: '以下哪些是 AI 产品的独特风险？（多选）', options: ['幻觉', '延迟', '数据隐私', '字体版权'], answer: [0, 1, 2], score: 25 },
        ]
      },
    ];

    // 考试成绩
    const scores = [];

    // 通知
    const notifications = [
      { notif_id: 'N001', user_id: 'U005', type: 'payment', title: '支付成功', content: '课程「Python 数据分析实战」支付成功，欢迎学习！', read: false, created_at: '2026-07-02T10:30:00' },
      { notif_id: 'N002', user_id: 'U005', type: 'course', title: '上课提醒', content: '课程「Python 数据分析实战」将于 7月15日 09:00 开课。', read: false, created_at: '2026-07-10T09:00:00' },
      { notif_id: 'N003', user_id: 'U005', type: 'system', title: '新课程上线', content: '「前端开发实战课」已上线，限时原价。', read: true, created_at: '2026-07-05T14:00:00' },
      { notif_id: 'N004', user_id: 'U003', type: 'course', title: '课程提醒', content: '您负责的「Python 数据分析实战」即将于 7月15日开课。', read: false, created_at: '2026-07-10T09:00:00' },
    ];

    // 写入 localStorage
    localStorage.setItem('edu_users', JSON.stringify(users));
    localStorage.setItem('edu_courses', JSON.stringify(courses));
    localStorage.setItem('edu_funding', JSON.stringify(fundingAgreements));
    localStorage.setItem('edu_orders', JSON.stringify(orders));
    localStorage.setItem('edu_payments', JSON.stringify(payments));
    localStorage.setItem('edu_sessions', JSON.stringify(sessions));
    localStorage.setItem('edu_exams', JSON.stringify(exams));
    localStorage.setItem('edu_scores', JSON.stringify(scores));
    localStorage.setItem('edu_notifications', JSON.stringify(notifications));
    localStorage.setItem('edu_counters', JSON.stringify({ users: 7, courses: 6, funding: 2, orders: 3, payments: 2, sessions: 1, exams: 2, scores: 0, notifications: 4 }));
  }
};
