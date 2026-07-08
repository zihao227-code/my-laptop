// ===== 认证模块 =====
const Auth = {
  _currentUser: null,

  init() {
    const saved = localStorage.getItem('edu_currentUser');
    if (saved) {
      try { this._currentUser = JSON.parse(saved); } catch(e) { this._currentUser = null; }
    }
  },

  get currentUser() { return this._currentUser; },
  get isLoggedIn() { return !!this._currentUser; },
  get role() { return this._currentUser?.role || 'guest'; },

  login(email, password) {
    const user = Store.users().find(u => u.email === email && u.password === password);
    if (!user) return { success: false, error: '邮箱或密码错误' };
    this._currentUser = { user_id: user.user_id, name: user.name, email: user.email, role: user.role, learner_info: user.learner_info, subjects: user.subjects };
    localStorage.setItem('edu_currentUser', JSON.stringify(this._currentUser));
    EventBus.emit(EVENTS.AUTH_CHANGED, this._currentUser);
    return { success: true, user: this._currentUser };
  },

  register(name, email, password, role, extra = {}) {
    if (Store.users().find(u => u.email === email)) return { success: false, error: '该邮箱已注册' };
    const c = Store.nextId('users');
    const uid = Utils.genId('U', c);
    const user = { user_id: uid, name, email, password, role, ...extra, created_at: Utils.now() };
    Store.insert('users', user);
    this._currentUser = { user_id: uid, name, email, role, learner_info: user.learner_info, subjects: user.subjects };
    localStorage.setItem('edu_currentUser', JSON.stringify(this._currentUser));
    EventBus.emit(EVENTS.AUTH_CHANGED, this._currentUser);
    return { success: true, user: this._currentUser };
  },

  logout() {
    this._currentUser = null;
    localStorage.removeItem('edu_currentUser');
    EventBus.emit(EVENTS.AUTH_CHANGED, null);
  },

  switchUser(userId) {
    const u = Store.find('users', 'user_id', userId);
    if (!u) return;
    this._currentUser = { user_id: u.user_id, name: u.name, email: u.email, role: u.role, learner_info: u.learner_info, subjects: u.subjects };
    localStorage.setItem('edu_currentUser', JSON.stringify(this._currentUser));
    EventBus.emit(EVENTS.AUTH_CHANGED, this._currentUser);
  },

  // 检查是否有权限访问某路由
  canAccess(route) {
    const role = this.role;
    const map = {
      'Admin': ['dashboard', 'home', 'courses', 'funding', 'orders', 'myCourses', 'sessions', 'exam', 'messages', 'admin', 'payment'],
      'Editor': ['dashboard', 'home', 'courses', 'funding', 'orders', 'messages', 'payment'],
      'Trainer': ['dashboard', 'home', 'myCourses', 'sessions', 'exam', 'messages', 'payment'],
      'Learner': ['dashboard', 'home', 'orders', 'myCourses', 'exam', 'messages', 'payment'],
      'guest': ['home', 'login'],
    };
    return (map[role] || map['guest']).includes(route);
  },

  getAllUsers() {
    return Store.users().map(u => ({ user_id: u.user_id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }));
  }
};
