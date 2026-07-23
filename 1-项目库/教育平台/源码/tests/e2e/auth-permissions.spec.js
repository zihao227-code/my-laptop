/**
 * 认证 + 权限 E2E 测试
 * 覆盖：登录/注册/角色守卫/路由拦截/权限降级
 */
const { test, expect } = require('@playwright/test');
const BASE = 'http://localhost:3456';

test.describe('认证与权限', () => {

  test('访客只能访问首页和登录', async ({ page }) => {
    await page.goto(BASE + '/#courses');
    await page.waitForTimeout(500);
    await expect(page.locator('text=请先登录')).toBeVisible();
    // 应该被重定向到 login
    await expect(page).toHaveURL(/#login/);
  });

  test('Learner 无法访问课程管理后台', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'learner@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);
    // 直接访问 Editor 路由
    await page.goto(BASE + '/#courses');
    await page.waitForTimeout(300);
    // 应被重定向到 dashboard
    await expect(page).toHaveURL(/#dashboard/);
  });

  test('Editor 可以访问课程管理和 Funding', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'editor@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);
    // 课程管理可见
    await expect(page.locator('text=课程管理')).toBeVisible();
    // Funding 可见
    await expect(page.locator('text=Funding')).toBeVisible();
  });

  test('登录后访问 login 页应重定向到 dashboard', async ({ page }) => {
    // 先登录
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'learner@edu.cn');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(500);
    // 再尝试访问 login
    await page.goto(BASE + '/#login');
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/#dashboard/);
  });

  test('登录失败显示错误提示', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(300);
    await expect(page.locator('text=邮箱或密码错误')).toBeVisible();
  });

  test('注册+登录+退出完整流程', async ({ page }) => {
    await page.goto(BASE + '/#login');
    await page.click('text=立即注册');
    await page.fill('#regName', '权限测试员');
    await page.fill('#loginEmail', 'perm-test@test.com');
    await page.fill('#loginPassword', '123456');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(500);
    // 验证已登录
    await expect(page.locator('text=权限测试员')).toBeVisible();
    // 退出
    await page.click('button:has-text("退出")');
    await page.waitForTimeout(300);
    // 回到首页，只显示登录按钮
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
  });

  test('快速切换演示账号', async ({ page }) => {
    await page.goto(BASE + '/#login');
    // 点击 Admin 快速登录
    await page.click('button:has-text("👑 Admin")');
    await page.waitForTimeout(500);
    await expect(page.locator('text=张管理')).toBeVisible();
    await expect(page.locator('text=Admin')).toBeVisible();
  });
});
