/**
 * 测试工具库 — 供 Playwright E2E 脚本使用
 *
 * 使用方式：
 *   node tests/utils.js --reset    # 重置 localStorage 为种子数据（通过浏览器）
 *   或在 Playwright 脚本中：
 *   const { loginAs, resetSeed, assertVisible, takeScreenshot, TestReport } = require('../utils.js');
 */

// ===== 测试配置 =====
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3456',
  accounts: {
    admin:    { email: 'admin@edu.cn',    password: '123456', role: 'Admin',   name: '张管理' },
    editor:   { email: 'editor@edu.cn',   password: '123456', role: 'Editor',  name: '王编辑' },
    trainer:  { email: 'trainer@edu.cn',  password: '123456', role: 'Trainer', name: '李老师' },
    learner:  { email: 'learner@edu.cn',  password: '123456', role: 'Learner', name: '陈同学' },
    learner2: { email: 'learner2@edu.cn', password: '123456', role: 'Learner', name: '刘同学' },
  },
  timeouts: {
    default: 5000,
    payment: 4000,   // 模拟支付需要 2s 动画
    exam: 10000,     // 考试倒计时
    polling: 35000,  // 消息轮询
  }
};

// ===== 测试报告生成器 =====
class TestReport {
  constructor(name) {
    this.runId = new Date().toISOString();
    this.name = name;
    this.results = [];
    this.startTime = Date.now();
  }

  pass(id, title, duration) {
    this.results.push({ id, title, status: 'passed', duration, module: '', type: '' });
    return this;
  }

  fail(id, title, error, module, type, severity = 'P2') {
    this.results.push({ id, title, status: 'failed', error: String(error), module, type, severity, duration: 0 });
    return this;
  }

  skip(id, title, reason) {
    this.results.push({ id, title, status: 'skipped', error: reason, module: '', type: '', duration: 0 });
    return this;
  }

  finalize() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      skipped: this.results.filter(r => r.status === 'skipped').length,
      duration,
    };

    // 按模块汇总
    const byModule = {};
    const byType = {};
    this.results.forEach(r => {
      if (r.module) {
        byModule[r.module] = byModule[r.module] || { total: 0, passed: 0, failed: 0 };
        byModule[r.module].total++;
        byModule[r.module][r.status === 'passed' ? 'passed' : 'failed']++;
      }
      if (r.type) {
        byType[r.type] = (byType[r.type] || 0) + 1;
      }
    });

    const report = {
      runId: this.runId,
      name: this.name,
      summary,
      byModule,
      byType,
      failures: this.results.filter(r => r.status === 'failed'),
      all: this.results,
    };

    return report;
  }
}

// ===== Playwright 助手函数 =====
// (这些函数在 Playwright 脚本的 page 上下文中使用)

async function loginAs(page, accountKey) {
  const account = TEST_CONFIG.accounts[accountKey];
  await page.goto(TEST_CONFIG.baseUrl + '/#login');
  await page.fill('input[type="email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button:has-text("登录")');
  await page.waitForTimeout(500);
}

async function resetToHome(page) {
  await page.goto(TEST_CONFIG.baseUrl + '/#home');
  await page.waitForTimeout(300);
}

async function assertVisible(page, selector, message) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return { passed: true, message };
  } catch (e) {
    return { passed: false, message, error: `元素不可见: ${selector}` };
  }
}

async function assertText(page, text, message) {
  try {
    await page.waitForSelector(`text="${text}"`, { timeout: 5000 });
    return { passed: true, message };
  } catch (e) {
    return { passed: false, message, error: `文本未找到: "${text}"` };
  }
}

async function assertUrl(page, expected, message) {
  const url = page.url();
  const passed = url.includes(expected);
  return { passed, message, error: passed ? null : `URL 不匹配: 期望包含 "${expected}", 实际 "${url}"` };
}

async function screenshot(page, name) {
  const path = `tests/results/screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}

// ===== 导出 =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEST_CONFIG, TestReport, loginAs, resetToHome, assertVisible, assertText, assertUrl, screenshot };
}
