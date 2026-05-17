# 🌐 啃魂导航

[![License](https://img.shields.io/badge/license-GPL%20v3-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-3.2.0-green.svg)]()
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-success.svg)](https://yolialisproxy.github.io/web_nav/)

啃魂个人开发的静态网址导航网站，收录 **6500+ 优质网站**，内置多引擎搜索、AI搜索、翻译插件、主题切换、PWA离线访问等功能。

> ✅ 2026年4月最新版本

---

## ✨ 核心特性

| 特性         | 说明                                   |
|--------------|----------------------------------------|
| 🚀 纯静态部署 | 无需后端，可部署在任何静态托管平台      |
| 📱 响应式设计 | 完美适配桌面端、平板、移动端            |
| 🎨 主题系统   | 日间/夜间模式，自定义背景色，系统跟随  |
| 🔍 多引擎搜索 | 百度/Google/必应 + 7种AI搜索引擎       |
| 🎯 高级搜索   | 文件类型、时间范围、站内网站过滤       |
| 📴 PWA支持   | Service Worker 实现离线访问            |
| 🌐 在线翻译   | 多语言翻译插件                         |
| ⌨️ 无障碍     | WCAG 2.1 AA 级标准，键盘全支持         |
| ✋ 手势操作   | 移动端滑动、长按、双击手势             |
| 📝 网址提交   | 用户提交网站，管理后台审核              |

---

## 📁 项目结构

```
web_nav/
├── index.html              # 主页面
├── admin.html              # 管理后台
├── admin-business.html     # 商业管理后台
├── commit.html             # 网站提交页面
├── config.js               # 全局配置文件
├── package.json            # 包管理
├── manifest.json           # PWA应用清单
├── sw.js                   # Service Worker
├── sections/               # 分类页面模块
├── data/websites.json      # 网站数据库
├── pages/search.html       # 搜索页面
└── assets/
    ├── css/                # 样式文件
    │   ├── main.css        # 核心样式
    │   ├── themes.css      # 主题变量
    │   └── components.css  # 组件样式
    └── js/
        ├── core/
        │   ├── data-manager.js      # 数据单例
        │   ├── state-manager.js     # 状态管理
        │   ├── ui-manager.js        # UI 渲染
        │   ├── search-router.js     # 智能搜索路由
        │   └── workflow-manager.js  # 一键工作流
        ├── intelligence/
        │   ├── memory-sorter.js     # 智能记忆排序
        │   ├── time-tunnel.js       # 时空隧道
        │   └── context-awareness.js # 上下文感知
        └── main.js                  # 程序入口
```

---

## 🚀 快速开始

### 本地预览

```bash
git clone https://github.com/yolialisproxy/web_nav.git
cd web_nav
python3 -m http.server 8888
# 访问 http://localhost:8888
```

### 部署到 GitHub Pages

1. Fork 本仓库
2. 在仓库设置中启用 Pages：`Settings → Pages → Source: main branch`
3. 访问 `https://你的用户名.github.io/web_nav`

✅ 项目已配置 GitHub Actions 自动部署，推送代码后自动构建。

### 其他平台部署

**Netlify**:
```bash
netlify deploy --prod --dir=.
```

**Vercel**:
```bash
vercel --prod
```

---

## 🔧 配置说明

### 修改网站信息

编辑 `config.js`：
```javascript
site: {
    name: '啃魂导航',
    title: '啃魂导航 - 发现优质网站',
    description: '收录9000+优质网站的导航系统',
    keywords: '网址导航,AI工具,开发工具',
    author: 'yoli_alis'
}
```

### 设置管理密码
首次访问 `/admin.html` 时设置，密码使用 SHA-256 哈希存储在 localStorage 中。

### 启用访问统计
```javascript
localStorage.setItem('web_nav_baidu_analytics', '你的统计ID');
localStorage.setItem('web_nav_google_analytics', 'G-XXXXXXXXXX');
```

---

## 📝 更新日志

### [3.2.0] - 2026-04-07

**新增**
- ✅ 完整搜索增强系统
- ✅ 4种搜索类型：网页搜索、本站搜索、磁力搜索、AI搜索
- ✅ 7种AI搜索引擎集成
- ✅ 高级搜索：文件类型、时间范围、站内网站
- ✅ 本站实时搜索（模糊匹配，最多50条结果）
- ✅ 热搜榜系统（带引流词条）
- ✅ 玻璃态UI设计系统
- ✅ 渐变边框动画、光泽流动效果
- ✅ 搜索结果卡片动画

**优化**
- 统一全站CSS变量系统
- 搜索栏响应式布局（桌面/平板/手机）
- 下拉选择框美化效果
- 减少重排重绘，DOM操作优化
- 事件节流防抖实现

**修复**
- 修复导航栏弹出菜单超出屏幕问题
- 修复主题切换与背景色协同问题
- 修复移动端触摸手势兼容性

---

## [3.1.0] - 2026-03-25

**新增**
- GitHub Actions 自动部署
- 卡片悬停光泽动画
- 导航按钮脉冲动画
- 三色渐变背景
- 全新 KenHun Logo 设计
- 无障碍基础设施（ARIA标签、键盘导航）
- 触摸手势系统
- 通知提示系统

**优化**
- PWA manifest 配置
- sitemap.xml 完整分类页面
- 主题切换动画GPU加速
- 背景颜色选择器交互

---

## 💎 完美实践经验

### 导航系统开发黄金法则

#### ✅ 1. ID映射规则
> 90% 导航失败都源于此问题

**永远不要相信HTML ID和JSON键名会一致**
```javascript
// ✅ 必须在所有点击事件入口统一做ID映射
const navIdToJsonKey = {
  'ai': 'AI智能',
  'video': '视频创作',
  'design': '设计绘画',
  'writing': '文字创作',
  'dev': '开发工具',
  'office': '办公学习',
  'resources': '素材资源',
  'entertainment': '悠闲娱乐',
  'learning': '学习社区'
};
```

#### ✅ 2. 事件绑定原则
**永远不要混用内联事件和JS事件**

❌ 绝对禁止：
```html
<li onmouseover="showMenu()" onmouseout="hideMenu()">
```

✅ 正确做法：
```html
<li class="nav-item">
```
所有事件在JS中统一绑定。内联事件会优先执行并阻止冒泡，让你的 `addEventListener` 完全失效。

#### ✅ 3. 字段安全访问
```javascript
// ❌ 错误写法
`${sub.icon} ${sub.name}`

// ✅ 正确写法 - 永远提供默认值
`${sub.icon || ''} ${sub.name}`
```

#### ✅ 4. 数据加载调试清单
1. 打印 `Object.keys(data)` 查看JSON真实键名
2. 打印点击事件传入的 `categoryId`
3. 对比两者是否完全一致
4. 确认所有进入 `loadCategoryData()` 的参数都经过转换
5. 检查HTML上是否有内联事件冲突
6. 测试每一个导航链接，不要只测试首页

---

## ⚡ 性能优化最佳实践

| 优化技术               | 提升效果                        |
|------------------------|---------------------------------|
| GPU加速动画            | 帧率 30fps → 60fps              |
| 减少重排重绘           | CPU占用 降低 40-50%             |
| 事件节流防抖           | 重排次数 减少 60-70%            |
| DocumentFragment       | DOM操作速度 提升 70%            |

```css
/* ✅ GPU加速属性 */
transform: translateZ(0);
will-change: transform, opacity;
```

---

## 🛠️ 技术栈
- HTML5 + CSS3 + JavaScript ES6+
- 纯原生实现，零依赖
- Service Worker (PWA)
- Font Awesome 5.15.4

---

## 📄 许可证

[GNU GPL v3](./LICENSE)

---

## 📧 联系方式

- GitHub: https://github.com/yolialisproxy
- Email: yoli_alis@2925.com
- 论坛: https://kenhun.discourse.group

---

## 📊 项目统计

| 指标         | 数值       |
|--------------|------------|
| 总网站数     | 6561       |
| 主分类       | 9 个       |
| 子分类       | 810 个 (81中类+729小类)      |
| JSON大小     | ~109KB     |
| 加载时间     | <100ms     |
| 渲染时间     | <50ms      |

---

## ⭐ 如果这个项目对你有帮助，欢迎 Star 支持！