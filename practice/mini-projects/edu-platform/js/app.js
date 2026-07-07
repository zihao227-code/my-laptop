// ===== 应用入口 =====
(function() {

  // 1. 初始化种子数据
  Seed.init();

  // 2. 初始化认证
  Auth.init();

  // 3. 注册路由
  Router
    .register('home',       p => Pages.Home.render(p))
    .register('login',      p => Pages.Login.render(p))
    .register('dashboard',  p => Pages.Dashboard.render(p))
    .register('courses',    p => Pages.Courses.render(p))
    .register('funding',    p => Pages.Funding.render(p))
    .register('orders',     p => Pages.Orders.render(p))
    .register('payment',    p => Pages.Payment.render(p))
    .register('myCourses',  p => Pages.MyCourses.render(p))
    .register('sessions',   p => Pages.Sessions.render(p))
    .register('exam',       p => Pages.Exam.render(p))
    .register('messages',   p => Pages.Messages.render(p))
    .register('admin',      p => Pages.Admin.render(p));

  // 4. 渲染应用壳
  function renderShell() {
    const app = document.getElementById('app');
    const user = Auth.currentUser;

    const navItems = getNavItems();
    const active = Router.current;

    let navHTML = '';
    if (user) {
      navHTML = '<div class="nav">' + navItems.map(item => {
        const isActive = item.route === active;
        return `<a class="${isActive ? 'active' : ''}" onclick="Router.go('${item.route}')">${item.icon} ${item.label}${item.badge ? `<span class="badge">${item.badge}</span>` : ''}</a>`;
      }).join('') + '</div>';
    }

    const userHTML = user
      ? `<div class="user-area">${Utils.roleBadge(user.role)} <strong>${Utils.escape(user.name)}</strong>
         <button class="btn btn-outline btn-sm" onclick="Router.go('dashboard')">📊 面板</button>
         <button class="btn btn-outline btn-sm" onclick="Auth.logout();Router.go('home')">退出</button></div>`
      : `<div class="user-area"><button class="btn btn-primary btn-sm" onclick="Router.go('login')">登录</button></div>`;

    app.innerHTML = `
      <div class="header">
        <h1 onclick="Router.go('home')">📚 教育培训平台</h1>
        ${userHTML}
      </div>
      ${navHTML}
      <div class="main" id="mainContent"></div>
    `;
  }

  function getNavItems() {
    const role = Auth.role;
    const items = [];
    if (role === 'guest') return items;

    items.push({ route: 'home', label: '课程市场', icon: '🏠' });

    if (['Admin', 'Editor'].includes(role)) {
      items.push({ route: 'courses', label: '课程管理', icon: '📋' });
      items.push({ route: 'funding', label: 'Funding', icon: '💰' });
    }
    if (['Admin', 'Editor', 'Learner'].includes(role)) {
      items.push({ route: 'orders', label: '订单', icon: '🛒' });
    }
    if (['Trainer', 'Learner'].includes(role)) {
      items.push({ route: 'myCourses', label: '我的课程', icon: '📖' });
    }
    if (role === 'Trainer') {
      items.push({ route: 'sessions', label: '备课管理', icon: '📝' });
    }
    if (role !== 'guest') {
      const unread = Store.notifications().filter(n => n.user_id === Auth.currentUser?.user_id && !n.read).length;
      items.push({ route: 'messages', label: '消息', icon: '🔔', badge: unread > 0 ? unread : null });
    }
    if (role === 'Admin') {
      items.push({ route: 'admin', label: '用户管理', icon: '⚙️' });
    }
    return items;
  }

  // 5. 事件监听：认证变化时刷新壳
  EventBus.on(EVENTS.AUTH_CHANGED, () => {
    renderShell();
    Router.refresh();
  });

  // 6. 暴露 renderShell 给页面使用
  window.renderShell = renderShell;

  // 7. 启动
  renderShell();
  Router.start();

  console.log('📚 教育培训平台已启动');
  console.log('  预设账号: admin@edu.cn / editor@edu.cn / trainer@edu.cn / learner@edu.cn');
  console.log('  密码: 123456');
})();
