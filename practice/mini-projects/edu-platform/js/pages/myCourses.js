// ===== 我的课程（Learner / Trainer） =====
Pages.MyCourses = {
  render() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!el || !user) return;

    let courses = [];
    const role = user.role;

    if (role === 'Learner') {
      // 已支付订单对应的课程
      const paidOrders = Store.paidOrders(user.user_id);
      courses = paidOrders.map(o => {
        const course = Store.find('courses', 'course_id', o.course_id);
        return course ? { ...course, _orderId: o.order_id } : null;
      }).filter(Boolean);
    } else if (role === 'Trainer') {
      courses = Store.trainerCourses(user.user_id);
    }

    el.innerHTML = `
      <h2 style="margin-bottom:16px">📖 ${role === 'Learner' ? '我的课程' : '负责的课程'}</h2>
      ${courses.length === 0 ? `<div class="empty-state"><div class="icon">📭</div><h3>暂无课程</h3><p>${role === 'Learner' ? '去课程市场购买课程吧' : '等待 Editor 分配课程'}</p>${role === 'Learner' ? '<button class="btn btn-primary" onclick="Router.go(\'home\')">浏览课程</button>' : ''}</div>` : ''}
      <div class="course-grid">
        ${courses.map(c => {
          const exam = Store.exams().find(e => e.course_id === c.course_id);
          const myScore = Store.scores().find(s => s.course_id === c.course_id && s.user_id === user.user_id);
          return `
          <div class="course-card">
            <div class="card-top">
              <div class="type-row">${Utils.typeTag(c.type)} ${Utils.statusTag(c.status)}</div>
              <h3>${Utils.escape(c.title)}</h3>
              <div class="meta"><span>📅 ${c.schedule.length} 节课</span></div>
              ${myScore ? `<div class="meta"><span>📊 成绩：${myScore.total_score}分 ${myScore.passed ? '✅ 通过' : '❌ 未通过'}</span></div>` : ''}
            </div>
            <div class="card-bottom">
              <div style="display:flex;gap:8px">
                ${role === 'Learner' ? `<button class="btn btn-primary btn-sm" onclick="Router.go('exam',{examId:'${exam?.exam_id}',courseId:'${c.course_id}'})">📝 ${myScore ? '查看成绩' : '参加考试'}</button>` : ''}
                ${role === 'Trainer' ? `<button class="btn btn-primary btn-sm" onclick="Router.go('sessions')">📝 备课</button>` : ''}
                <button class="btn btn-outline btn-sm" onclick="Router.go('home',{courseId:'${c.course_id}'})">查看详情</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }
};
