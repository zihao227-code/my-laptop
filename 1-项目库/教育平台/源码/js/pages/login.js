// ===== 登录/注册页 =====
Pages.Login = {
  _mode: 'login', // 'login' | 'register'

  render() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    if (!el) return;

    el.innerHTML = `
      <div class="form-card">
        <h2 style="text-align:center;margin-bottom:24px">${this._mode === 'login' ? '🔐 登录' : '📝 注册'}</h2>

        ${this._mode === 'register' ? `
        <div class="form-group">
          <label>姓名 <span class="required">*</span></label>
          <input type="text" id="regName" placeholder="请输入姓名">
        </div>` : ''}
        <div class="form-group">
          <label>邮箱 <span class="required">*</span></label>
          <input type="email" id="loginEmail" placeholder="请输入邮箱" value="${this._mode === 'login' ? 'learner@edu.cn' : ''}">
        </div>
        <div class="form-group">
          <label>密码 <span class="required">*</span></label>
          <input type="password" id="loginPassword" placeholder="请输入密码" value="123456">
        </div>
        ${this._mode === 'register' ? `
        <div class="form-group">
          <label>角色</label>
          <select id="regRole"><option value="Learner">Learner（学员）</option><option value="Trainer">Trainer（讲师）</option></select>
        </div>` : ''}

        <div class="form-actions">
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="Pages.Login._submit()">
            ${this._mode === 'login' ? '登录' : '注册'}
          </button>
        </div>
        <p style="text-align:center;margin-top:12px;font-size:13px;color:var(--muted)">
          ${this._mode === 'login' ? "还没有账号？" : "已有账号？"}
          <a style="color:var(--primary);cursor:pointer" onclick="Pages.Login._toggle()">
            ${this._mode === 'login' ? '立即注册' : '去登录'}
          </a>
        </p>

        <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
          <p style="font-size:12px;color:var(--muted);text-align:center;margin-bottom:10px">🔑 快速切换演示账号</p>
          <div class="grid-4">
            <button class="btn btn-outline btn-sm" onclick="Pages.Login._quickLogin('admin@edu.cn')">👑 Admin</button>
            <button class="btn btn-outline btn-sm" onclick="Pages.Login._quickLogin('editor@edu.cn')">📋 Editor</button>
            <button class="btn btn-outline btn-sm" onclick="Pages.Login._quickLogin('trainer@edu.cn')">👨‍🏫 Trainer</button>
            <button class="btn btn-outline btn-sm" onclick="Pages.Login._quickLogin('learner@edu.cn')">🎓 Learner</button>
          </div>
        </div>
      </div>
    `;
  },

  _toggle() {
    this._mode = this._mode === 'login' ? 'register' : 'login';
    this.render();
  },

  _submit() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) { Utils.toast('请填写邮箱和密码', 'error'); return; }

    if (this._mode === 'login') {
      const r = Auth.login(email, password);
      if (r.success) { Utils.toast('登录成功，欢迎 ' + r.user.name, 'success'); Router.go('dashboard'); }
      else Utils.toast(r.error, 'error');
    } else {
      const name = document.getElementById('regName').value.trim();
      const role = document.getElementById('regRole').value;
      if (!name) { Utils.toast('请填写姓名', 'error'); return; }
      const r = Auth.register(name, email, password, role);
      if (r.success) { Utils.toast('注册成功！', 'success'); Router.go('dashboard'); }
      else Utils.toast(r.error, 'error');
    }
  },

  _quickLogin(email) {
    const r = Auth.login(email, '123456');
    if (r.success) { Utils.toast('已切换为 ' + r.user.name, 'success'); Router.go('dashboard'); }
    else Utils.toast(r.error, 'error');
  }
};
