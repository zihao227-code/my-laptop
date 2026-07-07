// ===== 备课管理（Trainer） =====
Pages.Sessions = {
  render() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!el || !user) return;

    const myCourses = Store.trainerCourses(user.user_id);
    const allSessions = Store.sessions().filter(s => s.trainer_id === user.user_id);

    el.innerHTML = `
      <h2 style="margin-bottom:16px">📝 备课管理</h2>
      <div class="grid-2">
        <div class="card">
          <h3>📋 我的课程</h3>
          ${myCourses.map(c => `
            <div style="padding:12px 0;border-bottom:1px solid #f1f2f6;display:flex;justify-content:space-between;align-items:center">
              <div><strong>${Utils.escape(c.title)}</strong><br><span style="font-size:12px;color:var(--muted)">${c.schedule.length} 节课 | ${Utils.formatDate(c.schedule[0]?.date)}</span></div>
              <button class="btn btn-primary btn-sm" onclick="Pages.Sessions._addSession('${c.course_id}')">+ 添加课次</button>
            </div>
          `).join('')}
          ${myCourses.length === 0 ? '<p style="color:var(--muted);font-size:13px">暂无分配的课程</p>' : ''}
        </div>
        <div class="card">
          <h3>📅 已排课次</h3>
          ${allSessions.length === 0 ? '<p style="color:var(--muted);font-size:13px">暂无课次</p>' : ''}
          ${allSessions.sort((a,b) => a.date.localeCompare(b.date)).map(s => {
            const course = Store.find('courses', 'course_id', s.course_id);
            return `
            <div style="padding:12px 0;border-bottom:1px solid #f1f2f6">
              <strong>${course ? Utils.escape(course.title) : s.course_id}</strong> — ${s.topic || '未命名'}
              <br><span style="font-size:12px;color:var(--muted)">📅 ${s.date} | 👥 ${s.attendance?.length || 0} 人出席</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div id="sessionFormArea" style="margin-top:20px"></div>
    `;
  },

  _addSession(courseId) {
    const area = document.getElementById('sessionFormArea');
    const course = Store.find('courses', 'course_id', courseId);
    area.innerHTML = `
      <div class="form-card">
        <h3>➕ 新增课次 — ${course ? Utils.escape(course.title) : courseId}</h3>
        <div class="form-row">
          <div class="form-group"><label>日期</label><input type="date" id="sDate" value="${Utils.now()}"></div>
          <div class="form-group"><label>主题</label><input type="text" id="sTopic" placeholder="如：Python 基础语法"></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="Pages.Sessions._saveSession('${courseId}')">💾 保存</button>
          <button class="btn btn-outline" onclick="document.getElementById('sessionFormArea').innerHTML=''">取消</button>
        </div>
      </div>`;
  },

  _saveSession(courseId) {
    const date = document.getElementById('sDate').value;
    const topic = document.getElementById('sTopic').value.trim();
    if (!date) { Utils.toast('请选择日期', 'error'); return; }
    const c = Store.nextId('sessions');
    Store.insert('sessions', {
      session_id: Utils.genId('S', c), course_id: courseId, date, topic,
      trainer_id: Auth.currentUser.user_id, attendance: []
    });
    Utils.toast('课次已添加', 'success');
    this.render();
  }
};
