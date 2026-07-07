// ===== Hash 路由 =====
const Router = {
  _routes: {},      // { 'home': fn, ... }
  _currentRoute: '',
  _params: {},

  register(name, fn) {
    this._routes[name] = fn;
    return this;
  },

  navigate(name, params = {}) {
    this._params = params;
    const hash = '#' + name;
    // 避免重复触发 hashchange
    if (window.location.hash === hash) {
      this._run(name, params);
    } else {
      window.location.hash = hash;
    }
  },

  _run(name, params) {
    // 'home' 和 'login' 始终可访问
    if (name !== 'home' && name !== 'login' && !Auth.canAccess(name)) {
      if (Auth.isLoggedIn) { Router.navigate('dashboard'); return; }
      else { Utils.toast('请先登录', 'error'); Router.navigate('login'); return; }
    }

    const fn = this._routes[name];
    if (fn) {
      this._currentRoute = name;
      this._params = params;
      fn(params);
    } else {
      this._routes['home'](params);
    }
  },

  start() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'home';
      // 解析 params（从 sessionStorage 取，因为 hash 不支持传复杂对象）
      const params = JSON.parse(sessionStorage.getItem('_routeParams') || '{}');
      sessionStorage.removeItem('_routeParams');
      this._run(hash, params);
    });
    const initHash = window.location.hash.slice(1) || 'home';
    if (initHash !== 'home') window.location.hash = '#home';
    else this._run('home', {});
  },

  go(name, params = {}) {
    if (Object.keys(params).length > 0) {
      sessionStorage.setItem('_routeParams', JSON.stringify(params));
    }
    this.navigate(name, params);
  },

  get current() { return this._currentRoute; },
  get params() { return this._params; },

  refresh() {
    this._run(this._currentRoute, this._params);
  },
};
