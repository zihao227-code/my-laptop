// ===== 消息中心（30s 轮询） =====
Pages.Messages = {
  _pollTimer: null,
  _activeType: '', // 消息类型筛选

  render() {
    window.renderShell();
    this._startPolling();
    this._renderList();
  },

  _renderList() {
    const el = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!el || !user) return;

    let msgs = Store.notifications().filter(n => n.user_id === user.user_id);
    if (this._activeType) msgs = msgs.filter(n => n.type === this._activeType);
    msgs.sort((a, b) => b.created_at.localeCompare(a.created_at));
    const unread = msgs.filter(n => !n.read).length;

    const typeMap = { payment: '💳 支付', course: '📖 课程', exam: '📝 考试', system: '🔔 系统' };

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2>🔔 消息中心 ${unread > 0 ? `<span class="badge">${unread} 条未读</span>` : ''}</h2>
        <div style="display:flex;gap:8px">
          <select onchange="Pages.Messages._activeType=this.value;Pages.Messages._renderList()">
            <option value="">全部类型</option>
            ${Object.entries(typeMap).map(([k,v]) => `<option value="${k}" ${Pages.Messages._activeType===k?'selected':''}>${v}</option>`).join('')}
          </select>
          <button class="btn btn-outline btn-sm" onclick="Pages.Messages._markAllRead()">✅ 全部已读</button>
        </div>
      </div>
      ${msgs.length === 0 ? '<div class="empty-state"><div class="icon">📭</div><h3>暂无消息</h3></div>' : ''}
      <div class="table-wrap">
        ${msgs.map(m => `
          <div class="msg-item ${m.read ? '' : 'unread'}" onclick="Pages.Messages._read('${m.notif_id}')">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span style="font-size:16px">${m.read ? '○' : '🔵'}</span>
                <strong>${Utils.escape(m.title)}</strong>
                <span class="tag" style="margin-left:8px">${typeMap[m.type] || m.type}</span>
              </div>
              <span class="msg-time">${Utils.formatDate(m.created_at)}</span>
            </div>
            <div style="font-size:13px;color:var(--muted);margin-top:4px;padding-left:24px">${Utils.escape(m.content)}</div>
          </div>
        `).join('')}
      </div>
    `;

    // 更新导航上的未读数字（精准更新，不重建整个壳）
    const badge = document.querySelector('.nav .badge');
    if (badge) {
      const unreadNow = Store.notifications().filter(n => n.user_id === user.user_id && !n.read).length;
      if (unreadNow > 0) badge.textContent = unreadNow;
      else if (badge.parentElement) badge.remove();
    }
  },

  _read(notifId) {
    Store.update('notifications', 'notif_id', notifId, { read: true });
    this._renderList();
  },

  _markAllRead() {
    const user = Auth.currentUser;
    Store.notifications().filter(n => n.user_id === user.user_id && !n.read).forEach(n => {
      Store.update('notifications', 'notif_id', n.notif_id, { read: true });
    });
    Utils.toast('已全部标记为已读', 'success');
    this._renderList();
  },

  _startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(() => {
      // 刷新数据缓存并检查新消息
      const before = Store.notifications().length;
      Store.reload('notifications');
      const after = Store.notifications().length;
      if (after > before && Router.current === 'messages') {
        this._renderList();
      }
    }, 30000); // 30 秒轮询
  }
};
