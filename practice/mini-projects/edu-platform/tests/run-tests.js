#!/usr/bin/env node
/**
 * 测试运行器 — 执行所有 E2E 测试并生成 latest.json
 *
 * 使用：
 *   node tests/run-tests.js              # 运行全部测试
 *   node tests/run-tests.js --quick      # 快速模式，只跑核心链路
 *   node tests/run-tests.js --module=auth # 只跑指定模块
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');
const LATEST_FILE = path.join(RESULTS_DIR, 'latest.json');
const HISTORY_FILE = path.join(RESULTS_DIR, 'history.json');

// 确保目录存在
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');

function runPlaywright(specFile) {
  try {
    const result = execSync(`npx playwright test ${specFile} --reporter=json`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      timeout: 120000,
    });
    return JSON.parse(result || '{}');
  } catch (e) {
    return { error: e.message, stdout: e.stdout?.toString(), stderr: e.stderr?.toString() };
  }
}

function parseResults(playwrightOutput) {
  const suites = playwrightOutput.suites || [];
  const results = [];
  let total = 0, passed = 0, failed = 0, skipped = 0;

  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        total++;
        const res = test.results?.[0] || {};
        const status = res.status; // 'passed' | 'failed' | 'skipped'
        if (status === 'passed') passed++;
        else if (status === 'failed') failed++;
        else skipped++;

        // 从测试标题解析模块
        const title = test.title || '';
        let module = '其他';
        if (title.includes('认证') || title.includes('登录') || title.includes('权限')) module = '认证权限';
        else if (title.includes('课程') || title.includes('CRUD') || title.includes('Editor')) module = '课程管理';
        else if (title.includes('Funding') || title.includes('价格') || title.includes('补贴')) module = 'Funding引擎';
        else if (title.includes('考试') || title.includes('判分') || title.includes('答题')) module = '考试系统';
        else if (title.includes('支付') || title.includes('订单')) module = '交易支付';
        else if (title.includes('消息')) module = '消息系统';
        else if (title.includes('浏览') || title.includes('访客')) module = '官网浏览';
        else if (title.includes('备课') || title.includes('Trainer')) module = '备课管理';
        else if (title.includes('Admin') || title.includes('用户管理')) module = '用户管理';

        let type = '功能验证';
        if (res.error?.message?.includes('timeout')) type = '性能/超时';
        else if (res.error?.message?.includes('visible')) type = 'UI渲染';
        else if (res.error?.message?.includes('URL')) type = '路由导航';
        else if (status === 'failed') type = '逻辑错误';

        results.push({
          id: title.split(':')[0] || title,
          title,
          status,
          duration: res.duration || 0,
          module,
          type,
          severity: status === 'failed' ? 'P2' : '',
          error: res.error?.message || '',
        });
      }
    }
  }

  return { total, passed, failed, skipped, results };
}

function generateReport(allResults, duration) {
  const summary = {
    total: allResults.reduce((s, r) => s + r.total, 0),
    passed: allResults.reduce((s, r) => s + r.passed, 0),
    failed: allResults.reduce((s, r) => s + r.failed, 0),
    skipped: allResults.reduce((s, r) => s + r.skipped, 0),
    duration,
  };

  const all = allResults.flatMap(r => r.results);

  // 按模块汇总
  const byModule = {};
  all.forEach(r => {
    byModule[r.module] = byModule[r.module] || { total: 0, passed: 0, failed: 0 };
    byModule[r.module].total++;
    r.status === 'passed' ? byModule[r.module].passed++ : byModule[r.module].failed++;
  });

  // 按类型汇总
  const byType = {};
  all.filter(r => r.status === 'failed').forEach(r => {
    byType[r.type] = (byType[r.type] || 0) + 1;
  });

  return {
    runId: new Date().toISOString(),
    timestamp: Date.now(),
    summary,
    byModule,
    byType,
    failures: all.filter(r => r.status === 'failed'),
    all,
  };
}

function saveReport(report) {
  fs.writeFileSync(LATEST_FILE, JSON.stringify(report, null, 2));

  // 追加到历史
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try { history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')); } catch(e) {}
  }
  history.push({
    runId: report.runId,
    summary: report.summary,
    byModule: report.byModule,
  });
  // 只保留最近 20 次
  if (history.length > 20) history = history.slice(-20);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// ===== 主流程 =====
console.log('🧪 测试运行器启动...\n');

const startTime = Date.now();
const specFiles = isQuick
  ? ['tests/e2e/full-flow.spec.js']
  : fs.readdirSync(path.join(__dirname, 'e2e')).filter(f => f.endsWith('.spec.js')).map(f => `tests/e2e/${f}`);

console.log(`📋 将运行 ${specFiles.length} 个测试套件\n`);

const allResults = [];
for (const spec of specFiles) {
  console.log(`  ▶ ${path.basename(spec)}`);
  const output = runPlaywright(spec);
  const parsed = parseResults(output);
  allResults.push(parsed);
  console.log(`    ${parsed.passed} ✅ / ${parsed.failed} ❌ / ${parsed.skipped} ⏭\n`);
}

const duration = Math.round((Date.now() - startTime) / 1000);
const report = generateReport(allResults, duration);
saveReport(report);

console.log('═'.repeat(50));
console.log(`📊 测试报告已生成`);
console.log(`  总计: ${report.summary.total}  |  ✅ ${report.summary.passed}  |  ❌ ${report.summary.failed}  |  ⏭ ${report.summary.skipped}`);
console.log(`  耗时: ${duration}s`);
console.log(`  报告: tests/results/latest.json`);
console.log(`  仪表盘: test-dashboard.html`);
console.log('═'.repeat(50));

// 如果有失败，以非零退出码退出
if (report.summary.failed > 0) process.exit(1);
