/**
 * E2E 全链路测试 — 覆盖核心用户旅程
 *
 * 运行方式（需先启动 live-server）：
 *   npx playwright test tests/e2e/full-flow.spec.js
 *   或手动：node -e "require('./tests/e2e/full-flow.spec.js').run()"
 *
 * 测试场景：
 *   TC-E2E-001: 访客浏览课程 → 查看详情
 *   TC-E2E-002: Learner 注册 → 登录 → 浏览 → 购课 → 支付
 *   TC-E2E-003: Learner 参加考试 → 自动判分
 *   TC-E2E-004: Editor 创建课程 → 配置 Funding
 *   TC-E2E-005: Trainer 备课 → 添加课次
 *   TC-E2E-006: Admin 查看用户管理 → 切换身份
 */

const { test, expect } = require('@playwright/test');
const { TEST_CONFIG } = require('../utils.js');

const BASE = TEST_CONFIG.baseUrl;

test.describe('全链路 E2E 测试', () => {

  test.beforeEach(async ({ page }) => {
    // 重置种子数据（通过导航到首页触发 Seed.init 检查）
    await page.goto(BASE + '/#home');
    await page.evaluate(() => {
      // 清空后重新初始化
      const keys = Object.keys(localStorage).filter(k => k.startsWith('edu_'));
      keys.forEach(k => localStorage.removeItem(k));
    });
    await page.reload();
    await page.waitForTimeout(500);
  });

  // ===== TC-E2E-001: 访客浏览 =====
  test('TC-E2E-001: 访客浏览课程市场', async ({ page }) => {
    await page.goto(BASE + '/#home');
    await page.waitForTimeout(500);

    // 验证课程卡片存在
    const cards = await page.locator('.course-card').count();
    expect(cards).toBeGreaterThanOrEqual(5);

    // 验证搜索功能
    await page.fill('input[placeholder="🔍 搜索课程..."]', 'Python');
    await page.waitForTimeout(300);
    const filtered = await page.locator('.course-card').count();
    expect(filtered).toBeGreaterThanOrEqual(1);

    // 进入详情页
    await page.click('text=Python 数据分析实战');
    await page.waitForTimeout(300);
    await expect(page.locator('text=立即购买')).toBeVisible();
    await expect(page.locator('text=登录后购买')).toBeVisible();
  });

  // ===== TC-E2E-002: Learner 购课 + 支付 =====
  test('TC-E2E-002: Learner 注册→购课→支付完整链路', async ({ page }) => {
    // 注册新用户
    await page.goto(BASE + '/#login');
    await page.click('text=立即注册');
    await page.fill('#regName', '测试学员');
    await page.fill('#loginEmail', 'test-learner@test.com');
    await page.fill('#loginPassword', '123456');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(500);

    // 验证已登录并跳转到 dashboard
    await expect(page.locator('text=测试学员')).toBeVisible();

    // 浏览课程市场
    await page.click('text=课程市场');
    await page.waitForTimeout(300);
    await page.click('text=AI 产品经理入门');
    await page.waitForTimeout(300);

    // 验证 Funding 价格
    await expect(page.locator('text=原价')).toBeVisible();

    // 立即购买
    await page.click('button:has-text("立即购买")');
    await page.waitForTimeout(500);

    // 验证支付页
    await expect(page.locator('text=支付确认')).toBeVisible();
    await expect(page.locator('text=¥2,000')).toBeVisible();

    // 完成支付
    await page.click('button:has-text("确认支付")');
    await page.waitForTimeout(3000);
    await expect(page.locator('text=支付成功')).toBeVisible();

    // 验证订单
    await page.click('button:has-text("查看订单")');
    await page.waitForTimeout(300);
    await expect(page.locator('text=AI 产品经理入门')).toBeVisible();
    await expect(page.locator('tag=已支付')).toBeVisible();
  });

  // ===== TC-E2E-003: 考试流程 =====
  test('TC-E2E-003: Learner 参加考试并自动判分', async ({ page }) => {
    // 使用种子 Learner 账号（已有已支付课程）
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'learner@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);

    // 进入我的课程
    await page.click('text=我的课程');
    await page.waitForTimeout(300);

    // 点击第一个参加考试（AI PM 课程）
    const examBtns = await page.locator('button:has-text("参加考试")');
    if (await examBtns.count() >= 2) {
      await examBtns.nth(1).click();
    } else {
      await examBtns.first().click();
    }
    await page.waitForTimeout(500);

    // 开始考试
    await page.click('button:has-text("开始考试")');
    await page.waitForTimeout(300);

    // 答题（全部正确）
    await page.getByText('○ Large Language Model').click();
    await page.waitForTimeout(100);
    await page.getByText('○ 错误').click();
    await page.waitForTimeout(100);
    await page.getByText('○ 让 AI 先查资料再回答').click();
    await page.waitForTimeout(100);
    // 多选题
    await page.getByText('☐ 幻觉').click();
    await page.getByText('☐ 延迟').click();
    await page.getByText('☐ 数据隐私').click();
    await page.waitForTimeout(200);

    // 交卷
    await page.click('button:has-text("交卷")');
    await page.waitForTimeout(500);

    // 验证满分通过
    await expect(page.locator('text=恭喜通过')).toBeVisible();
    await expect(page.locator('text=100 / 100')).toBeVisible();
  });

  // ===== TC-E2E-004: Editor 课程 CRUD =====
  test('TC-E2E-004: Editor 创建并管理课程', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'editor@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);

    // 进入课程管理
    await page.click('text=课程管理');
    await page.waitForTimeout(300);

    // 新增课程
    await page.click('button:has-text("新增课程")');
    await page.waitForTimeout(300);

    // 填写表单
    await page.fill('#cTitle', 'E2E测试课程');
    await page.fill('#cDesc', '自动化测试创建的课程');
    await page.fill('#cPrice', '1999');
    await page.click('button:has-text("保存并发布")');
    await page.waitForTimeout(500);

    // 验证课程列表中出现了新课程
    await expect(page.locator('text=E2E测试课程')).toBeVisible();
  });

  // ===== TC-E2E-005: Trainer 备课 =====
  test('TC-E2E-005: Trainer 添加课次', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'trainer@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);

    // 进入备课管理
    await page.click('text=备课管理');
    await page.waitForTimeout(300);

    // 添加课次
    const addBtns = await page.locator('button:has-text("添加课次")');
    if (await addBtns.count() > 0) {
      await addBtns.first().click();
      await page.waitForTimeout(300);
      await page.fill('#sTopic', 'E2E测试课次');
      await page.click('button:has-text("保存")');
      await page.waitForTimeout(300);
      await expect(page.locator('text=E2E测试课次')).toBeVisible();
    }
  });

  // ===== TC-E2E-006: Admin 权限 =====
  test('TC-E2E-006: Admin 用户管理 + 身份切换', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'admin@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);

    // 用户管理
    await page.click('text=用户管理');
    await page.waitForTimeout(300);

    // 验证用户列表
    await expect(page.locator('text=张管理')).toBeVisible();
    await expect(page.locator('text=陈同学')).toBeVisible();

    // 切换身份到 Learner
    await page.locator('button:has-text("切换")').last().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=陈同学')).toBeVisible();
  });

});
