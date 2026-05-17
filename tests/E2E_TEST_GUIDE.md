# WebNav E2E 测试指南

## 前提条件

在运行E2E测试之前，请确保已经安装了所有依赖：

```bash
npm install
```

## 启动测试服务器

E2E测试需要一个运行中的WebNav服务器。请在一个单独的终端中启动服务器：

```bash
# 启动本地服务器
python3 -m http.server 8080
```

服务器将在http://localhost:8080可用。

## 运行E2E测试

在另一个终端中，运行以下命令来执行E2E测试：

```bash
# 运行所有E2E测试
npx playwright test tests/e2e/

# 只运行特定的测试文件
npx playwright test tests/e2e/homepage.spec.js
npx playwright test tests/e2e/game-data-manager.spec.js

# 以有界模式运行（可视化测试）
npx playwright test tests/e2e/ --headed

# 生成测试报告
npx playwright show-report
```

## 测试覆盖范围

当前的E2E测试覆盖了以下功能：

### 首页功能测试 (`homepage.spec.js`)
- 基本页面元素可见性
- 导航菜单切换功能
- 搜索功能可用性
- 主题切换功能
- 广告位切换功能
- 工作区切换功能
- 时空隧道视图切换
- 友情链接功能
- 页面加载性能

### 游戏数据管理器测试 (`game-data-manager.spec.js`)
- GameDataManager单例模式验证
- 游戏进度保存和获取
- 成就获取和解锁
- 排行榜更新和获取
- 数据重置功能（手动测试）

### 性能测试 (`performance`部分)
- 页面加载时间验证
- 控制台错误检测

## 常见问题

### "Cannot find module '@playwright/test'"

如果遇到此错误，请确保已经正确安装了依赖：
```bash
npm install
```

如果问题持续存在，尝试清除npm缓存并重新安装：
```bash
npm cache clean --force
npm install
```

### 测试超时

如果测试因为超时而失败，请检查：
1. 本地服务器是否正在运行在端口8080上
2. 网络连接是否正常
3. 页面是否能够在预期时间内加载

### 查看测试报告

测试完成后，可以查看详细的测试报告：
```bash
npx playwright show-report
```

这将打开一个HTML报告，显示每个测试的详细结果。

## 更新测试

随着WebNav功能的发展，请继续添加新的E2E测试来覆盖：
- 新增的游戏功能
- 新增的UI组件
- 新增的用户交互流程
- 性能基准测试
- 可访问性测试

按照现有的测试结构和模式添加新测试文件到`tests/e2e/`目录。
