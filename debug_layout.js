// 深度调试布局问题
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

    // 详细检查main-content和sidebar的所有相关样式
    const debugInfo = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar');
      const mainContent = document.querySelector('.main-content');
      const body = document.body;

      const sidebarStyle = window.getComputedStyle(sidebar);
      const mainContentStyle = window.getComputedStyle(mainContent);
      const bodyStyle = window.getComputedStyle(body);

      // 获取所有定位相关的属性
      const getPositionProps = (element, style) => {
        return {
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
          left: style.left,
          right: style.right,
          top: style.top,
          bottom: style.bottom,
          position: style.position,
          float: style.float,
          display: style.display,
          maxWidth: style.maxWidth,
          boxSizing: style.boxSizing
        };
      };

      const sidebarProps = getPositionProps(sidebar, sidebarStyle);
      const mainContentProps = getPositionProps(mainContent, mainContentStyle);
      const bodyProps = getPositionProps(body, bodyStyle);

      // 获取实际位置
      const sidebarRect = sidebar.getBoundingClientRect();
      const mainContentRect = mainContent.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();

      // 检查CSS变量
      const rootStyle = window.getComputedStyle(document.documentElement);
      const sidebarEffectiveWidth = rootStyle.getPropertyValue('--sidebar-effective-width');
      const sidebarCollapsedEffectiveWidth = rootStyle.getPropertyValue('--sidebar-collapsed-effective-width');

      return {
        sidebar: {
          ...sidebarProps,
          actualWidth: sidebarRect.width,
          actualLeft: sidebarRect.left,
          actualRight: sidebarRect.right
        },
        mainContent: {
          ...mainContentProps,
          actualWidth: mainContentRect.width,
          actualLeft: mainContentRect.left,
          actualRight: mainContentRect.right
        },
        body: {
          ...bodyProps,
          actualWidth: bodyRect.width,
          actualLeft: bodyRect.left,
          actualRight: bodyRect.right
        },
        cssVariables: {
          sidebarEffectiveWidth,
          sidebarCollapsedEffectiveWidth
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });

    console.log('=== 调试信息 ===');
    console.log('CSS变量:');
    console.log(`  --sidebar-effective-width: ${debugInfo.cssVariables.sidebarEffectiveWidth}`);
    console.log(`  --sidebar-collapsed-effective-width: ${debugInfo.cssVariables.sidebarCollapsedEffectiveWidth}`);
    console.log('');
    console.log('视口:');
    console.log(`  宽度: ${debugInfo.viewport.width}px`);
    console.log(`  高度: ${debugInfo.viewport.height}px`);
    console.log('');
    console.log('Sidebar:');
    console.log(`  声明宽度: ${debugInfo.sidebar.width}`);
    console.log(`  声明margin-left: ${debugInfo.sidebar.marginLeft}`);
    console.log(`  声明position: ${debugInfo.sidebar.position}`);
    console.log(`  声明left: ${debugInfo.sidebar.left}`);
    console.log(`  实际宽度: ${debugInfo.sidebar.actualWidth}px`);
    console.log(`  实际左边界: ${debugInfo.sidebar.actualLeft}px`);
    console.log(`  实际右边界: ${debugInfo.sidebar.actualRight}px`);
    console.log('');
    console.log('Main Content:');
    console.log(`  声明宽度: ${debugInfo.mainContent.width}`);
    console.log(`  声明max-width: ${debugInfo.mainContent.maxWidth}`);
    console.log(`  声明margin-left: ${debugInfo.mainContent.marginLeft}`);
    console.log(`  声明position: ${debugInfo.mainContent.position}`);
    console.log(`  声明left: ${debugInfo.mainContent.left}`);
    console.log(`  声明box-sizing: ${debugInfo.mainContent.boxSizing}`);
    console.log(`  实际宽度: ${debugInfo.mainContent.actualWidth}px`);
    console.log(`  实际左边界: ${debugInfo.mainContent.actualLeft}px`);
    console.log(`  实际右边界: ${debugInfo.mainContent.actualRight}px`);
    console.log('');
    console.log('Body:');
    console.log(`  声明宽度: ${debugInfo.body.width}`);
    console.log(`  声明margin: ${debugInfo.body.marginTop} ${debugInfo.body.marginRight} ${debugInfo.body.marginBottom} ${debugInfo.body.marginLeft}`);
    console.log(`  声明padding: ${debugInfo.body.paddingTop} ${debugInfo.body.paddingRight} ${debugInfo.body.paddingBottom} ${debugInfo.body.paddingLeft}`);
    console.log(`  实际宽度: ${debugInfo.body.actualWidth}px`);
    console.log(`  实际左边界: ${debugInfo.body.actualLeft}px`);
    console.log(`  实际右边界: ${debugInfo.body.actualRight}px`);
    console.log('');
    console.log('=== 计算值 ===');
    console.log(`预期main-content左边界: ${debugInfo.sidebar.actualRight}px (sidebar右边界)`);
    console.log(`实际main-content左边界: ${debugInfo.mainContent.actualLeft}px`);
    console.log(`差值: ${debugInfo.mainContent.actualLeft - debugInfo.sidebar.actualRight}px`);
    console.log('');
    console.log(`计算的max-width值: calc(100vw - ${debugInfo.cssVariables.sidebarEffectiveWidth})`);
    console.log(`100vw = ${debugInfo.viewport.width}px`);
    console.log(`sidebar-effective-width = ${debugInfo.cssVariables.sidebarEffectiveWidth}`);
    console.log(`期望的max-width: ${debugInfo.viewport.width - parseInt(debugInfo.cssVariables.sidebarEffectiveWidth)}px`);
    console.log(`实际max-width: ${debugInfo.mainContent.maxWidth}`);
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  } finally {
    await browser.close();
  }
})();