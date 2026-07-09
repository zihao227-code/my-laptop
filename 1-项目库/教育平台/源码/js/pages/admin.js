// ===== 用户管理（Admin 专用） =====
Pages.Admin = {
  render() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!el || !user || user.role !== 'Admin') {
      el.innerHTML = '<div class="empty-state"><div class="icon">🚫</div><h3>权限不足</h3><p>仅 Admin 可访问此页面</p></div>';
      return;
    }

    const users = Auth.getAllUsers();

    el.innerHTML = `
      <h2 style="margin-bottom:16px">⚙️ 用户管理</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>姓名</th><th>邮箱</th><th>角色</th><th>注册时间</th><th>操作</th></tr></thead>
          <tbody>
            ${users.map(u => `<tr>
              <td>${u.user_id}</td><td><strong>${Utils.escape(u.name)}</strong></td>
              <td>${Utils.escape(u.email)}</td>
              <td>${Utils.roleBadge(u.role)}</td>
              <td>${Utils.formatDate(u.created_at)}</td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="Pages.Admin._switchUser('${u.user_id}')">👤 切换</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:16px;padding:12px;background:#fef9e7;border-radius:8px;font-size:13px;color:#7d6608">
        💡 <strong>提示：</strong>"切换"功能用于演示，可以切换身份到任意用户，体验不同角色的视角。
      </div>
    `;
  },

  _switchUser(userId) {
    Auth.switchUser(userId);
    Utils.toast('已切换身份', 'success');
    Router.go('dashboard');
  }
};
