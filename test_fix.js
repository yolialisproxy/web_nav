// 测试数据管理器修复是否有效
const fs = require('fs');
const path = require('path');

// 复制数据管理器的关键部分到测试环境
global.console = { log: console.log, warn: console.warn, error: console.error };

// 模拟DOM环境 для document.createElement
global.document = {
  createElement: function(tag) {
    return {
      textContent: '',
      innerHTML: '',
      setAttribute: function(name, value) {},
      classList: { toggle: function() {} }
    };
  }
};

// 加载实际的数据管理器代码
const dataManagerCode = fs.readFileSync(path.join(__dirname, 'assets/js/core/data-manager.js'), 'utf8');
const validationUtilCode = fs.readFileSync(path.join(__dirname, 'assets/js/utils/validation-util.js'), 'utf8');

// 在全局作用域中执行这些代码以定义类
eval(validationUtilCode);
eval(dataManagerCode);

// 现在测试数据加载
(async function() {
  try {
    console.log('开始测试数据管理器...');

    // 创建数据管理器实例
    const dataManager = DataManager.getInstance();

    // 初始化（加载数据）
    await dataManager.initialize();

    console.log('数据管理器初始化成功!');
    console.log('加载的网站数量:', dataManager.getTotalSites());

    if (dataManager.getTotalSites() > 0) {
      console.log('测试通过: 数据成功加载');

      // 测试一下搜索功能
      const results = dataManager.search('AI');
      console.log('搜索 "AI" 结果数量:', results.length);

      // 测试一下分类功能
      const bigCats = dataManager.getBigCategories();
      console.log('大类数量:', bigCats.length);

      if (bigCats.length > 0) {
        const firstBigCat = bigCats[0];
        console.log('第一个大类:', firstBigCat.name);

        const middleCats = dataManager.getMiddleCategories(firstBigCat.id);
        console.log('第一个大类下的中类数量:', middleCats.length);
      }
    } else {
      console.log('测试失败: 没有加载到任何网站数据');
    }
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    console.error('错误堆栈:', error.stack);
  }
})();