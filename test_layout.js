// Playwright test script for layout verification
const { test, expect } = require('@playwright/test');

test.describe('Homepage Layout Test', () => {
  test('main content area aligns with sidebar', async ({ page }) => {
    // 首先启动服务器（如果还没有运行的话）
    // 然后导航到首页
    await page.goto('http://localhost:8080');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');

    // 检查主内容区域的左边距是否正确
    const mainContent = page.locator('.main-content');
    const sidebar = page.locator('.sidebar');

    // 获取计算后的样式
    const mainContentStyle = await page.evaluate(() => {
      const element = document.querySelector('.main-content');
      return window.getComputedStyle(element);
    });

    const sidebarStyle = await page.evaluate(() => {
      const element = document.querySelector('.sidebar');
      return window.getComputedStyle(element);
    });

    // 获取sidebar的宽度
    const sidebarWidth = parseInt(sidebarStyle.width);
    const mainContentMarginLeft = parseInt(mainContentStyle.marginLeft);

    // 检查主内容区域的左边距是否等于sidebar的宽度
    expect(mainContentMarginLeft).toBe(sidebarWidth);

    // 额外检查：确保没有水平溢出
    const viewportWidth = page.viewportSize().width;
    const pageWidth = await page.evaluate(() => {
      return document.body.scrollWidth;
    });

    expect(pageWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('content does not overflow horizontally', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // 检查是否有水平滚动条（表明有溢出）
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});