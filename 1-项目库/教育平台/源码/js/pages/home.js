// ===== 官网首页（公开） =====
const Pages = window.Pages || {};

Pages.Home = {
  _view: 'list', // 'list' | 'detail'
  _detailCourseId: null,
  _search: '',
  _filterType: '',
  _filterTag: '',

  render(params) {
    // 初始化后由 app.js 调用，确保 shell 已渲染
    this._view = params.courseId ? 'detail' : 'list';
    this._detailCourseId = params.courseId || null;
    this._renderContent();
  },

  _renderContent() {
    if (this._view === 'list') this._renderList();
    else this._renderDetail();
  },

  // ===== 课程列表 =====
  _renderList() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    if (!el) return;

    let courses = Store.publishedCourses();

    // 搜索过滤
    if (this._search) {
      const q = this._search.toLowerCase();
      courses = courses.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)));
    }
    if (this._filterType) courses = courses.filter(c => c.type === this._filterType);
    if (this._filterTag) courses = courses.filter(c => c.tags.includes(this._filterTag));

    // 收集所有标签
    const allTags = [...new Set(Store.publishedCourses().flatMap(c => c.tags))].sort();

    const fundingInfos = {};
    if (Auth.isLoggedIn) {
      courses.forEach(c => {
        const fi = FundingEngine.calculate(Auth.currentUser.user_id, c.course_id);
        if (fi) fundingInfos[c.course_id] = fi;
      });
    }

    el.innerHTML = `
      <div class="toolbar">
        <input type="text" placeholder="🔍 搜索课程..." value="${Utils.escape(this._search)}" oninput="Pages.Home._search=this.value;Pages.Home._renderList()">
        <select onchange="Pages.Home._filterType=this.value;Pages.Home._renderList()">
          <option value="">全部类型</option>
          <option value="online" ${this._filterType==='online'?'selected':''}>在线</option>
          <option value="offline" ${this._filterType==='offline'?'selected':''}>线下</option>
          <option value="hybrid" ${this._filterType==='hybrid'?'selected':''}>混合</option>
        </select>
        <select onchange="Pages.Home._filterTag=this.value;Pages.Home._renderList()">
          <option value="">全部标签</option>
          ${allTags.map(t => `<option value="${t}" ${this._filterTag===t?'selected':''}>${t}</option>`).join('')}
        </select>
        <span class="spacer"></span>
        <span style="font-size:13px;color:var(--muted)">共 ${courses.length} 门课程</span>
      </div>
      ${courses.length === 0 ? '<div class="empty-state"><div class="icon">📭</div><h3>没有找到课程</h3><p>试试其他搜索条件</p></div>' : ''}
      <div class="course-grid">
        ${courses.map(c => this._courseCard(c, fundingInfos[c.course_id])).join('')}
      </div>
    `;
  },

  _courseCard(course, funding) {
    const trainerNames = (course.trainer_ids || []).map(id => {
      const u = Store.find('users', 'user_id', id);
      return u ? u.name : id;
    }).join(', ');

    let priceHTML = '';
    if (funding && funding.eligible) {
      priceHTML = `<span class="original">${Utils.formatPrice(funding.price_original)}</span>
                   ${Utils.formatPrice(funding.price_final)}
                   <span class="funding-tag">已补贴 ¥${funding.funding_amount}</span>`;
    } else {
      priceHTML = Utils.formatPrice(course.price_original);
    }

    return `
    <div class="course-card" onclick="Router.go('home',{courseId:'${course.course_id}'})">
      <div class="card-top">
        <div class="type-row">${Utils.typeTag(course.type)} ${Utils.statusTag(course.status)}</div>
        <h3>${Utils.escape(course.title)}</h3>
        <p class="desc">${Utils.escape(course.description).substring(0, 80)}...</p>
        <div class="meta">
          <span>👨‍🏫 ${Utils.escape(trainerNames)}</span>
          <span>📅 ${course.schedule.length} 节课</span>
        </div>
        <div class="meta">
          ${(course.tags||[]).map(t => `<span class="tag">${t}</span>`).join(' ')}
        </div>
      </div>
      <div class="card-bottom">
        <div class="price">${priceHTML}</div>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();Router.go('home',{courseId:'${course.course_id}'})">查看详情</button>
      </div>
    </div>`;
  },

  // ===== 课程详情 =====
  _renderDetail() {
    window.renderShell();
    const el = document.getElementById('mainContent');
    if (!el) return;

    const course = Store.find('courses', 'course_id', this._detailCourseId);
    if (!course) { el.innerHTML = '<div class="empty-state"><h3>课程不存在</h3></div>'; return; }

    const trainerNames = (course.trainer_ids || []).map(id => {
      const u = Store.find('users', 'user_id', id);
      return u ? u.name : id;
    }).join(', ');

    // Funding 信息
    let fundingHTML = '';
    if (Auth.isLoggedIn) {
      const fi = FundingEngine.calculate(Auth.currentUser.user_id, course.course_id);
      if (fi && fi.eligible) {
        fundingHTML = `
          <div class="price-section">
            <div class="final-price">${Utils.formatPrice(fi.price_final)}</div>
            <div class="price-breakdown">
              原价 ${Utils.formatPrice(fi.price_original)} -
              ${fi.agreement_title} 补贴 ${Utils.formatPrice(fi.funding_amount)}
            </div>
            <div style="margin-top:12px">
              <button class="btn btn-primary btn-lg" onclick="Pages.Home._buyCourse('${course.course_id}')">🚀 立即购买</button>
              <span style="font-size:12px;color:var(--muted);margin-left:12px">享受 Funding 补贴后价格</span>
            </div>
          </div>`;
      } else {
        fundingHTML = `
          <div class="price-section">
            <div class="final-price">${Utils.formatPrice(course.price_original)}</div>
            <div style="margin-top:12px">
              <button class="btn btn-primary btn-lg" onclick="Pages.Home._buyCourse('${course.course_id}')">🚀 立即购买</button>
            </div>
          </div>`;
      }
    } else {
      fundingHTML = `
        <div class="price-section">
          <div class="final-price">${Utils.formatPrice(course.price_original)}</div>
          <div style="margin-top:12px">
            <button class="btn btn-primary btn-lg" onclick="Router.go('login')">登录后购买</button>
          </div>
        </div>`;
    }

    el.innerHTML = `
      <button class="btn btn-outline btn-sm" style="margin-bottom:16px" onclick="Pages.Home._view='list';Pages.Home._renderList();Router.navigate('home')">← 返回课程列表</button>
      <div class="detail-header">
        <div>${Utils.typeTag(course.type)} ${Utils.statusTag(course.status)}</div>
        <h2>${Utils.escape(course.title)}</h2>
        <div class="detail-meta">
          <span>👨‍🏫 讲师：${Utils.escape(trainerNames)}</span>
          <span>📅 ${course.schedule.length} 节课</span>
          <span>📝 考试方式：${course.exam_config?.method === 'online' ? '线上' : '线下'}</span>
          <span>🎯 及格线：${course.exam_config?.pass_score || 60}分</span>
        </div>
        <div>${(course.tags||[]).map(t => `<span class="tag">${t}</span>`).join(' ')}</div>
        ${fundingHTML}
      </div>
      <div class="detail-body">
        <div class="card">
          <h3>📖 课程介绍</h3>
          <p style="font-size:14px;line-height:1.8;white-space:pre-wrap">${Utils.escape(course.description)}</p>
        </div>
        <div>
          <div class="card">
            <h3>📅 课程安排</h3>
            <table><tbody>
              ${course.schedule.map((s,i) => `<tr><td>第${i+1}节</td><td>${s.date}</td><td>${s.time}</td></tr>`).join('')}
            </tbody></table>
          </div>
        </div>
      </div>
    `;
  },

  _buyCourse(courseId) {
    if (!Auth.isLoggedIn) { Utils.toast('请先登录', 'error'); Router.go('login'); return; }
    if (Auth.role !== 'Learner') { Utils.toast('仅 Learner 可以购买课程', 'error'); return; }

    const course = Store.find('courses', 'course_id', courseId);
    if (!course) return;

    const fi = FundingEngine.calculate(Auth.currentUser.user_id, courseId);
    const fundingApplied = (fi && fi.eligible) ? fi.agreement_id : null;
    const fundingAmount = fi ? fi.funding_amount : 0;
    const priceFinal = fi ? fi.price_final : course.price_original;

    // 创建订单
    const c = Store.nextId('orders');
    const orderId = Utils.genId('O', c);
    const order = {
      order_id: orderId, user_id: Auth.currentUser.user_id, course_id: courseId,
      price_original: course.price_original, funding_applied: fundingApplied,
      funding_amount: fundingAmount, price_final: priceFinal,
      status: 'pending', created_at: Utils.now()
    };
    Store.insert('orders', order);
    EventBus.emit(EVENTS.ORDER_CREATED, order);
    Utils.toast('订单已创建，请完成支付', 'success');
    Router.go('payment', { orderId });
  }
};

window.Pages = Pages;
