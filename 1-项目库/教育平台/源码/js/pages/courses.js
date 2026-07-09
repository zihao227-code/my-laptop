// ===== 课程管理（Editor/Admin） =====
Pages.Courses = {
  _view: 'list', // 'list' | 'create' | 'edit'
  _editId: null,
  _search: '', _filterStatus: '', _filterType: '',
  _sortField: 'created_at', _sortDesc: true,
  _page: 1, _pageSize: 10,
  _selectedIds: new Set(),

  render(params) {
    window.renderShell();
    this._view = (params.courseId && params.courseId !== 'undefined') ? 'edit' : 'list';
    this._editId = params.courseId || null;
    this._renderContent();
  },

  _renderContent() {
    if (this._view === 'list') this._renderList();
    else if (this._view === 'create') this._renderForm(null);
    else this._renderForm(this._editId);
  },

  _renderList() {
    const el = document.getElementById('mainContent');
    if (!el) return;
    let courses = Store.courses();
    if (this._search) { const q = this._search.toLowerCase(); courses = courses.filter(c => c.title.toLowerCase().includes(q)); }
    if (this._filterStatus) courses = courses.filter(c => c.status === this._filterStatus);
    if (this._filterType) courses = courses.filter(c => c.type === this._filterType);
    courses.sort((a,b) => {
      let va = a[this._sortField] || '', vb = b[this._sortField] || '';
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      return (va < vb ? -1 : 1) * (this._sortDesc ? 1 : -1);
    });
    const totalPages = Math.ceil(courses.length / this._pageSize) || 1;
    if (this._page > totalPages) this._page = totalPages;
    const start = (this._page - 1) * this._pageSize;
    const pageItems = courses.slice(start, start + this._pageSize);

    el.innerHTML = `
      <div class="toolbar">
        <input type="text" placeholder="🔍 搜索课程..." value="${Utils.escape(this._search)}" oninput="Pages.Courses._search=this.value;Pages.Courses._page=1;Pages.Courses._renderList()">
        <select onchange="Pages.Courses._filterStatus=this.value;Pages.Courses._page=1;Pages.Courses._renderList()">
          <option value="">全部状态</option><option value="draft">草稿</option><option value="published">已发布</option><option value="in_progress">进行中</option><option value="completed">已完成</option>
        </select>
        <select onchange="Pages.Courses._filterType=this.value;Pages.Courses._page=1;Pages.Courses._renderList()">
          <option value="">全部类型</option><option value="online">在线</option><option value="offline">线下</option><option value="hybrid">混合</option>
        </select>
        <span class="spacer"></span>
        <button class="btn btn-primary" onclick="Pages.Courses._openCreate()">+ 新增课程</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>ID</th><th>标题</th><th>类型</th><th>价格</th><th>老师</th><th>状态</th><th>Funding</th><th>更新日期</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${pageItems.map(c => {
              const tn = (c.trainer_ids||[]).map(id => (Store.find('users','user_id',id)||{}).name||id).join(', ');
              return `<tr>
                <td>${c.course_id}</td><td><strong>${Utils.escape(c.title)}</strong></td>
                <td>${Utils.typeTag(c.type)}</td><td>${Utils.formatPrice(c.price_original)}</td>
                <td>${Utils.escape(tn)}</td><td>${Utils.statusTag(c.status)}</td>
                <td>${c.funding_eligible ? '<span class="tag tag-success">✅</span>' : '<span class="tag tag-draft">—</span>'}</td>
                <td>${Utils.formatDate(c.updated_at)}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="Pages.Courses._openEdit('${c.course_id}')">✏️</button>
                  ${c.status === 'draft' ? `<button class="btn btn-success btn-sm" onclick="Pages.Courses._publish('${c.course_id}')">发布</button>` : ''}
                  ${c.status === 'published' ? `<button class="btn btn-warning btn-sm" onclick="Pages.Courses._startProgress('${c.course_id}')">开始</button>` : ''}
                  ${c.status === 'in_progress' ? `<button class="btn btn-outline btn-sm" onclick="Pages.Courses._complete('${c.course_id}')">完成</button>` : ''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="pagination" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;font-size:13px">
          <span>共 ${courses.length} 条</span>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-outline" onclick="Pages.Courses._page=1;Pages.Courses._renderList()" ${this._page===1?'disabled':''}>««</button>
            <button class="btn btn-sm btn-outline" onclick="Pages.Courses._page--;Pages.Courses._renderList()" ${this._page===1?'disabled':''}>«</button>
            <span style="padding:6px 10px;font-size:12px">${this._page} / ${totalPages}</span>
            <button class="btn btn-sm btn-outline" onclick="Pages.Courses._page++;Pages.Courses._renderList()" ${this._page===totalPages?'disabled':''}>»</button>
            <button class="btn btn-sm btn-outline" onclick="Pages.Courses._page=${totalPages};Pages.Courses._renderList()" ${this._page===totalPages?'disabled':''}>»»</button>
          </div>
        </div>
      </div>`;
  },

  _openCreate() { this._view = 'create'; this._renderForm(null); },
  _openEdit(id) { this._view = 'edit'; this._editId = id; this._renderForm(id); },

  _renderForm(courseId) {
    const el = document.getElementById('mainContent');
    if (!el) return;  // 防御：shell 未渲染时不执行
    const course = courseId ? Store.find('courses', 'course_id', courseId) : null;
    const isNew = !course;
    const c = course || { course_id:'', title:'', description:'', type:'online', tags:[], trainer_ids:[], schedule:[], price_original:0, funding_eligible:false, exam_config:{method:'online',pass_score:60}, status:'draft' };
    const allTrainers = Store.users().filter(u => u.role === 'Trainer');

    el.innerHTML = `
      <button class="btn btn-outline btn-sm" style="margin-bottom:16px" onclick="Pages.Courses._view='list';Pages.Courses._renderList();Router.navigate('courses')">← 返回列表</button>
      <div class="form-card">
        <h2>${isNew ? '➕ 新增课程' : '✏️ 编辑课程 ' + c.course_id}</h2>
        <div class="form-row">
          <div class="form-group"><label>标题 <span class="required">*</span></label><input type="text" id="cTitle" value="${Utils.escape(c.title)}"></div>
          <div class="form-group"><label>类型</label><select id="cType">${['online','offline','hybrid'].map(t => `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('')}</select></div>
        </div>
        <div class="form-group"><label>描述</label><textarea id="cDesc" rows="4">${Utils.escape(c.description||'')}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label>原价 <span class="required">*</span></label><input type="number" id="cPrice" value="${c.price_original}" min="0" step="100"></div>
          <div class="form-group"><label>考试方式</label><select id="cExamMethod"><option value="online" ${c.exam_config?.method==='online'?'selected':''}>线上</option><option value="offline" ${c.exam_config?.method==='offline'?'selected':''}>线下</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>及格分数</label><input type="number" id="cPassScore" value="${c.exam_config?.pass_score||60}" min="0" max="100"></div>
          <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="cTags" value="${(c.tags||[]).join(', ')}"></div>
        </div>
        <div class="form-group"><label>讲师</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${allTrainers.map(t => `<label style="font-weight:400;font-size:13px"><input type="checkbox" value="${t.user_id}" ${(c.trainer_ids||[]).includes(t.user_id)?'checked':''}> ${t.name} (${t.subjects?.join(',')||''})</label>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>课程安排</label>
          <div id="scheduleList">${(c.schedule||[]).map((s,i) => `<div class="schedule-item" style="display:flex;gap:8px;margin-bottom:8px"><input type="date" value="${s.date}" class="sDate"><input type="text" value="${s.time}" placeholder="09:00-12:00" class="sTime"><button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button></div>`).join('')}</div>
          <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="Pages.Courses._addSchedule()">+ 添加课时</button>
        </div>
        <div class="form-group"><label><input type="checkbox" id="cFunding" ${c.funding_eligible?'checked':''}> 可申请 Funding 资助</label></div>
        <div class="form-actions">
          <button class="btn btn-outline" onclick="Pages.Courses._save(false)">💾 保存草稿</button>
          <button class="btn btn-primary" onclick="Pages.Courses._save(true)">📢 保存并发布</button>
          <button class="btn btn-outline" style="color:var(--muted)" onclick="Pages.Courses._view='list';Pages.Courses._renderList()">取消</button>
        </div>
      </div>`;
  },

  _addSchedule() {
    const div = document.createElement('div');
    div.className = 'schedule-item';
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
    div.innerHTML = '<input type="date" class="sDate"><input type="text" value="09:00-12:00" class="sTime"><button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>';
    document.getElementById('scheduleList').appendChild(div);
  },

  _collectForm() {
    const title = document.getElementById('cTitle').value.trim();
    if (!title) { Utils.toast('请填写课程标题', 'error'); return null; }
    const price = parseInt(document.getElementById('cPrice').value) || 0;
    const tags = document.getElementById('cTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const trainerIds = [...document.querySelectorAll('#mainContent input[type=checkbox]:checked')]
      .filter(cb => cb.value && cb.value !== 'on')
      .map(cb => cb.value);
    const scheduleItems = [...document.querySelectorAll('#scheduleList .schedule-item')];
    const schedule = scheduleItems.map(item => {
      const d = item.querySelector('.sDate').value;
      const t = item.querySelector('.sTime').value;
      return d && t ? { date: d, time: t } : null;
    }).filter(Boolean);

    return {
      title, description: document.getElementById('cDesc').value.trim(),
      type: document.getElementById('cType').value,
      price_original: price,
      funding_eligible: document.getElementById('cFunding').checked,
      exam_config: { method: document.getElementById('cExamMethod').value, pass_score: parseInt(document.getElementById('cPassScore').value) || 60 },
      tags, trainer_ids: trainerIds, schedule
    };
  },

  _save(publish) {
    const data = this._collectForm();
    if (!data) return;

    if (this._view === 'create') {
      const c = Store.nextId('courses');
      const id = Utils.genId('C', c);
      const course = { course_id: id, ...data, status: publish ? 'published' : 'draft', version: 1, created_at: Utils.now(), updated_at: Utils.now() };
      Store.insert('courses', course);
      Utils.toast(`课程 ${id} 已${publish?'发布':'保存为草稿'}`, 'success');
    } else {
      const updates = { ...data };
      if (publish) updates.status = 'published';
      Store.update('courses', 'course_id', this._editId, updates);
      Utils.toast(`课程 ${this._editId} 已更新`, 'success');
    }
    EventBus.emit(EVENTS.COURSE_UPDATED);
    this._view = 'list';
    this._renderList();
    Router.navigate('courses');
  },

  _publish(id) { Store.update('courses', 'course_id', id, { status: 'published', updated_at: Utils.now() }); EventBus.emit(EVENTS.COURSE_UPDATED); this._renderList(); Utils.toast('已发布', 'success'); },
  _startProgress(id) { Store.update('courses', 'course_id', id, { status: 'in_progress' }); EventBus.emit(EVENTS.COURSE_UPDATED); this._renderList(); Utils.toast('课程已开始', 'success'); },
  _complete(id) { Store.update('courses', 'course_id', id, { status: 'completed' }); EventBus.emit(EVENTS.COURSE_UPDATED); this._renderList(); Utils.toast('课程已完成', 'success'); },
};
