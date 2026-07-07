// ===== Funding 配置管理（Editor/Admin） =====
Pages.Funding = {
  _view: 'list', // 'list' | 'create' | 'edit'
  _editId: null,

  render() {
    window.renderShell();
    this._view = 'list';
    this._renderContent();
  },

  _renderContent() {
    if (this._view === 'list') this._renderList();
    else this._renderForm();
  },

  _renderList() {
    const el = document.getElementById('mainContent');
    const agreements = Store.funding();
    const courses = Store.courses();

    el.innerHTML = `
      <div class="toolbar">
        <span class="spacer"></span>
        <button class="btn btn-primary" onclick="Pages.Funding._openCreate()">+ 新建 Funding 协议</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>协议名称</th><th>关联课程</th><th>补贴金额</th><th>有效期</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            ${agreements.map(a => {
              const courseTitles = (a.course_ids||[]).map(cid => {
                const c = courses.find(x => x.course_id === cid);
                return c ? c.title : cid;
              }).join(', ');
              return `<tr>
                <td>${a.agreement_id}</td><td><strong>${Utils.escape(a.title)}</strong></td>
                <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${Utils.escape(courseTitles)}</td>
                <td>${Utils.formatPrice(a.funding_amount)}</td>
                <td>${a.valid_from} ~ ${a.valid_to}</td>
                <td>${Utils.statusTag(a.status)}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="Pages.Funding._openEdit('${a.agreement_id}')">✏️</button>
                  ${a.status !== 'revoked' ? `<button class="btn btn-danger btn-sm" onclick="Pages.Funding._revoke('${a.agreement_id}')">撤销</button>` : ''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  _openCreate() { this._view = 'create'; this._editId = null; this._renderForm(); },
  _openEdit(id) { this._view = 'edit'; this._editId = id; this._renderForm(); },

  _renderForm() {
    const el = document.getElementById('mainContent');
    const isNew = this._view === 'create';
    const a = !isNew ? Store.find('funding', 'agreement_id', this._editId) : null;
    const data = a || { title:'', course_ids:[], funding_amount:0, funding_type:'fixed', valid_from:'', valid_to:'', conditions:{min_work_years:0,eligible_roles:['Learner']} };
    const allCourses = Store.courses();

    el.innerHTML = `
      <button class="btn btn-outline btn-sm" style="margin-bottom:16px" onclick="Pages.Funding._view='list';Pages.Funding._renderList()">← 返回列表</button>
      <div class="form-card">
        <h2>${isNew ? '➕ 新建 Funding 协议' : '✏️ 编辑 ' + data.agreement_id}</h2>
        <div class="form-group"><label>协议名称 <span class="required">*</span></label><input type="text" id="fTitle" value="${Utils.escape(data.title)}"></div>
        <div class="form-row">
          <div class="form-group"><label>补贴金额 <span class="required">*</span></label><input type="number" id="fAmount" value="${data.funding_amount}" min="0" step="100"></div>
          <div class="form-group"><label>补贴类型</label><select id="fType"><option value="fixed" ${data.funding_type==='fixed'?'selected':''}>固定金额</option><option value="percentage" ${data.funding_type==='percentage'?'selected':''}>百分比</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>生效日期</label><input type="date" id="fFrom" value="${data.valid_from}"></div>
          <div class="form-group"><label>到期日期</label><input type="date" id="fTo" value="${data.valid_to}"></div>
        </div>
        <div class="form-group"><label>关联课程</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;max-height:200px;overflow-y:auto;padding:8px;border:1px solid var(--border);border-radius:6px">
            ${allCourses.map(c => `<label style="font-weight:400;font-size:13px;display:block"><input type="checkbox" value="${c.course_id}" ${(data.course_ids||[]).includes(c.course_id)?'checked':''}> ${c.course_id} ${Utils.escape(c.title)} — ${Utils.formatPrice(c.price_original)}</label>`).join('')}
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>最低工作年限</label><input type="number" id="fMinYears" value="${data.conditions?.min_work_years||0}" min="0"></div>
          <div class="form-group"><label>限定公司（逗号分隔，留空不限）</label><input type="text" id="fCompanies" value="${(data.conditions?.eligible_companies||[]).join(', ')}" placeholder="如：某科技公司, 某互联网公司"></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" onclick="Pages.Funding._save()">💾 保存</button>
          <button class="btn btn-outline" style="color:var(--muted)" onclick="Pages.Funding._view='list';Pages.Funding._renderList()">取消</button>
        </div>
      </div>`;
  },

  _save() {
    const title = document.getElementById('fTitle').value.trim();
    const amount = parseInt(document.getElementById('fAmount').value) || 0;
    if (!title || !amount) { Utils.toast('请填写协议名称和补贴金额', 'error'); return; }

    const courseIds = [...document.querySelectorAll('#mainContent input[type=checkbox]:checked')].map(cb => cb.value);
    const companies = document.getElementById('fCompanies').value.split(',').map(s => s.trim()).filter(Boolean);

    const data = {
      title, funding_amount: amount,
      funding_type: document.getElementById('fType').value,
      valid_from: document.getElementById('fFrom').value || Utils.now(),
      valid_to: document.getElementById('fTo').value,
      course_ids: courseIds,
      conditions: {
        min_work_years: parseInt(document.getElementById('fMinYears').value) || 0,
        eligible_roles: ['Learner'],
        ...(companies.length > 0 ? { eligible_companies: companies } : {})
      }
    };

    if (this._view === 'create') {
      const c = Store.nextId('funding');
      const agreement = { agreement_id: Utils.genId('F', c), ...data, status: 'active', created_at: Utils.now(), created_by: Auth.currentUser.user_id };
      Store.insert('funding', agreement);
      Utils.toast('Funding 协议已创建', 'success');
      // 更新课程的 funding_eligible
      courseIds.forEach(cid => Store.update('courses', 'course_id', cid, { funding_eligible: true }));
    } else {
      Store.update('funding', 'agreement_id', this._editId, data);
      Utils.toast('已更新', 'success');
    }
    EventBus.emit(EVENTS.FUNDING_CHANGED);
    this._view = 'list';
    this._renderList();
  },

  _revoke(id) {
    if (!Utils.confirm('确定撤销此 Funding 协议？')) return;
    Store.update('funding', 'agreement_id', id, { status: 'revoked' });
    EventBus.emit(EVENTS.FUNDING_CHANGED);
    this._renderList();
    Utils.toast('已撤销', 'success');
  }
};
