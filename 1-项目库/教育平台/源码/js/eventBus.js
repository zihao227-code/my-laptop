// ===== 事件总线 (发布订阅) =====
const EventBus = {
  _events: {},

  on(event, fn) {
    (this._events[event] = this._events[event] || []).push(fn);
    return () => this.off(event, fn); // 返回取消订阅函数
  },

  off(event, fn) {
    if (!this._events[event]) return;
    this._events[event] = this._events[event].filter(f => f !== fn);
  },

  emit(event, data) {
    (this._events[event] || []).forEach(fn => fn(data));
  }
};

// ===== 全局事件常量 =====
const EVENTS = {
  ORDER_CREATED: 'order:created',
  PAYMENT_COMPLETED: 'payment:completed',
  COURSE_UPDATED: 'course:updated',
  FUNDING_CHANGED: 'funding:changed',
  EXAM_SUBMITTED: 'exam:submitted',
  NOTIFICATION_ADDED: 'notification:added',
  AUTH_CHANGED: 'auth:changed',
};
