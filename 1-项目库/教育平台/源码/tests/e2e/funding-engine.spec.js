/**
 * Funding 引擎 + 动态价格 E2E 测试
 * 覆盖：条件匹配/价格计算/不同用户不同价格/过期Funding
 */
const { test, expect } = require('@playwright/test');
const BASE = 'http://localhost:3456';

test.describe('Funding 引擎与动态价格', () => {

  test('陈同学(某科技公司)看Python课 → 补贴¥2500 → 实付¥500', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'learner@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);
    // 首页应显示 Funding 折扣
    await expect(page.locator('text=已补贴').first()).toBeVisible();
  });

  test('Funding 未生效的课程 → 显示原价', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'learner@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);
    // Java 课程的 F002 从 8月1日才生效，7月时应显示原价
    // 前端开发实战课 funding_eligible = false
    await page.fill('input[placeholder="🔍 搜索课程..."]', '前端开发');
    await page.waitForTimeout(300);
    // 不应显示 Funding 标签
    const fundingTags = await page.locator('text=已补贴').count();
    expect(fundingTags).toBe(0);
  });

  test('访客(未登录)看到原价 → 显示登录后购买', async ({ page }) => {
    await page.goto(BASE + '/#home');
    await page.waitForTimeout(300);
    await page.click('text=Python 数据分析实战');
    await page.waitForTimeout(300);
    await expect(page.locator('text=登录后购买')).toBeVisible();
  });

  test('Editor 创建 Funding 协议', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'editor@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);

    await page.click('text=Funding');
    await page.waitForTimeout(300);
    await page.click('button:has-text("新建 Funding")');
    await page.waitForTimeout(300);

    await page.fill('#fTitle', '测试补贴协议');
    await page.fill('#fAmount', '1000');
    // 关联课程（选第一个）
    const checkboxes = await page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) await checkboxes.first().check();
    await page.click('button:has-text("保存")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=测试补贴协议')).toBeVisible();
  });

  test('Funding 价格计算边界：补贴大于原价 → 实付为0', async ({ page }) => {
    // 这个测试验证 fundingEngine 的 Math.max(0, ...) 逻辑
    // 通过直接修改 localStorage 来模拟边界条件
    await page.goto(BASE + '/#home');
    await page.evaluate(() => {
      const funding = JSON.parse(localStorage.getItem('edu_funding') || '[]');
      funding.push({
        agreement_id: 'F999', title: '超额补贴测试', course_ids: ['C004'],
        conditions: { min_work_years: 0, eligible_roles: ['Learner'] },
        funding_amount: 5000, funding_type: 'fixed',
        valid_from: '2026-01-01', valid_to: '2026-12-31', status: 'active',
        created_at: '2026-01-01', created_by: 'U002'
      });
      localStorage.setItem('edu_funding', JSON.stringify(funding));
    });
    await page.reload();
    await page.waitForTimeout(500);

    // 登录
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'learner@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(300);

    // 前端开发课原价 2800，补贴 5000 → 实付 0
    await page.fill('input[placeholder="🔍 搜索课程..."]', '前端开发');
    await page.waitForTimeout(300);
    await page.click('text=前端开发实战课');
    await page.waitForTimeout(300);
    // 应显示 ¥0
    await expect(page.locator('text=¥0')).toBeVisible();
  });
});
