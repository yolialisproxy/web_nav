// 简单的调试脚本来验证数据加载
const fs = require('fs');
const path = require('path');

(function() {
  // 模拟 DataManager 的数据加载部分
  const filePath = path.join(__dirname, 'data', 'websites.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log('数据类型:', typeof data);
  console.log('数据键:', Object.keys(data));
  console.log('第一个大类:', Object.keys(data)[0]);
  console.log('第一个大类的内容:', data[Object.keys(data)[0]]);

  // 检查是否有categories属性
  if (data.categories) {
    console.log('有 categories 属性:', data.categories);
    console.log('categories 类型:', typeof data.categories);
    if (Array.isArray(data.categories)) {
      console.log('categories 是数组，长度:', data.categories.length);
    }
  } else {
    console.log('没有 categories 属性');
  }
})();