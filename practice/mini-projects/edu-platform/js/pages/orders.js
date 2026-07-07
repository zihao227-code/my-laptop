// ===== 订单管理 =====
Pages.Orders = {
  _filterStatus: '',

  render() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    const user = Auth.currentUser;
    if (!el || !user) return;

    let orders;
    if (['Admin', 'Editor'].includes(user.role)) {
      orders = Store.orders();
    } else {
      orders = Store.userOrders(user.user_id);
    }
    if (this._filterStatus) orders = orders.filter(o => o.status === this._filterStatus);
    orders.sort((a, b) => b.created_at.localeCompare(a.created_at));

    const courses = Store.courses();

    el.innerHTML = `
      <h2 style="margin-bottom:16px">🛒 订单管理</h2>
      <div class="toolbar">
        <select onchange="Pages.Orders._filterStatus=this.value;Pages.Orders.render()">
          <option value="">全部状态</option><option value="pending">待支付</option><option value="paid">已支付</option><option value="completed">已完成</option><option value="cancelled">已取消</option>
        </select>
        <span class="spacer"></span>
        <span style="font-size:13px;color:var(--muted)">共 ${orders.length} 笔订单</span>
      </div>
      ${orders.length === 0 ? '<div class="empty-state"><div class="icon">📭</div><h3>暂无订单</h3><p>去课程市场逛逛吧</p><button class="btn btn-primary" onclick="Router.go(\'home\')">浏览课程</button></div>' : ''}
      <div class="table-wrap">
        <table>
          <thead><tr><th>订单号</th><th>课程</th><th>原价</th><th>Funding</th><th>实付</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            ${orders.map(o => {
              const course = courses.find(c => c.course_id === o.course_id);
              return `<tr>
                <td>${o.order_id}</td><td><strong>${course ? Utils.escape(course.title) : o.course_id}</strong></td>
                <td>${Utils.formatPrice(o.price_original)}</td>
                <td>${o.funding_applied ? `<span class="tag tag-success">-${Utils.formatPrice(o.funding_amount)}</span>` : '<span class="tag tag-draft">—</span>'}</td>
                <td><strong>${Utils.formatPrice(o.price_final)}</strong></td>
                <td>${Utils.statusTag(o.status)}</td><td>${Utils.formatDate(o.created_at)}</td>
                <td>
                  ${o.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="Router.go('payment',{orderId:'${o.order_id}'})">💳 支付</button>` : ''}
                  ${o.status === 'pending' ? `<button class="btn btn-outline btn-sm" onclick="Pages.Orders._cancel('${o.order_id}')">取消</button>` : ''}
                  ${o.status === 'paid' ? `<button class="btn btn-success btn-sm" onclick="Pages.Orders._viewDetail('${o.order_id}')">📄 详情</button>` : ''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  _cancel(orderId) {
    if (!Utils.confirm('确定取消此订单？')) return;
    Store.update('orders', 'order_id', orderId, { status: 'cancelled' });
    Utils.toast('订单已取消', 'success');
    this.render();
  },

  _viewDetail(orderId) {
    const order = Store.find('orders', 'order_id', orderId);
    if (!order) return;
    const course = Store.find('courses', 'course_id', order.course_id);
    const payment = Store.payments().find(p => p.order_id === orderId);
    const el = document.getElementById('mainContent');

    el.innerHTML = `
      <button class="btn btn-outline btn-sm" style="margin-bottom:16px" onclick="Pages.Orders.render()">← 返回</button>
      <div class="card" style="max-width:600px;margin:0 auto">
        <h3>📄 订单详情 — ${order.order_id}</h3>
        <table style="margin-top:16px">
          <tr><td style="color:var(--muted);width:120px">课程</td><td><strong>${course ? Utils.escape(course.title) : '—'}</strong></td></tr>
          <tr><td style="color:var(--muted)">原价</td><td>${Utils.formatPrice(order.price_original)}</td></tr>
          <tr><td style="color:var(--muted)">Funding 补贴</td><td>${order.funding_applied ? Utils.formatPrice(order.funding_amount) + ' (' + order.funding_applied + ')' : '无'}</td></tr>
          <tr><td style="color:var(--muted)">实付金额</td><td style="font-size:18px;font-weight:700;color:var(--danger)">${Utils.formatPrice(order.price_final)}</td></tr>
          <tr><td style="color:var(--muted)">状态</td><td>${Utils.statusTag(order.status)}</td></tr>
          <tr><td style="color:var(--muted)">创建时间</td><td>${order.created_at}</td></tr>
          <tr><td style="color:var(--muted)">支付方式</td><td>${payment ? payment.method : '—'}</td></tr>
          <tr><td style="color:var(--muted)">支付时间</td><td>${payment ? payment.paid_at : '—'}</td></tr>
        </table>
      </div>`;
  }
};
