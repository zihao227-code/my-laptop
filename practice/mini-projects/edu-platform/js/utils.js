// ===== 工具函数 =====
const Utils = {
  now() { return new Date().toISOString().split('T')[0]; },
  nowISO() { return new Date().toISOString(); },
  genId(prefix, n) { return prefix + String(n).padStart(3, '0'); },

  toast(msg, type = 'success') {
    let t = document.getElementById('_toast');
    if (!t) { t = document.createElement('div'); t.id = '_toast'; document.body.appendChild(t); }
    t.textContent = msg; t.className = 'toast toast-' + type;
    t.classList.remove('hidden');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.add('hidden'), 2500);
  },

  statusTag(s) {
    const map = { draft: ['tag-draft','草稿'], published: ['tag-published','已发布'], in_progress: ['tag-progress','进行中'],
      completed: ['tag-completed','已完成'], archived: ['tag-archived','已归档'], cancelled: ['tag-cancelled','已取消'],
      pending: ['tag-pending','待支付'], paid: ['tag-paid','已支付'], active: ['tag-active','生效中'], revoked: ['tag-cancelled','已撤销'] };
    const [cls, label] = map[s] || ['', s];
    return `<span class="tag ${cls}">${label}</span>`;
  },

  typeTag(t) {
    const map = { online: 'tag-online', offline: 'tag-offline', hybrid: 'tag-hybrid' };
    return `<span class="tag ${map[t] || ''}">${t || ''}</span>`;
  },

  roleBadge(role) {
    return `<span class="role-tag role-${role}">${role}</span>`;
  },

  formatPrice(n) { return '¥' + Number(n).toLocaleString(); },

  formatDate(d) { if (!d) return ''; return d.slice(0, 10); },

  escape(s) { return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;'); },

  confirm(msg) { return window.confirm(msg); }
};
