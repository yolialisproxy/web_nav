// 特别检查.loading元素
const { chromium } = require('playwright');

(async () => {
  // 启动浏览器
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 导航到本地服务器
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // 等待一下确保页面完全渲染
    await page.waitForTimeout(1000);

    // 检查.loading元素的详细信息
    const loadingInfo = await page.evaluate(() => {
      const loading = document.querySelector('.loading');
      if (!loading) return { found: false };

      const style = window.getComputedStyle(loading);
      const rect = loading.getBoundingClientRect();

      return {
        found: true,
        // 基本布局
        width: style.width,
        height: style.height,
        marginTop: style.marginTop,
        marginRight: style.marginRight,
        marginBottom: style.marginBottom,
        marginLeft: style.marginLeft,
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        // 定位
        left: style.left,
        right: style.right,
        top: style.top,
        bottom: style.bottom,
        position: style.position,
        // 显示
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        // 实际位置和尺寸
        actualLeft: rect.left,
        actualTop: rect.top,
        actualWidth: rect.width,
        actualHeight: rect.height
      };
    });

    console.log('=== .loading元素详细信息 ===');
    if (loadingInfo.found) {
      console.log(`找到.loading元素:`);
      console.log(`  尺寸: ${loadingInfo.actualWidth}x${loadingInfo.actualHeight}`);
      console.log(`  位置: (${loadingInfo.actualTop}, ${loadingInfo.actualLeft})`);
      console.log(`  声明: `);
      console.log(`    width=${loadingInfo.width}, height=${loadingInfo.height}`);
      console.log(`    margin=${loadingInfo.marginTop} ${loadingInfo.marginRight} ${loadingInfo.marginBottom} ${loadingInfo.marginLeft}`);
      console.log(`    padding=${loadingInfo.paddingTop} ${loadingInfo.paddingRight} ${loadingInfo.paddingBottom} ${loadingInfo.paddingLeft}`);
      console.log(`    position=${loadingInfo.position}, display=${loadingInfo.display}`);
      console.log(`    visibility=${loadingInfo.visibility}, opacity=${loadingInfo.opacity}`);
      console.log(`    left=${loadingInfo.left}, top=${loadingInfo.top}`);
      console.log('');

      // 检查它是否真的在影响布局
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        const mainContentStyle = window.getComputedStyle(mainContent);
        const mainContentRect = mainContent.getBoundingClientRect();

        console.log(`主内容区域实际左边界: ${mainContentRect.left}px`);
        console.log(`.loading元素实际右边界: ${loadingInfo.actualLeft + loadingInfo.actualWidth}px`);
        console.log(`两者关系: 主内容区域左边界 = .loading元素右边界 ? ${mainContentRect.left === (loadingInfo.actualLeft + loadingInfo.actualWidth)}`);
      }
    } else {
      console.log(`未找到.loading元素`);
    }

  } catch (error) {
    console.error('调试过程中发生错误:', error);
  } finally {
    await browser.close();
  }
})();