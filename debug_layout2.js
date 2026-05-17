// 检查main-content的父元素和更上层元素
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

    // 检查main-content及其父元素的布局
    const debugInfo = await page.evaluate(() => {
      const getElementInfo = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return {
          selector,
          width: style.width,
          marginLeft: style.marginLeft,
          marginRight: style.marginRight,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
          left: style.left,
          position: style.position,
          actualLeft: rect.left,
          actualWidth: rect.width,
          actualRight: rect.right
        };
      };

      const bodyInfo = getElementInfo('body');
      const appContainerInfo = getElementInfo('.app-container');
      const sidebarInfo = getElementInfo('.sidebar');
      const mainContentInfo = getElementInfo('.main-content');

      // 检查main-content的所有父元素
      const parents = [];
      let current = document.querySelector('.main-content');
      let level = 0;
      while (current && current !== document.body && level < 10) {
        const style = window.getComputedStyle(current);
        const rect = current.getBoundingClientRect();
        parents.push({
          level,
          tagName: current.tagName,
          className: current.className,
          width: style.width,
          marginLeft: style.marginLeft,
          paddingLeft: style.paddingLeft,
          position: style.position,
          left: style.left,
          actualLeft: rect.left,
          actualWidth: rect.width
        });
        current = current.parentElement;
        level++;
      }

      return {
        body: bodyInfo,
        appContainer: appContainerInfo,
        sidebar: sidebarInfo,
        mainContent: mainContentInfo,
        parents: parents
      };
    });

    console.log('=== 元素布局信息 ===');
    console.log(`Body: left=${debugInfo.body.actualLeft}, width=${debugInfo.body.actualWidth}`);
    console.log(`.app-container: left=${debugInfo.appContainer.actualLeft}, width=${debugInfo.appContainer.actualWidth}, margin-left=${debugInfo.appContainer.marginLeft}, padding-left=${debugInfo.appContainer.paddingLeft}`);
    console.log(`.sidebar: left=${debugInfo.sidebar.actualLeft}, width=${debugInfo.sidebar.actualWidth}, margin-left=${debugInfo.sidebar.marginLeft}`);
    console.log(`.main-content: left=${debugInfo.mainContent.actualLeft}, width=${debugInfo.mainContent.actualWidth}, margin-left=${debugInfo.mainContent.marginLeft}, padding-left=${debugInfo.mainContent.paddingLeft}`);
    console.log('');
    console.log('=== 主内容区域父元素链 ===');
    debugInfo.parents.forEach(parent => {
      const indent = '  '.repeat(parent.level);
      console.log(`${indent}${parent.tagName}.${parent.className}: left=${parent.actualLeft}, width=${parent.actualWidth}, margin-left=${parent.marginLeft}, padding-left=${parent.paddingLeft}, position=${parent.position}`);
    });
    console.log('');
    console.log('=== 计算分析 ===');
    const expectedLeft = debugInfo.sidebar.actualLeft + debugInfo.sidebar.actualWidth + parseInt(debugInfo.mainContent.marginLeft);
    console.log(`期望main-content左边界: sidebar左边界(${debugInfo.sidebar.actualLeft}) + sidebar宽度(${debugInfo.sidebar.actualWidth}) + main-content margin-left(${debugInfo.mainContent.marginLeft}) = ${expectedLeft}px`);
    console.log(`实际main-content左边界: ${debugInfo.mainContent.actualLeft}px`);
    console.log(`差值: ${debugInfo.mainContent.actualLeft - expectedLeft}px`);
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  } finally {
    await browser.close();
  }
})();