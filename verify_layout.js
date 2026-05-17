// 简单的布局验证脚本
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

    // 检查主内容区域的位置和尺寸
    const result = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      const mainContent = document.querySelector('.main-content');

      const sidebarStyle = window.getComputedStyle(sidebar);
      const mainContentStyle = window.getComputedStyle(mainContent);

      const sidebarWidth = parseInt(sidebarStyle.width);
      const mainContentMarginLeft = parseInt(mainContentStyle.marginLeft);
      const mainContentLeft = parseInt(mainContentStyle.left);
      const mainContentWidth = parseInt(mainContentStyle.width);
      const mainContentMaxWidth = mainContentStyle.maxWidth;

      // 检查是否有水平溢出
      const hasHorizontalScroll = document.body.scrollWidth > document.body.clientWidth;

      // 获取实际渲染位置
      const mainContentRect = mainContent.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();

      return {
        sidebarWidth,
        mainContentMarginLeft,
        mainContentLeft,
        mainContentWidth,
        mainContentMaxWidth,
        isMarginAligned: sidebarWidth === mainContentMarginLeft,
        isPositionAligned: sidebarRect.right === mainContentRect.left,
        mainContentActualLeft: mainContentRect.left,
        hasOverflow: hasHorizontalScroll,
        viewportWidth: window.innerWidth,
        bodyWidth: document.body.scrollWidth
      };
    });

    console.log('布局验证结果:');
    console.log(`Sidebar宽度: ${result.sidebarWidth}px`);
    console.log(`Main Content margin-left: ${result.mainContentMarginLeft}px`);
    console.log(`Main Content left: ${result.mainContentLeft}px`);
    console.log(`Main Content width: ${result.mainContentWidth}px`);
    console.log(`Main Content max-width: ${result.mainContentMaxWidth}`);
    console.log(`Main Content实际左边界: ${result.mainContentActualLeft}px`);
    console.log(`Sidebar右边界: ${parseInt(result.sidebarWidth)}px`);
    console.log(`是否通过margin-left对齐: ${result.isMarginAligned}`);
    console.log(`是否通过实际位置对齐: ${result.isPositionAligned}`);
    console.log(`视口宽度: ${result.viewportWidth}px`);
    console.log(`身体宽度: ${result.bodyWidth}px`);
    console.log(`是否有水平溢出: ${result.hasOverflow}`);

    if (result.isMarginAligned && !result.hasOverflow) {
      console.log('✅ 布局验证通过: 主内容区域正确对齐且没有水平溢出');
    } else {
      console.log('❌ 布局验证失败');
      if (!result.isMarginAligned) {
        console.log(`   - 主内容区域margin-left(${result.mainContentMarginLeft}px)不等于Sidebar宽度(${result.sidebarWidth}px)`);
      }
      if (!result.isPositionAligned) {
        console.log(`   - 主内容区域实际左边界(${result.mainContentActualLeft}px)不等于Sidebar右边界(${result.sidebarWidth}px)`);
        console.log(`   - 差值: ${result.mainContentActualLeft - result.sidebarWidth}px`);
      }
      if (result.hasOverflow) {
        console.log(`   - 检测到水平溢出: 身体宽度(${result.bodyWidth}px) > 视口宽度(${result.viewportWidth}px)`);
        console.log(`   - 溢出量: ${result.bodyWidth - result.viewportWidth}px`);
      }
    }
  } catch (error) {
    console.error('验证过程中发生错误:', error);
  } finally {
    await browser.close();
  }
})();