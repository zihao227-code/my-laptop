// ===== 模拟支付页 =====
Pages.Payment = {
  _orderId: null,
  _step: 'pay', // 'pay' | 'processing' | 'done'

  render(params) {
    window.renderShell();
    this._orderId = params.orderId;
    this._step = 'pay';
    this._render();
  },

  _render() {
    const el = document.getElementById('mainContent');
    const order = Store.find('orders', 'order_id', this._orderId);
    if (!order) { el.innerHTML = '<div class="empty-state"><h3>订单不存在</h3></div>'; return; }
    const course = Store.find('courses', 'course_id', order.course_id);

    if (this._step === 'processing') {
      el.innerHTML = `
        <div class="payment-card card" style="text-align:center">
          <div class="icon" style="font-size:64px">⏳</div>
          <h3>正在处理支付...</h3>
          <p style="color:var(--muted);margin-top:8px">请稍候，正在连接支付网关</p>
        </div>`;
      setTimeout(() => { this._step = 'done'; this._render(); }, 2000);
      return;
    }

    if (this._step === 'done') {
      el.innerHTML = `
        <div class="payment-card card" style="text-align:center">
          <div class="icon" style="font-size:64px">✅</div>
          <h3>支付成功！</h3>
          <p style="color:var(--muted);margin-top:8px">订单 ${order.order_id} 已支付</p>
          <p style="font-size:24px;font-weight:700;color:var(--danger);margin:12px 0">${Utils.formatPrice(order.price_final)}</p>
          <div style="margin-top:20px;display:flex;gap:12px;justify-content:center">
            <button class="btn btn-primary" onclick="Router.go('myCourses')">📖 开始学习</button>
            <button class="btn btn-outline" onclick="Router.go('orders')">🛒 查看订单</button>
          </div>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="payment-card card">
        <h3 style="text-align:center;margin-bottom:20px">💳 支付确认</h3>
        <div class="amount-display">
          <div style="font-size:13px;color:var(--muted);margin-bottom:4px">支付金额</div>
          <div class="big-price">${Utils.formatPrice(order.price_final)}</div>
          ${order.funding_applied ? `<div style="font-size:12px;color:var(--success);margin-top:4px">已享受 Funding 补贴 -${Utils.formatPrice(order.funding_amount)}</div>` : ''}
        </div>
        <div style="margin-bottom:12px">
          <div style="font-size:13px;color:var(--muted);margin-bottom:4px">订单信息</div>
          <div style="font-size:14px"><strong>课程：</strong>${course ? Utils.escape(course.title) : '—'}</div>
          <div style="font-size:14px"><strong>订单号：</strong>${order.order_id}</div>
        </div>
        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
        <div class="form-group"><label>选择支付方式</label>
          <select id="payMethod" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;font-size:14px">
            <option value="wechat">💚 微信支付</option>
            <option value="alipay">💙 支付宝</option>
            <option value="card">💳 银行卡</option>
          </select>
        </div>
        <div class="form-group"><label>卡号（模拟）</label><input type="text" class="fake-input" placeholder="•••• •••• •••• ••••" value="6222 **** **** 1234"></div>
        <div class="form-row">
          <div class="form-group"><label>有效期</label><input type="text" class="fake-input" value="12/28"></div>
          <div class="form-group"><label>CVV</label><input type="text" class="fake-input" value="***"></div>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;margin-top:16px" onclick="Pages.Payment._pay()">💳 确认支付 ${Utils.formatPrice(order.price_final)}</button>
        <p style="text-align:center;margin-top:8px;font-size:11px;color:var(--muted)">🔒 这是一个模拟支付页面，不会真实扣款</p>
      </div>`;
  },

  _pay() {
    const order = Store.find('orders', 'order_id', this._orderId);
    if (!order) return;

    // 创建支付记录
    const method = document.getElementById('payMethod').value;
    const c = Store.nextId('payments');
    const payment = {
      payment_id: Utils.genId('P', c), order_id: this._orderId, amount: order.price_final,
      method, status: 'completed', paid_at: Utils.nowISO()
    };
    Store.insert('payments', payment);

    // 更新订单状态
    Store.update('orders', 'order_id', this._orderId, { status: 'paid' });

    // 发送通知
    const course = Store.find('courses', 'course_id', order.course_id);
    const nc = Store.nextId('notifications');
    Store.insert('notifications', {
      notif_id: Utils.genId('N', nc), user_id: order.user_id, type: 'payment',
      title: '支付成功', content: `课程「${course?.title || ''}」支付成功，¥${order.price_final}，欢迎学习！`, read: false, created_at: Utils.nowISO()
    });

    EventBus.emit(EVENTS.PAYMENT_COMPLETED, { order, payment });
    this._step = 'processing';
    this._render();
  }
};
