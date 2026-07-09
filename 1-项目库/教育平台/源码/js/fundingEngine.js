// ===== Funding 条件匹配引擎 v2 =====
const FundingEngine = {

  // 为某用户计算某课程的 Funding 信息
  calculate(userId, courseId) {
    const user = Store.find('users', 'user_id', userId);
    const course = Store.find('courses', 'course_id', courseId);
    if (!user || !course) return null;

    const now = Utils.now();
    const agreements = Store.activeFunding().filter(f =>
      f.course_ids.includes(courseId) &&
      f.valid_from <= now &&
      f.valid_to >= now
    );

    if (agreements.length === 0) return { eligible: false, reason: '当前没有生效的 Funding 协议' };

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

    // 计算补贴金额（区分固定 / 百分比）
    let fundingAmount = 0;
    if (agreement.funding_type === 'percentage') {
      const pct = agreement.funding_percent || 0;
      fundingAmount = Math.round(course.price_original * pct / 100);
    } else {
      fundingAmount = agreement.funding_amount || 0;
    }

    // 预算上限检查
    const remaining = this.getRemainingBudget(agreement.agreement_id);
    if (fundingAmount > remaining) {
      return { eligible: false, reason: `该协议剩余预算不足（剩余 ¥${remaining.toLocaleString()}，本次需 ¥${fundingAmount.toLocaleString()}）` };
    }

    const finalPrice = Math.max(0, course.price_original - fundingAmount);

    return {
      eligible: true,
      agreement_id: agreement.agreement_id,
      agreement_title: agreement.title,
      funding_type: agreement.funding_type,
      funding_amount: fundingAmount,
      price_original: course.price_original,
      price_final: finalPrice,
      conditions: conditions,
    };
  },

  // 计算某协议已消耗的金额（从已支付订单中汇总）
  getConsumedAmount(agreementId) {
    return Store.orders()
      .filter(o => o.funding_applied === agreementId && o.status === 'paid')
      .reduce((sum, o) => sum + (o.funding_amount || 0), 0);
  },

  // 计算某协议剩余可用预算
  getRemainingBudget(agreementId) {
    const agreement = Store.find('funding', 'agreement_id', agreementId);
    if (!agreement) return 0;
    const total = agreement.total_budget || 0;
    const consumed = this.getConsumedAmount(agreementId);
    return Math.max(0, total - consumed);
  },

  // 获取某课程所有生效的 Funding 信息
  getActiveFundingForCourse(courseId) {
    const now = Utils.now();
    return Store.activeFunding().filter(f =>
      f.course_ids.includes(courseId) &&
      f.valid_from <= now &&
      f.valid_to >= now
    );
  },

  // 检查课程排他性：同一课程在指定时间范围内是否已被其他 FA 绑定
  checkExclusivity(courseIds, validFrom, validTo, excludeAgreementId) {
    const conflicts = [];
    const allActive = Store.funding().filter(f => f.status === 'active' || f.status === 'draft');
    allActive.forEach(f => {
      if (excludeAgreementId && f.agreement_id === excludeAgreementId) return;
      // 检查时间重叠
      const fFrom = f.valid_from || '';
      const fTo = f.valid_to || '';
      if (validTo && fFrom && validTo < fFrom) return; // 完全不重叠
      if (validFrom && fTo && validFrom > fTo) return;  // 完全不重叠
      // 检查课程重叠
      const overlap = courseIds.filter(cid => (f.course_ids || []).includes(cid));
      if (overlap.length > 0) {
        conflicts.push({ agreement: f, overlapCourseIds: overlap });
      }
    });
    return conflicts;
  }
};
