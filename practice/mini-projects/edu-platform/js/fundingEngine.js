// ===== Funding 条件匹配引擎 =====
const FundingEngine = {

  // 为某用户计算某课程的 Funding 信息
  calculate(userId, courseId) {
    const user = Store.find('users', 'user_id', userId);
    const course = Store.find('courses', 'course_id', courseId);
    if (!user || !course) return null;
    // 查找该课程绑定的、状态为 active 且在有效期内的 Funding 协议
    // 注意：不再依赖 course.funding_eligible 标记（冗余状态），直接查协议表
    const now = Utils.now();
    const agreements = Store.activeFunding().filter(f =>
      f.course_ids.includes(courseId) &&
      f.valid_from <= now &&
      f.valid_to >= now
    );

    if (agreements.length === 0) return { eligible: false, reason: '当前没有生效的 Funding 协议' };

    // 取第一个匹配的协议（可扩展：取补贴金额最高的）
    const agreement = agreements[0];

    // 条件匹配
    const conditions = agreement.conditions || {};
    if (conditions.eligible_roles && conditions.eligible_roles.length > 0) {
      if (!conditions.eligible_roles.includes(user.role)) return { eligible: false, reason: '您的角色不符合 Funding 条件' };
    }
    if (conditions.min_work_years && user.work_years) {
      if (user.work_years < conditions.min_work_years) return { eligible: false, reason: '工作年限不足' };
    }
    if (conditions.eligible_companies && conditions.eligible_companies.length > 0) {
      const company = (user.learner_info || {}).company;
      if (!company || !conditions.eligible_companies.includes(company)) return { eligible: false, reason: '您所在公司不在资助范围内' };
    }

    const finalPrice = Math.max(0, course.price_original - agreement.funding_amount);

    return {
      eligible: true,
      agreement_id: agreement.agreement_id,
      agreement_title: agreement.title,
      funding_amount: agreement.funding_amount,
      price_original: course.price_original,
      price_final: finalPrice,
      conditions: conditions,
    };
  },

  // 获取某课程所有生效的 Funding 信息（供课程详情页展示）
  getActiveFundingForCourse(courseId) {
    const now = Utils.now();
    return Store.activeFunding().filter(f =>
      f.course_ids.includes(courseId) &&
      f.valid_from <= now &&
      f.valid_to >= now
    );
  }
};
