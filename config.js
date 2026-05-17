/**
 * 网站配置文件
 * 统一管理所有配置项
 */

const CONFIG = {
    // 网站基本信息
    site: {
        name: '啃魂导航',
        title: '啃魂导航 - 6500+优质网站智能导航网站',
        description: '收录6500+优质网站的智能导航网站',
        keywords: '网址导航,智能导航,AI导航,六五六一导航,九九九九分类法',
        author: '啃魂',
        version: '3.1.0'
    },

    // 主题配置
    theme: {
        default: 'light', // light, dark, grey
        autoSwitch: true, // 自动切换主题
        storageKey: 'theme-preference'
    },

    // 搜索引擎配置
    search: {
        engines: {
            baidu: {
                name: '百度',
                url: 'https://www.baidu.com/s?wd=',
                icon: '🔍',
                description: '百度搜索'
            },
            google: {
                name: 'Google',
                url: 'https://www.google.com/search?q=',
                icon: '🌐',
                description: 'Google搜索'
            },
            bing: {
                name: 'Bing',
                url: 'https://www.bing.com/search?q=',
                icon: '🔎',
                description: 'Bing搜索'
            },
            duckduckgo: {
                name: 'DuckDuckGo',
                url: 'https://duckduckgo.com/?q=',
                icon: '🦆',
                description: 'DuckDuckGo隐私搜索'
            },
            doubao: {
                name: '豆包',
                url: 'https://www.doubao.com/search?q=',
                icon: '🤖',
                description: '豆包AI搜索'
            },
            kimi: {
                name: 'Kimi',
                url: 'https://kimi.moonshot.cn/search?q=',
                icon: '🌙',
                description: 'Kimi AI搜索'
            },
            scholar: {
                name: 'Google Scholar',
                url: 'https://scholar.google.com/scholar?q=',
                icon: '🎓',
                description: 'Google Scholar学术搜索'
            }
        },
        default: 'baidu',
        historyKey: 'search-history',
        maxHistory: 10,
        // 自定义搜索引擎
        customEngines: []
    },

    // 数据存储配置
    storage: {
        prefix: 'web_nav_',
        submissionsKey: 'siteSubmissions',
        todosKey: 'todos',
        settingsKey: 'userSettings'
    },

    // 管理员配置
    // 安全提示：密码通过 localStorage 管理，首次访问请在管理后台设置
    // 或设置环境变量 ADMIN_PASSWORD (适用于有后端的部署)
    admin: {
        // 密码哈希值 (SHA-256)，默认密码请在管理后台首次访问时设置
        // 这里存储的是空密码的标识，实际密码在 localStorage 中
        passwordHash: null, // 运行时从 localStorage 读取
        sessionKey: 'adminAuthenticated',
        sessionExpiry: 2 * 60 * 60 * 1000, // 2小时
        // 获取密码的方法
        getPassword: function() {
            const stored = localStorage.getItem('web_nav_admin_password');
            return stored || null; // 首次使用需要设置密码
        },
        // 设置密码的方法
        setPassword: function(newPassword) {
            localStorage.setItem('web_nav_admin_password', newPassword);
        }
    },

    // API配置
    api: {
        favicon: 'https://api.iowen.cn/favicon/', // 获取网站图标
        searchSuggestion: 'https://suggestion.baidu.com/su?wd=' // 搜索建议
    },

    // 功能开关
    features: {
        enableSearch: true,
        enableTodo: true,
        enableSubmit: true,
        enableThemeSwitch: true,
        enableStatistics: true, // 访问统计(已实现)
        enablePWA: true, // PWA支持(已实现)
        enableDataExport: true, // 数据导出导入
        enableRecommendation: true // 个性化推荐
    },

    // 广告配置
    ads: {
        enabled: true, // 全局广告开关
        sidebar: { enabled: false, name: '侧边栏广告位', code: '' },
        banner: { enabled: false, name: '顶部横幅广告位', code: '' },
        bottom: { enabled: false, name: '内容区底部广告位', code: '' }
    },

  // 上下文感知配置
  contextAwareness: {
    enabled: true,
    contextMap: {
      'github.com': { categoryId: '开发工具', message: '检测到您来自 GitHub，为您推荐开发者工具' },
      'stackoverflow.com': { categoryId: '开发工具', message: '正在浏览技术问答？看看这些开发资源' },
      'youtube.com': { categoryId: '娱乐休闲', message: '在看视频？试试这些娱乐资源' },
      'bilibili.com': { categoryId: '娱乐休闲', message: '在看 B 站？为您推荐更多娱乐工具' },
      'baidu.com': { categoryId: '网络工具', message: '正在搜索？试试这些高效网络工具' },
      'google.com': { categoryId: '网络工具', message: '正在搜索？为您推荐顶级网络资源' },
      'zhihu.com': { categoryId: '学习教育', message: '在探索知识？试试这些学习资源' },
      'medium.com': { categoryId: '学习教育', message: '在阅读文章？为您推荐学习工具' }
    }
  },

    // 统计配置
    // 安全提示：统计ID通过环境变量或运行时配置，请勿在代码中硬编码
    analytics: {
        // 从 localStorage 或环境变量读取，避免硬编码
        baidu: (function() {
            try {
                return localStorage.getItem('web_nav_baidu_analytics') || '';
            } catch(e) {
                return '';
            }
        })(),
        google: (function() {
            try {
                return localStorage.getItem('web_nav_google_analytics') || '';
            } catch(e) {
                return '';
            }
        })()
    },

    // 统计功能开关
    enableAnalytics: true, // 是否启用访问统计

    // 分类图标映射
    // 友谊链接
    friendshipLinks: [
      { name: '啃魂导航', url: 'https://nav.kenhun.de5.net', icon: '🔗' },
      { name: 'GitHub', url: 'https://github.com/yolialisproxy/web_nav', icon: '🐙' }
    ],

    // 分类图标映射
  categories: {
    icons: {
'AI智能': 'fa-robot',
'开发工具': 'fa-code',
'设计资源': 'fa-palette',
'效率办公': 'fa-briefcase',
'学习教育': 'fa-graduation-cap',
'生活服务': 'fa-home',
'娱乐休闲': 'fa-gamepad',
'网络工具': 'fa-globe',
'其他': 'fa-ellipsis-h'
},
defaultIcon: 'fa-link'
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
