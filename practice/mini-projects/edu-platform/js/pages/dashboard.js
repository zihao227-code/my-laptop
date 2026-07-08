// ===== 工作台（Dashboard v2 — 信号层 + 决策起点） =====
Pages.Dashboard = {

  render() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!el || !user) return;

    const role = user.role;
    if (role === 'Admin') this._renderAdmin(el, user);
    else if (role === 'Editor') this._renderEditor(el, user);
    else if (role === 'Trainer') this._renderTrainer(el, user);
    else if (role === 'Learner') this._renderLearner(el, user);
  },

  // ===== 数据助手 =====

  _today() { return Utils.now(); },

  _daysFromNow(dateStr, days) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date(this._today());
    return d >= now && d <= new Date(now.getTime() + days * 86400000);
  },

  _pendingOrders() {
    return Store.orders().filter(o => o.status === 'pending');
  },

  _draftCourses() {
    return Store.courses().filter(c => c.status === 'draft');
  },

  _expiringFunding(days = 30) {
    const now = this._today();
    return Store.funding().filter(f => {
      if (f.status !== 'active') return false;
      return f.valid_to >= now && f.valid_to <= this._daysFromNow(now, days); // simplified
    });
  },

  _upcomingSessions(userId, trainerId) {
    const now = this._today();
    if (trainerId) {
      return Store.sessions().filter(s => s.trainer_id === trainerId && s.date >= now).sort((a,b) => a.date.localeCompare(b.date));
    }
    return Store.sessions().filter(s => s.date >= now).sort((a,b) => a.date.localeCompare(b.date));
  },

  _learnerProgress(userId) {
    const paidOrders = Store.paidOrders(userId);
    const scores = Store.scores().filter(s => s.user_id === userId);
    return paidOrders.map(order => {
      const course = Store.find('courses', 'course_id', order.course_id);
      if (!course) return null;
      const score = scores.find(s => s.course_id === order.course_id || s.exam_id && Store.find('exams','exam_id',s.exam_id)?.course_id === order.course_id);
      const sessions = Store.sessions().filter(s => s.course_id === order.course_id && (s.attendance || []).includes(userId));
      const exam = Store.exams().find(e => e.course_id === order.course_id);

      let stage, stageLabel, stageIcon;
      if (score && score.passed) { stage = 3; stageLabel = '已通过'; stageIcon = '🏆'; }
      else if (score && !score.passed) { stage = 3; stageLabel = `未通过 (${score.total_score}分)`; stageIcon = '📝'; }
      else if (exam && !score) { stage = 2; stageLabel = '待考试'; stageIcon = '⏳'; }
      else if (sessions.length > 0) { stage = 1; stageLabel = `已上${sessions.length}节课`; stageIcon = '📖'; }
      else { stage = 0; stageLabel = '待开课'; stageIcon = '📅'; }

      return { course, score, stage, stageLabel, stageIcon, sessions, orderDate: order.created_at };
    }).filter(Boolean);
  },

  _recommendCourses(userId) {
    const user = Store.find('users', 'user_id', userId);
    const paid = Store.paidOrders(userId).map(o => o.course_id);
    // 收集已购课程的所有标签
    const myTags = new Set();
    paid.forEach(cid => {
      const c = Store.find('courses', 'course_id', cid);
      if (c) (c.tags || []).forEach(t => myTags.add(t));
    });
    // 找未购课程，按标签匹配数排序
    return Store.publishedCourses()
      .filter(c => !paid.includes(c.course_id))
      .map(c => {
        const match = (c.tags || []).filter(t => myTags.has(t)).length;
        return { course: c, match };
      })
      .filter(r => r.match > 0)
      .sort((a, b) => b.match - a.match)
      .slice(0, 3);
  },

  _courseLearnerCount(courseId) {
    return Store.orders().filter(o => o.course_id === courseId && o.status === 'paid').length;
  },

  // ===== Admin 工作台 =====
  _renderAdmin(el, user) {
    const pendingOrders = this._pendingOrders();
    const draftCourses = this._draftCourses();
    const expiringFunding = Store.funding().filter(f => f.status === 'active' && f.valid_to <= '2026-10-01');
    const totalRevenue = Store.orders().filter(o => o.status === 'paid').reduce((s, o) => s + o.price_final, 0);
    const totalUsers = Store.users().length;
    const newUsersThisMonth = Store.users().filter(u => u.created_at >= '2026-07-01').length;
    const paidRatio = Store.orders().length > 0
      ? Math.round(Store.orders().filter(o => o.status === 'paid').length / Store.orders().length * 100) : 0;
    const hottest = [...Store.courses()]
      .map(c => ({ ...c, learners: this._courseLearnerCount(c.course_id) }))
      .sort((a, b) => b.learners - a.learners)[0];

    el.innerHTML = `
      <h2 style="margin-bottom:20px">🏠 ${user.name} 的工作台</h2>
      <div class="grid-3" style="margin-bottom:20px">
        <div class="stat-card" style="border-left:3px solid var(--red)">
          <div class="stat-num" style="font-size:24px">${pendingOrders.length}</div>
          <div class="stat-label">⚠ 待支付订单</div>
          ${pendingOrders.length > 0 ? `<div style="font-size:11px;color:var(--muted);margin-top:4px">${pendingOrders.map(o => o.order_id).join(', ')}</div>` : ''}
        </div>
        <div class="stat-card" style="border-left:3px solid var(--orange)">
          <div class="stat-num" style="font-size:24px">${draftCourses.length}</div>
          <div class="stat-label">📝 草稿待发布</div>
        </div>
        <div class="stat-card" style="border-left:3px solid var(--warning)">
          <div class="stat-num" style="font-size:24px">${expiringFunding.length}</div>
          <div class="stat-label">⏰ Funding 近期到期</div>
        </div>
      </div>
      <div class="grid-4" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-num">¥${totalRevenue.toLocaleString()}</div><div class="stat-label">💰 总收入</div></div>
        <div class="stat-card"><div class="stat-num">${totalUsers}</div><div class="stat-label">👥 总用户 · 本月+${newUsersThisMonth}</div></div>
        <div class="stat-card"><div class="stat-num">${paidRatio}%</div><div class="stat-label">📈 支付转化率</div></div>
        ${hottest ? `<div class="stat-card"><div class="stat-num">${hottest.learners}人</div><div class="stat-label">🔥 ${Utils.escape(hottest.title)}</div></div>` : ''}
      </div>
      <div style="display:flex;gap:12px">
        <button class="btn btn-primary" onclick="Router.go('orders')">📋 处理订单</button>
        <button class="btn btn-outline" onclick="Router.go('courses')">📚 课程管理</button>
        <button class="btn btn-outline" onclick="Router.go('admin')">⚙️ 用户管理</button>
      </div>`;
  },

  // ===== Editor 工作台 =====
  _renderEditor(el, user) {
    const drafts = this._draftCourses();
    const expiringF = Store.funding().filter(f => f.status === 'active' && f.valid_to <= '2026-10-01');
    const coursesWithoutExam = Store.courses().filter(c => !Store.exams().find(e => e.course_id === c.course_id));
    const byStatus = {};
    Store.courses().forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
    const totalFunding = Store.activeFunding().reduce((s, f) => s + f.funding_amount, 0);
    const recent = [...Store.courses()].sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0];

    el.innerHTML = `
      <h2 style="margin-bottom:20px">🏠 ${user.name} 的工作台</h2>
      <div class="grid-3" style="margin-bottom:20px">
        <div class="stat-card" style="border-left:3px solid ${drafts.length > 0 ? 'var(--orange)' : 'var(--green)'}">
          <div class="stat-num" style="font-size:24px">${drafts.length}</div>
          <div class="stat-label">📝 草稿待发布</div>
          ${drafts.length > 0 ? `<div style="font-size:11px;color:var(--muted);margin-top:4px">${drafts.map(c => c.course_id).join(', ')}</div>` : '<div style="font-size:11px;color:var(--green);margin-top:4px">全部已发布 ✅</div>'}
        </div>
        <div class="stat-card" style="border-left:3px solid ${expiringF.length > 0 ? 'var(--warning)' : 'var(--green)'}">
          <div class="stat-num" style="font-size:24px">${expiringF.length}</div>
          <div class="stat-label">⏰ Funding 即将到期</div>
        </div>
        <div class="stat-card" style="border-left:3px solid ${coursesWithoutExam.length > 0 ? 'var(--red)' : 'var(--green)'}">
          <div class="stat-num" style="font-size:24px">${coursesWithoutExam.length}</div>
          <div class="stat-label">📋 缺考试配置</div>
        </div>
      </div>
      <div class="grid-4" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-num">${byStatus['published'] || 0}</div><div class="stat-label">📗 已发布</div></div>
        <div class="stat-card"><div class="stat-num">${byStatus['in_progress'] || 0}</div><div class="stat-label">📘 进行中</div></div>
        <div class="stat-card"><div class="stat-num">${byStatus['completed'] || 0}</div><div class="stat-label">📕 已完成</div></div>
        <div class="stat-card"><div class="stat-num">¥${totalFunding.toLocaleString()}</div><div class="stat-label">💰 补贴总预算</div></div>
      </div>
      ${recent ? `<div style="font-size:12px;color:var(--muted);margin-bottom:16px">📅 最近更新：${Utils.escape(recent.title)} (${Utils.formatDate(recent.updated_at)})</div>` : ''}
      <div style="display:flex;gap:12px">
        ${drafts.length > 0 ? `<button class="btn btn-primary" onclick="Router.go('courses')">📝 发布草稿 (${drafts.length})</button>` : ''}
        <button class="btn btn-outline" onclick="Router.go('courses')">📚 课程管理</button>
        <button class="btn btn-outline" onclick="Router.go('funding')">💰 Funding 配置</button>
      </div>`;
  },

  // ===== Trainer 工作台 =====
  _renderTrainer(el, user) {
    const myCourses = Store.trainerCourses(user.user_id);
    const today = this._today();
    const upcoming = this._upcomingSessions(null, user.user_id);
    const todaySessions = upcoming.filter(s => s.date === today);
    const tomorrowSessions = upcoming.filter(s => {
      const t = new Date(today);
      t.setDate(t.getDate() + 1);
      return s.date === t.toISOString().split('T')[0];
    });
    // 我的学员数
    const myCourseIds = myCourses.map(c => c.course_id);
    const myLearners = new Set(Store.orders().filter(o => myCourseIds.includes(o.course_id) && o.status === 'paid').map(o => o.user_id));
    // 学员考试通过率
    const myScores = Store.scores().filter(s => myCourseIds.includes(s.course_id) || Store.exams().find(e => e.exam_id === s.exam_id && myCourseIds.includes(e.course_id)));
    const passRate = myScores.length > 0 ? Math.round(myScores.filter(s => s.passed).length / myScores.length * 100) : '—';
    const unread = Store.notifications().filter(n => n.user_id === user.user_id && !n.read).length;

    el.innerHTML = `
      <h2 style="margin-bottom:20px">🏠 ${user.name} 的工作台</h2>
      <div class="grid-3" style="margin-bottom:20px">
        <div class="stat-card" style="border-left:3px solid var(--blue)">
          <div class="stat-num" style="font-size:24px">${todaySessions.length}</div>
          <div class="stat-label">📅 今日课程</div>
          ${todaySessions.map(s => {
            const c = Store.find('courses','course_id',s.course_id);
            return `<div style="font-size:11px;color:var(--muted);margin-top:2px">${c ? Utils.escape(c.title) : ''} ${s.topic||''}</div>`;
          }).join('')}
        </div>
        <div class="stat-card" style="border-left:3px solid var(--purple)">
          <div class="stat-num" style="font-size:24px">${tomorrowSessions.length}</div>
          <div class="stat-label">📅 明日课程</div>
        </div>
        <div class="stat-card" style="border-left:3px solid var(--green)">
          <div class="stat-num" style="font-size:24px">${myLearners.size}</div>
          <div class="stat-label">👥 我的学员</div>
        </div>
      </div>
      <div class="grid-4" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-num">${myCourses.length}</div><div class="stat-label">📚 负责课程</div></div>
        <div class="stat-card"><div class="stat-num">${passRate}${passRate === '—' ? '' : '%'}</div><div class="stat-label">📊 学员通过率</div></div>
        <div class="stat-card"><div class="stat-num">${upcoming.length}</div><div class="stat-label">📋 待上课次</div></div>
        <div class="stat-card"><div class="stat-num">${unread}</div><div class="stat-label">🔔 未读消息</div></div>
      </div>
      <div style="display:flex;gap:12px">
        ${todaySessions.length > 0 ? `<button class="btn btn-primary" onclick="Router.go('sessions')">📝 进入备课</button>` : ''}
        <button class="btn btn-outline" onclick="Router.go('myCourses')">📖 我的课程</button>
        <button class="btn btn-outline" onclick="Router.go('messages')">🔔 消息 (${unread})</button>
      </div>`;
  },

  // ===== Learner 工作台 — 学习进度中心 =====
  _renderLearner(el, user) {
    const progress = this._learnerProgress(user.user_id);
    const recommendations = this._recommendCourses(user.user_id);
    const paidOrders = Store.paidOrders(user.user_id);
    const myScores = Store.scores().filter(s => s.user_id === user.user_id);
    const passRate = myScores.length > 0 ? Math.round(myScores.filter(s => s.passed).length / myScores.length * 100) : '—';
    const avgScore = myScores.length > 0 ? Math.round(myScores.reduce((s, r) => s + r.total_score, 0) / myScores.length) : '—';
    const totalFunding = paidOrders.reduce((s, o) => s + (o.funding_amount || 0), 0);
    const unread = Store.notifications().filter(n => n.user_id === user.user_id && !n.read).length;

    // 进度卡片
    const progressHTML = progress.length === 0
      ? `<div class="empty-state" style="padding:24px"><div class="icon">📭</div><p>还没有购买课程</p><button class="btn btn-primary btn-sm" onclick="Router.go('home')" style="margin-top:8px">去选课</button></div>`
      : progress.map(p => {
        const barPct = Math.round(p.stage / 3 * 100);
        return `
        <div class="card" style="margin-bottom:10px;padding:14px 18px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-size:20px">${p.stageIcon}</span>
                <strong>${Utils.escape(p.course.title)}</strong>
                <span style="font-size:11px;padding:2px 8px;border-radius:8px;background:${p.stage === 3 && p.score?.passed ? '#1a3c2a' : p.stage === 2 ? '#3d2e0f' : '#1a3a5c'};color:${p.stage === 3 && p.score?.passed ? 'var(--green)' : p.stage === 2 ? 'var(--orange)' : 'var(--blue)'}">${p.stageLabel}</span>
              </div>
              <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${barPct}%;background:${barPct === 100 ? 'var(--green)' : barPct >= 66 ? 'var(--blue)' : 'var(--orange)'};border-radius:2px;transition:width .5s"></div>
              </div>
              <div style="font-size:11px;color:var(--muted);margin-top:4px">
                ${p.stage === 0 ? `开课日期：${p.course.schedule[0]?.date || '待定'}` : ''}
                ${p.stage === 1 ? `已上课 ${p.sessions.length}/${p.course.schedule.length} 节` : ''}
                ${p.stage === 2 ? '点击参加考试 →' : ''}
                ${p.stage === 3 ? (p.score?.passed ? `得分 ${p.score.total_score}/${p.score.max_score} · 通过 ✅` : `得分 ${p.score.total_score}/${p.score.max_score} · 可重考`) : ''}
              </div>
            </div>
            <div style="margin-left:12px">
              ${p.stage === 2 ? `<button class="btn btn-primary btn-sm" onclick="Router.go('exam',{examId:'${Store.exams().find(e=>e.course_id===p.course.course_id)?.exam_id||''}',courseId:'${p.course.course_id}')">📝 考试</button>` : ''}
              ${p.stage === 3 && p.score && !p.score.passed ? `<button class="btn btn-warning btn-sm" onclick="Router.go('exam',{examId:'${p.score.exam_id}',courseId:'${p.course.course_id}')">🔄 重考</button>` : ''}
            </div>
          </div>
        </div>`;
      }).join('');

    // 推荐卡片
    const recHTML = recommendations.length === 0
      ? '<p style="font-size:13px;color:var(--muted)">完成更多课程后，系统会根据你的兴趣标签为你推荐新课。</p>'
      : recommendations.map(r => `
        <div class="card" style="margin-bottom:8px;padding:12px 16px;cursor:pointer" onclick="Router.go('home',{courseId:'${r.course.course_id}'})">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <strong>💡 ${Utils.escape(r.course.title)}</strong>
              <span style="font-size:11px;color:var(--muted);margin-left:8px">标签匹配 ${r.match} 项</span>
            </div>
            <span style="font-weight:700;color:var(--red)">${Utils.formatPrice(r.course.price_original)}</span>
          </div>
        </div>`).join('');

    el.innerHTML = `
      <h2 style="margin-bottom:20px">🏠 ${user.name} 的学习中心</h2>

      <div class="grid-4" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-num">${paidOrders.length}</div><div class="stat-label">📚 已购课程</div></div>
        <div class="stat-card"><div class="stat-num">${passRate === '—' ? '—' : passRate + '%'}</div><div class="stat-label">📊 考试通过率</div></div>
        <div class="stat-card"><div class="stat-num">${avgScore === '—' ? '—' : avgScore + '分'}</div><div class="stat-label">📝 平均分</div></div>
        <div class="stat-card"><div class="stat-num">¥${totalFunding.toLocaleString()}</div><div class="stat-label">💰 累计补贴</div></div>
      </div>

      <div class="grid-2" style="gap:20px">
        <!-- 学习进度 -->
        <div>
          <h3 style="margin-bottom:12px">📖 学习进度</h3>
          ${progressHTML}
        </div>
        <!-- 推荐 + 消息 -->
        <div>
          <h3 style="margin-bottom:12px">💡 为你推荐</h3>
          ${recHTML}
          ${unread > 0 ? `
          <div class="card" style="padding:14px 18px;margin-top:12px;border-left:3px solid var(--blue);cursor:pointer" onclick="Router.go('messages')">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:20px">🔔</span>
              <strong>${unread} 条未读消息</strong>
              <span style="font-size:11px;color:var(--muted)">点击查看 →</span>
            </div>
          </div>` : ''}
        </div>
      </div>`;
  }
};
