// ===== 角色仪表盘 =====
Pages.Dashboard = {
  render() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!el || !user) return;

    const role = user.role;
    let statsHTML = '';
    let linksHTML = '';

    if (role === 'Admin') {
      const totalUsers = Store.users().length;
      const totalCourses = Store.courses().length;
      const totalOrders = Store.orders().length;
      const totalRevenue = Store.orders().filter(o => o.status === 'paid').reduce((s,o) => s + o.price_final, 0);
      statsHTML = `
        <div class="grid-4">
          <div class="stat-card"><div class="stat-num">${totalUsers}</div><div class="stat-label">用户总数</div></div>
          <div class="stat-card"><div class="stat-num">${totalCourses}</div><div class="stat-label">课程总数</div></div>
          <div class="stat-card"><div class="stat-num">${totalOrders}</div><div class="stat-label">订单总数</div></div>
          <div class="stat-card"><div class="stat-num">¥${totalRevenue.toLocaleString()}</div><div class="stat-label">总收入</div></div>
        </div>`;
      linksHTML = `<button class="btn btn-outline" onclick="Router.go('admin')">⚙️ 用户管理</button>
                   <button class="btn btn-outline" onclick="Router.go('courses')">📋 课程管理</button>`;
    } else if (role === 'Editor') {
      const myCourses = Store.courses().length;
      const draftCourses = Store.courses().filter(c => c.status === 'draft').length;
      const activeFunding = Store.activeFunding().length;
      statsHTML = `
        <div class="grid-3">
          <div class="stat-card"><div class="stat-num">${myCourses}</div><div class="stat-label">课程总数</div></div>
          <div class="stat-card"><div class="stat-num">${draftCourses}</div><div class="stat-label">草稿</div></div>
          <div class="stat-card"><div class="stat-num">${activeFunding}</div><div class="stat-label">生效的 Funding</div></div>
        </div>`;
      linksHTML = `<button class="btn btn-primary" onclick="Router.go('courses')">📋 管理课程</button>
                   <button class="btn btn-outline" onclick="Router.go('funding')">💰 配置 Funding</button>`;
    } else if (role === 'Trainer') {
      const myCourseList = Store.trainerCourses(user.user_id);
      const upcomingSessions = Store.sessions().filter(s => s.trainer_id === user.user_id && s.date >= Utils.now()).length;
      statsHTML = `
        <div class="grid-2">
          <div class="stat-card"><div class="stat-num">${myCourseList.length}</div><div class="stat-label">我的课程</div></div>
          <div class="stat-card"><div class="stat-num">${upcomingSessions}</div><div class="stat-label">待上课次</div></div>
        </div>`;
      linksHTML = `<button class="btn btn-primary" onclick="Router.go('myCourses')">📖 我的课程</button>
                   <button class="btn btn-outline" onclick="Router.go('sessions')">📝 备课管理</button>`;
    } else if (role === 'Learner') {
      const myOrders = Store.userOrders(user.user_id);
      const paidOrders = myOrders.filter(o => o.status === 'paid');
      const unreadMsgs = Store.notifications().filter(n => n.user_id === user.user_id && !n.read).length;
      statsHTML = `
        <div class="grid-3">
          <div class="stat-card"><div class="stat-num">${paidOrders.length}</div><div class="stat-label">已购课程</div></div>
          <div class="stat-card"><div class="stat-num">${myOrders.length}</div><div class="stat-label">全部订单</div></div>
          <div class="stat-card"><div class="stat-num">${unreadMsgs}</div><div class="stat-label">未读消息</div></div>
        </div>`;
      linksHTML = `<button class="btn btn-primary" onclick="Router.go('home')">🏠 浏览课程</button>
                   <button class="btn btn-outline" onclick="Router.go('myCourses')">📖 我的课程</button>
                   <button class="btn btn-outline" onclick="Router.go('orders')">🛒 我的订单</button>`;
    }

    el.innerHTML = `
      <h2 style="margin-bottom:20px">📊 ${user.name} 的工作台</h2>
      ${statsHTML}
      <div style="margin-top:20px;display:flex;gap:12px">${linksHTML}</div>
    `;
  }
};
