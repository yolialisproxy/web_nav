// 检查transform和其他可能导致偏移的属性
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

    // 检查可能导致偏移的所有属性
    const debugInfo = await page.evaluate(() => {
      const getComputedInfo = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return {
          selector,
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
          // 变换
          transform: style.transform,
          // 显示
          display: style.display,
          // 实际位置和尺寸
          actualLeft: rect.left,
          actualTop: rect.top,
          actualWidth: rect.width,
          actualHeight: rect.height
        };
      };

      const selectors = ['html', 'body', '.app-container', '.sidebar', '.main-content'];
      const info = {};

      selectors.forEach(selector => {
        info[selector] = getComputedInfo(selector);
      });

      // 特别检查main-content的计算值
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        const style = window.getComputedStyle(mainContent);
        info['mainContent-calculated'] = {
          // 根据CSS计算应该的位置
          // 对于static元素，左边界应该是父元素的padding-left + 所有之前兄弟元素的占用空间 + margin-left
          // 但由于sidebar是fixed，它不占用文档流空间
          expectedLeftFromCss: parseInt(style.paddingLeft) + parseInt(style.marginLeft),
          marginLeftValue: style.marginLeft,
          paddingLeftValue: style.paddingLeft,
          actualLeft: mainContent.getBoundingClientRect().left
        };
      }

      return info;
    });

    console.log('=== 元素计算样式 ===');
    ['html', 'body', '.app-container', '.sidebar', '.main-content'].forEach(selector => {
      const info = debugInfo[selector];
      if (info) {
        console.log(`${selector}:`);
        console.log(`  尺寸: ${info.actualWidth}x${info.actualHeight}`);
        console.log(`  位置: (${info.actualLeft}, ${info.actualTop})`);
        console.log(`  声明: width=${info.width}, margin-left=${info.marginLeft}, padding-left=${info.paddingLeft}, position=${info.position}`);
        console.log(`  变换: transform=${info.transform}`);
        console.log('');
      }
    });

    console.log('=== 主内容区域特殊分析 ===');
    const mc = debugInfo['mainContent-calculated'];
    if (mc) {
      console.log(`mainContent margin-left: '${mc.marginLeftValue}'`);
      console.log(`mainContent padding-left: '${mc.paddingLeftValue}'`);
      console.log(`main-content根据CSS应该的左边界: padding-left(${mc.paddingLeftValue}) + margin-left(${mc.marginLeftValue}) = ${parseInt(mc.paddingLeftValue || '0') + parseInt(mc.marginLeftValue || '0')}px`);
      console.log(`main-content实际左边界: ${mc.actualLeft}px`);
      console.log(`差值: ${mc.actualLeft - (parseInt(mc.paddingLeftValue || '0') + parseInt(mc.marginLeftValue || '0'))}px`);
    }

    console.log('');
    console.log('=== 检查是否有全局偏移 ===');
    // 检查是否有元素应用了变换导致整体偏移
    const htmlInfo = debugInfo['html'];
    const bodyInfo = debugInfo['body'];
    const appContainerInfo = debugInfo['.app-container'];

    console.log(`HTML transform: ${htmlInfo.transform}`);
    console.log(`BODY transform: ${bodyInfo.transform}`);
    console.log(`APP-CONTAINER transform: ${appContainerInfo.transform}`);

    // 检查滚动位置
    const scrollInfo = await page.evaluate(() => ({
      scrollX: window.scrollX,
      scrollY: window.scrollY
    }));
    console.log(`滚动位置: scrollX=${scrollInfo.scrollX}, scrollY=${scrollInfo.scrollY}`);

  } catch (error) {
    console.error('调试过程中发生错误:', error);
  } finally {
    await browser.close();
  }
})();