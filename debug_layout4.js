// 检查浮动、溢出和其他可能影响布局的属性
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

    // 检查可能影响布局的所有属性
    const debugInfo = await page.evaluate(() => {
      const getDetailedInfo = (selector) => {
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
          // 浮动和清除
          float: style.float,
          clear: style.clear,
          // 溢出
          overflow: style.overflow,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          // 变换
          transform: style.transform,
          // 显示
          display: style.display,
          // 弹性布局
          flexDirection: style.flexDirection,
          justifyContent: style.justifyContent,
          alignItems: style.alignItems,
          // 网格布局
          gridTemplateColumns: style.gridTemplateColumns,
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
        info[selector] = getDetailedInfo(selector);
      });

      // 检查.main-content之前的所有元素（看看是否有浮动元素占用空间）
      const mainContent = document.querySelector('.main-content');
      const prevElementsInfo = [];
      if (mainContent) {
        let prev = mainContent.previousElementSibling;
        let index = 0;
        while (prev && index < 10) { // 最多检查10个前面的元素
          const style = window.getComputedStyle(prev);
          const rect = prev.getBoundingClientRect();
          prevElementsInfo.push({
            index,
            tagName: prev.tagName,
            className: prev.className,
            width: style.width,
            height: style.height,
            marginLeft: style.marginLeft,
            marginRight: style.marginRight,
            float: style.float,
            position: style.position,
            actualLeft: rect.left,
            actualWidth: rect.width
          });
          prev = prev.previousElementSibling;
          index++;
        }
      }

      // 检查是否有媒体查询影响
      const mediaQueries = [];
      if (document.styleSheets) {
        for (let i = 0; i < document.styleSheets.length; i++) {
          try {
            const sheet = document.styleSheets[i];
            if (sheet.cssRules) {
              for (let j = 0; j < sheet.cssRules.length; j++) {
                const rule = sheet.cssRules[j];
                if (rule.type === CSSRule.MEDIA_RULE) {
                  mediaQueries.push({
                    index: i,
                    ruleIndex: j,
                    media: rule.media.mediaText,
                    rulesCount: rule.cssRules.length
                  });
                }
              }
            }
          } catch (e) {
            // 跨域样式表可能无法访问
          }
        }
      }

      return {
        elements: info,
        prevElements: prevElementsInfo,
        mediaQueries: mediaQueries
      };
    });

    console.log('=== 主要元素详细信息 ===');
    ['html', 'body', '.app-container', '.sidebar', '.main-content'].forEach(selector => {
      const info = debugInfo.elements[selector];
      if (info) {
        console.log(`${selector}:`);
        console.log(`  尺寸: ${info.actualWidth}x${info.actualHeight}`);
        console.log(`  位置: (${info.actualLeft}, ${info.actualTop})`);
        console.log(`  声明: `);
        console.log(`    width=${info.width}, height=${info.height}`);
        console.log(`    margin=${info.marginTop} ${info.marginRight} ${info.marginBottom} ${info.marginLeft}`);
        console.log(`    padding=${info.paddingTop} ${info.paddingRight} ${info.paddingBottom} ${info.paddingLeft}`);
        console.log(`    position=${info.position}, float=${info.float}, clear=${info.clear}`);
        console.log(`    overflow=${info.overflow}, overflow-x=${info.overflowX}, overflow-y=${info.overflowY}`);
        console.log(`    display=${info.display}, transform=${info.transform}`);
        console.log(`    flex-direction=${info.flexDirection}, justify-content=${info.justifyContent}, align-items=${info.alignItems}`);
        console.log('');
      }
    });

    console.log('=== .main-content之前的元素 ===');
    debugInfo.prevElements.forEach(elem => {
      console.log(`${elem.tagName}.${elem.className}[#${elem.index}]:`);
      console.log(`  尺寸: ${elem.actualWidth}x${elem.actualHeight}`);
      console.log(`  位置: (${elem.actualLeft}, ?)`);
      console.log(`  声明: width=${elem.width}, margin-left=${elem.marginLeft}, margin-right=${elem.marginRight}, float=${elem.float}, position=${elem.position}`);
      console.log('');
    });

    console.log('=== 媒体查询信息 ===');
    if (debugInfo.mediaQueries.length > 0) {
      debugInfo.mediaQueries.forEach(mq => {
        console.log(`媒体查询[${mq.index}][${mq.ruleIndex}]: ${mq.media} (${mq.rulesCount}条规则)`);
      });
    } else {
      console.log(`未找到媒体查询`);
    }

    console.log('');
    console.log('=== 布局计算分析 ===');
    const sidebar = debugInfo.elements['.sidebar'];
    const mainContent = debugInfo.elements['.main-content'];
    const appContainer = debugInfo.elements['.app-container'];

    if (sidebar && mainContent && appContainer) {
      console.log(`假设1: 如果.sidebar脱离文档流(fixed)，那么.main-content的左边界应该是:`);
      console.log(`  .app-container左边界(${appContainer.actualLeft}) + .app-container padding-left(${parseInt(appContainer.paddingLeft)}) + .main-content margin-left(${parseInt(mainContent.marginLeft)})`);
      const expected1 = parseInt(appContainer.actualLeft) + parseInt(appContainer.paddingLeft) + parseInt(mainContent.marginLeft);
      console.log(`  = ${appContainer.actualLeft} + ${parseInt(appContainer.paddingLeft)} + ${parseInt(mainContent.marginLeft)} = ${expected1}px`);
      console.log(`  实际.main-content左边界: ${mainContent.actualLeft}px`);
      console.log(`  差值: ${mainContent.actualLeft - expected1}px`);
      console.log('');

      console.log(`假设2: 检查是否有浮动元素在.main-content之前占用空间:`);
      let totalPrevWidth = 0;
      let totalPrevMarginRight = 0;
      debugInfo.prevElements.forEach(elem => {
        // 只考虑普通定位和浮动的元素
        if (elem.position === 'static' || elem.position === 'relative' || elem.float !== 'none') {
          totalPrevWidth += parseInt(elem.actualWidth);
          totalPrevMarginRight += parseInt(elem.marginRight || '0');
        }
      });
      console.log(`  之前元素总宽度: ${totalPrevWidth}px`);
      console.log(`  之前元素总margin-right: ${totalPrevMarginRight}px`);
      console.log(`  合计占用空间: ${totalPrevWidth + totalPrevMarginRight}px`);
      const expected2 = parseInt(appContainer.actualLeft) + parseInt(appContainer.paddingLeft) + totalPrevWidth + totalPrevMarginRight + parseInt(mainContent.marginLeft);
      console.log(`  期望.main-content左边界: ${appContainer.actualLeft} + ${parseInt(appContainer.paddingLeft)} + ${totalPrevWidth} + ${totalPrevMarginRight} + ${parseInt(mainContent.marginLeft)} = ${expected2}px`);
      console.log(`  实际.main-content左边界: ${mainContent.actualLeft}px`);
      console.log(`  差值: ${mainContent.actualLeft - expected2}px`);
    }
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  } finally {
    await browser.close();
  }
})();