// ===== localStorage 数据层 =====
const Store = {
  _cache: {},

  load(key) {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; }
    catch (e) { return null; }
  },

  save(key, data) { localStorage.setItem(key, JSON.stringify(data)); },

  // ===== 通用实体操作 =====
  all(entity) {
    const key = 'edu_' + entity;
    if (this._cache[key]) return this._cache[key];
    const data = this.load(key) || [];
    this._cache[key] = data;
    return data;
  },

  reload(entity) {
    const key = 'edu_' + entity;
    const data = this.load(key) || [];
    this._cache[key] = data;
    return data;
  },

  flush(entity) {
    const key = 'edu_' + entity;
    this.save(key, this._cache[key] || []);
    this._cache[key] = null; // invalidate
  },

  find(entity, idField, id) {
    return this.all(entity).find(item => item[idField] === id);
  },

  filter(entity, fn) {
    return this.all(entity).filter(fn);
  },

  insert(entity, item) {
    const list = this.all(entity);
    list.push(item);
    this.flush(entity);
  },

  update(entity, idField, id, updates) {
    const list = this.all(entity);
    const idx = list.findIndex(item => item[idField] === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates, updated_at: Utils.now() };
    this.flush(entity);
    return true;
  },

  remove(entity, idField, id) {
    const list = this.all(entity);
    const idx = list.findIndex(item => item[idField] === id);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.flush(entity);
    return true;
  },

  nextId(entity) {
    const key = 'edu_counters';
    const counters = this.load(key) || {};
    counters[entity] = (counters[entity] || 0) + 1;
    this.save(key, counters);
    return counters[entity];
  },

  // ===== 便捷方法 =====
  users() { return this.all('users'); },
  courses() { return this.all('courses'); },
  funding() { return this.all('funding'); },
  orders() { return this.all('orders'); },
  payments() { return this.all('payments'); },
  sessions() { return this.all('sessions'); },
  exams() { return this.all('exams'); },
  scores() { return this.all('scores'); },
  notifications() { return this.all('notifications'); },

  // 课程已发布
  publishedCourses() {
    return this.all('courses').filter(c => c.status === 'published' || c.status === 'in_progress');
  },

  // 活跃的 Funding 协议
  activeFunding() {
    return this.all('funding').filter(f => f.status === 'active');
  },

  // 用户的订单
  userOrders(userId) {
    return this.all('orders').filter(o => o.user_id === userId);
  },

  // 用户已支付的订单
  paidOrders(userId) {
    return this.all('orders').filter(o => o.user_id === userId && o.status === 'paid');
  },

  // Trainer 被分配的课程
  trainerCourses(trainerId) {
    return this.all('courses').filter(c => (c.trainer_ids || []).includes(trainerId));
  }
};
