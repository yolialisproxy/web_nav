const { test, expect } = require('@playwright/test');

test.describe('Homepage Layout Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('main content area aligns with sidebar', async ({ page }) => {
    // 检查主内容区域的左边距是否等于sidebar的宽度
    const sidebarWidth = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      return parseInt(window.getComputedStyle(sidebar).width);
    });

    const mainContentMarginLeft = await page.evaluate(() => {
      const mainContent = document.querySelector('.main-content');
      return parseInt(window.getComputedStyle(mainContent).marginLeft);
    });

    expect(mainContentMarginLeft).toBe(sidebarWidth);
  });

  test('content does not overflow horizontally', async ({ page }) => {
    // 检查是否有水平滚动条（表明有溢出）
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});