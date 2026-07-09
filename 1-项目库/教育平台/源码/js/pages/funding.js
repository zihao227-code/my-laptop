// ===== Funding 配置管理 v2（Editor/Admin） =====
Pages.Funding = {
  _view: 'list',
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
          <thead><tr><th>ID</th><th>协议名称</th><th>关联课程</th><th>补贴方式</th><th>预算消耗</th><th>有效期</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            ${agreements.map(a => {
              const consumed = FundingEngine.getConsumedAmount(a.agreement_id);
              const total = a.total_budget || 0;
              const remaining = total - consumed;
              const pct = total > 0 ? Math.round(consumed / total * 100) : 0;
              const courseTitles = (a.course_ids||[]).map(cid => {
                const c = courses.find(x => x.course_id === cid);
                return c ? c.title : cid;
              }).join('、');
              const typeLabel = a.funding_type === 'percentage' ? `补贴 ${a.funding_percent||0}%` : `¥${(a.funding_amount||0).toLocaleString()}/人`;
              return `<tr>
                <td>${a.agreement_id}</td><td><strong>${Utils.escape(a.title)}</strong></td>
                <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${Utils.escape(courseTitles)}">${Utils.escape(courseTitles)}</td>
                <td>${typeLabel}</td>
                <td>
                  <div style="font-size:12px">¥${consumed.toLocaleString()} / ¥${total.toLocaleString()}</div>
                  <div style="height:4px;background:var(--border);border-radius:2px;margin-top:2px;overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:${pct>80?'var(--danger)':pct>50?'var(--warning)':'var(--green)'};border-radius:2px"></div>
                  </div>
                  <div style="font-size:10px;color:${remaining<=0?'var(--danger)':'var(--muted)'};margin-top:2px">剩余 ¥${remaining.toLocaleString()}</div>
                </td>
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
    const data = a || { title:'', course_ids:[], funding_type:'fixed', funding_amount:0, funding_percent:50, total_budget:0,
      valid_from:'', valid_to:'', conditions:{min_work_years:0, eligible_roles:['Learner']} };
    const allCourses = Store.courses();
    const consumed = !isNew ? FundingEngine.getConsumedAmount(a.agreement_id) : 0;
    const remaining = !isNew ? (data.total_budget || 0) - consumed : 0;

    el.innerHTML = `
      <button class="btn btn-outline btn-sm" style="margin-bottom:16px" onclick="Pages.Funding._view='list';Pages.Funding._renderList()">← 返回列表</button>
      <div class="form-card" style="max-width:900px">
        <h2>${isNew ? '➕ 新建 Funding 协议' : '✏️ 编辑 ' + data.agreement_id}</h2>

        <div class="form-group"><label>协议名称 <span class="required">*</span></label>
          <input type="text" id="fTitle" value="${Utils.escape(data.title)}"></div>

        <!-- 补贴方式 -->
        <div class="form-row">
          <div class="form-group"><label>补贴方式 <span class="required">*</span></label>
            <select id="fType" onchange="Pages.Funding._toggleTypeFields()">
              <option value="fixed" ${data.funding_type==='fixed'?'selected':''}>固定金额（每人 ¥X）</option>
              <option value="percentage" ${data.funding_type==='percentage'?'selected':''}>百分比（补贴课程价格的 X%）</option>
            </select>
          </div>
          <div class="form-group" id="gFixedAmount">
            <label>每人补贴金额 <span class="required">*</span></label>
            <input type="number" id="fAmount" value="${data.funding_amount||0}" min="0" step="100" placeholder="例如 2500">
          </div>
          <div class="form-group hidden" id="gPercent">
            <label>补贴百分比 <span class="required">*</span></label>
            <div style="display:flex;align-items:center;gap:8px">
              <input type="number" id="fPercent" value="${data.funding_percent||50}" min="1" max="100" placeholder="50" style="width:100px">
              <span style="font-size:13px;color:var(--muted)">% （例如 50% 表示补贴课程原价的一半）</span>
            </div>
          </div>
        </div>

        <!-- 预算 -->
        <div class="form-row">
          <div class="form-group"><label>总预算额度 <span class="required">*</span></label>
            <input type="number" id="fTotalBudget" value="${data.total_budget||0}" min="0" step="1000" placeholder="例如 50000">
            ${!isNew && data.total_budget > 0 ? `
              <div style="font-size:12px;margin-top:4px">
                已消耗 <strong style="color:var(--danger)">¥${consumed.toLocaleString()}</strong>
                · 剩余 <strong style="color:${remaining>0?'var(--green)':'var(--danger)'}">¥${remaining.toLocaleString()}</strong>
              </div>` : ''}
          </div>
          <div class="form-group">
            <label>有效期</label>
            <div style="display:flex;gap:8px"><input type="date" id="fFrom" value="${data.valid_from}" style="flex:1"><span style="font-size:13px;color:var(--muted);line-height:2">~</span><input type="date" id="fTo" value="${data.valid_to}" style="flex:1"></div>
          </div>
        </div>

        <!-- 关联课程 -->
        <div class="form-group"><label>关联课程 <span class="required">*</span></label>
          <div style="border:1px solid var(--border);border-radius:6px;overflow:hidden">
            <div style="padding:8px 12px;background:#f8f9fa;display:flex;gap:8px">
              <input type="text" id="fCourseSearch" placeholder="🔍 搜索课程..." style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px" oninput="Pages.Funding._filterCourseTable()">
              <select id="fCourseType" onchange="Pages.Funding._filterCourseTable()" style="padding:6px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px;width:100px">
                <option value="">全部类型</option><option value="online">在线</option><option value="offline">线下</option><option value="hybrid">混合</option>
              </select>
              <span style="font-size:12px;color:var(--muted);line-height:2" id="fSelectedCount">已选 0</span>
            </div>
            <div style="max-height:280px;overflow-y:auto" id="fCourseList">
              ${this._renderCourseTable(allCourses, data.course_ids || [])}
            </div>
          </div>
        </div>

        <!-- 条件 -->
        <div class="form-row">
          <div class="form-group"><label>最低工作年限</label><input type="number" id="fMinYears" value="${data.conditions?.min_work_years||0}" min="0"></div>
          <div class="form-group"><label>限定公司（逗号分隔，留空不限）</label><input type="text" id="fCompanies" value="${(data.conditions?.eligible_companies||[]).join(', ')}" placeholder="如：某科技公司, 某互联网公司"></div>
        </div>

        <!-- 冲突警告区 -->
        <div id="fConflictArea"></div>

        <div class="form-actions">
          <button class="btn btn-primary" onclick="Pages.Funding._save()">💾 保存</button>
          <button class="btn btn-outline" style="color:var(--muted)" onclick="Pages.Funding._view='list';Pages.Funding._renderList()">取消</button>
        </div>
      </div>`;

    this._toggleTypeFields();
    this._checkConflicts();
  },

  _renderCourseTable(courses, selectedIds) {
    if (courses.length === 0) return '<div style="padding:16px;text-align:center;color:var(--muted);font-size:12px">无匹配课程</div>';
    // 表头 + 表体，固定列宽
    return `<div style="display:grid;grid-template-columns:34px 56px 1fr 64px 90px 68px 90px;align-items:center;font-size:12px">
      <div style="padding:6px 8px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border)">#</div>
      <div style="padding:6px 4px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border)">ID</div>
      <div style="padding:6px 4px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border)">课程名称</div>
      <div style="padding:6px 4px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);text-align:center">类型</div>
      <div style="padding:6px 4px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);text-align:right">价格</div>
      <div style="padding:6px 4px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);text-align:center">状态</div>
      <div style="padding:6px 4px;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);text-align:center">资助状态</div>
      ${courses.map(c => {
        const checked = selectedIds.includes(c.course_id);
        return `
          <div style="padding:4px 8px;border-bottom:1px solid #f1f2f6;display:flex;align-items:center;cursor:pointer"
               onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background=''">
            <input type="checkbox" value="${c.course_id}" ${checked?'checked':''} onchange="Pages.Funding._onCourseToggle()" style="margin:0">
          </div>
          <div style="padding:4px;border-bottom:1px solid #f1f2f6;color:var(--muted);cursor:pointer"
               onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background=''"
               onclick="this.previousElementSibling.querySelector('input').click()">${c.course_id}</div>
          <div style="padding:4px;border-bottom:1px solid #f1f2f6;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
               onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background=''"
               onclick="this.previousElementSibling.previousElementSibling.querySelector('input').click()" title="${Utils.escape(c.title)}">
            <span style="font-weight:600">${Utils.escape(c.title)}</span></div>
          <div style="padding:4px;border-bottom:1px solid #f1f2f6;text-align:center;cursor:pointer"
               onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background=''">${Utils.typeTag(c.type)}</div>
          <div style="padding:4px;border-bottom:1px solid #f1f2f6;text-align:right;font-weight:600;cursor:pointer"
               onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background=''">¥${c.price_original.toLocaleString()}</div>
          <div style="padding:4px;border-bottom:1px solid #f1f2f6;text-align:center;cursor:pointer;font-size:11px;color:var(--muted)"
               onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background=''">${c.status==='published'?'已发布':c.status==='draft'?'草稿':'进行中'}</div>
          <div style="padding:4px;border-bottom:1px solid #f1f2f6;text-align:center;cursor:pointer"
               onmouseover="this.style.background='#f8f9fb'" onmouseout="this.style.background=''">${this._fundingStatusBadge(c.course_id)}</div>`;
      }).join('')}
    </div>`;
  },

  _fundingStatusBadge(courseId) {
    const active = FundingEngine.getActiveFundingForCourse(courseId);
    if (active.length > 0) {
      const ids = active.map(f => f.agreement_id).join(',');
      return `<span style="font-size:10px;background:#fef9e7;color:#7d6608;padding:2px 6px;border-radius:4px;min-width:50px;text-align:center" title="已被 ${ids} 覆盖">已被资助</span>`;
    }
    return '<span style="font-size:10px;color:var(--muted);min-width:50px;text-align:center">—</span>';
  },

  _toggleTypeFields() {
    const type = document.getElementById('fType')?.value || 'fixed';
    const gFixed = document.getElementById('gFixedAmount');
    const gPct = document.getElementById('gPercent');
    if (gFixed) gFixed.classList.toggle('hidden', type !== 'fixed');
    if (gPct) gPct.classList.toggle('hidden', type !== 'percentage');
  },

  _filterCourseTable() {
    const search = (document.getElementById('fCourseSearch')?.value || '').toLowerCase();
    const type = document.getElementById('fCourseType')?.value || '';
    let courses = Store.courses();
    if (search) courses = courses.filter(c => c.title.toLowerCase().includes(search) || c.course_id.toLowerCase().includes(search));
    if (type) courses = courses.filter(c => c.type === type);
    const selected = [...document.querySelectorAll('#fCourseList input[type=checkbox]:checked')].map(cb => cb.value);
    document.getElementById('fCourseList').innerHTML = this._renderCourseTable(courses, selected);
  },

  _onCourseToggle() {
    const checkboxes = document.querySelectorAll('#fCourseList input[type=checkbox]');
    const count = [...checkboxes].filter(cb => cb.checked).length;
    const el = document.getElementById('fSelectedCount');
    if (el) el.textContent = '已选 ' + count;
    this._checkConflicts();
  },

  _getSelectedCourseIds() {
    return [...document.querySelectorAll('#fCourseList input[type=checkbox]:checked')].map(cb => cb.value);
  },

  _checkConflicts() {
    const area = document.getElementById('fConflictArea');
    if (!area) return;
    const courseIds = this._getSelectedCourseIds();
    const vFrom = document.getElementById('fFrom')?.value || '';
    const vTo = document.getElementById('fTo')?.value || '';
    const excludeId = this._view === 'edit' ? this._editId : null;

    const conflicts = FundingEngine.checkExclusivity(courseIds, vFrom, vTo, excludeId);
    if (conflicts.length === 0) { area.innerHTML = ''; return; }

    area.innerHTML = conflicts.map(c => `
      <div style="padding:10px 14px;margin-top:12px;background:#fef9e7;border-left:3px solid var(--warning);border-radius:4px;font-size:12px">
        ⚠ <strong>课程冲突</strong>：${c.overlapCourseIds.map(cid => {
          const course = Store.find('courses','course_id',cid);
          return course ? course.title : cid;
        }).join('、')} 已被协议 <strong>${Utils.escape(c.agreement.title)}</strong> (${c.agreement.valid_from}~${c.agreement.valid_to}) 覆盖。
        同一课程在重叠时间段内只能受一个 FA 资助。
      </div>
    `).join('');
  },

  _save() {
    const title = document.getElementById('fTitle').value.trim();
    if (!title) { Utils.toast('请填写协议名称', 'error'); return; }

    const fundingType = document.getElementById('fType').value;
    const totalBudget = parseInt(document.getElementById('fTotalBudget').value) || 0;
    if (!totalBudget) { Utils.toast('请填写总预算额度', 'error'); return; }

    let fundingAmount = 0, fundingPercent = 50;
    if (fundingType === 'fixed') {
      fundingAmount = parseInt(document.getElementById('fAmount').value) || 0;
      if (!fundingAmount) { Utils.toast('请填写每人补贴金额', 'error'); return; }
    } else {
      fundingPercent = parseInt(document.getElementById('fPercent').value) || 50;
    }

    const courseIds = this._getSelectedCourseIds();
    if (courseIds.length === 0) { Utils.toast('请至少选择一门课程', 'error'); return; }
    const vFrom = document.getElementById('fFrom').value || Utils.now();
    const vTo = document.getElementById('fTo').value;
    const companies = (document.getElementById('fCompanies').value || '').split(',').map(s => s.trim()).filter(Boolean);

    // 排他检查
    const excludeId = this._view === 'edit' ? this._editId : null;
    const conflicts = FundingEngine.checkExclusivity(courseIds, vFrom, vTo, excludeId);
    if (conflicts.length > 0) {
      if (!Utils.confirm('所选课程中有 ' + conflicts.length + ' 个冲突（与其他 FA 时间重叠）。确定继续保存？')) return;
    }

    const data = {
      title, funding_type: fundingType,
      funding_amount: fundingAmount,
      funding_percent: fundingPercent,
      total_budget: totalBudget,
      valid_from: vFrom, valid_to: vTo,
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
