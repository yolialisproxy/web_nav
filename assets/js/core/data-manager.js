/**
 * 啃魂导航 3.0 - 数据管理器
 * DataManager: 唯一的数据访问入口
 *
 * 职责：
 * - 异步加载 websites.json
 * - 提供层级分类过滤接口
 * - 实现高性能全文本搜索索引
 */

class DataManager {
  constructor() {
    this.data = null;
    this.searchIndex = [];
    this.categories = { big: [], middle: [], minor: [] };
    this._initPromise = null;
    this._invalidSiteCount = 0; // 用于跟踪跳过的无效站点数量
  }

  // 单例模式
  static getInstance() {
    if (!DataManager._instance) {
      DataManager._instance = new DataManager();
    }
    return DataManager._instance;
  }

  /**
   * 创建站点对象（用于搜索索引和分类查询）
   * @param {Object} site 站点数据对象
   * @param {string} bigName 大类名称
   * @param {string} subName 中类名称
   * @param {string} minorName 小类名称
   * @returns {Object} 站点对象
   */
  _createSiteObject(site, bigName, subName, minorName) {
    // 验证站点数据
    const validationResult = ValidationUtil.validateSiteWithReason(site);
    if (!validationResult.isValid) {
      // 只在开发模式下显示详细警告，生产环境只计数
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // 生产环境：只增加计数器，不输出详细信息
        if (!this._invalidSiteCount) {
          this._invalidSiteCount = 0;
        }
        this._invalidSiteCount++;

        // 每100个无效站点输出一次汇总信息，避免刷屏
        if (this._invalidSiteCount % 100 === 0) {
          console.warn(`[DataManager] 已跳过 ${this._invalidSiteCount} 个无效站点数据`);
        }
      } else {
        // 开发环境：显示详细验证失败原因
        console.warn(`[DataManager] 跳过无效站点数据: ${validationResult.reason}`, site);
      }
      return null; // 返回null表示无效数据
    }

    return {
      id: site.id || site.url || this._generateRandomId(),
      name: site.name || '未命名',
      description: site.description || site.desc || '',
      url: site.url || '',
      icon: this._generateSiteIcon(site),
      bigCategory: bigName,
      middleCategory: subName,
      minorCategory: minorName,
      tags: site.tags || [],
      workspace: site.workspace || '',
      // 时间戳字段，用于时空隧道功能
      lastAccessed: site.lastAccessed || Date.now(),
      addedTime: site.addedTime || Date.now()
    };
  }

  /**
   * 生成随机ID
   * @private
   * @returns {string} 随机ID
   */
  _generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * 创建站点显示对象（用于UI展示，带下划线前缀的分类字段）
   * @param {Object} site 站点数据对象
   * @param {string} bigName 大类名称
   * @param {string} subName 中类名称
   * @param {string} minorName 小类名称
   * @returns {Object} 站点显示对象
   */
  _createSiteDisplayObject(site, bigName, subName, minorName) {
    // 验证站点数据
    const validationResult = ValidationUtil.validateSiteWithReason(site);
    if (!validationResult.isValid) {
      // 只在开发模式下显示详细警告，生产环境只计数
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // 生产环境：只增加计数器，不输出详细信息
        if (!this._invalidSiteCount) {
          this._invalidSiteCount = 0;
        }
        this._invalidSiteCount++;

        // 每100个无效站点输出一次汇总信息，避免刷屏
        if (this._invalidSiteCount % 100 === 0) {
          console.warn(`[DataManager] 已跳过 ${this._invalidSiteCount} 个无效站点数据`);
        }
      } else {
        // 开发环境：显示详细验证失败原因
        console.warn(`[DataManager] 跳过无效站点数据: ${validationResult.reason}`, site);
      }
      return null; // 返回null表示无效数据
    }

    return {
      id: site.id || site.url || this._generateRandomId(),
      name: site.name || '未命名',
      description: site.description || site.desc || '',
      url: site.url || '',
      icon: this._generateSiteIcon(site),
      _bigCategory: bigName,
      _middleCategory: subName,
      _minorCategory: minorName,
      workspace: site.workspace || '',
      // 时间戳字段，用于时空隧道功能
      lastAccessed: site.lastAccessed || Date.now(),
      addedTime: site.addedTime || Date.now()
    };
  }

  /**
   * 验证站点数据并添加到搜索索引
   * @param {Object} site 站点数据对象
   * @param {string} bigName 大类名称
   * @param {string} subName 中类名称
   * @param {string} minorName 小类名称
   */
  _validateAndAddSite(site, bigName, subName, minorName) {
    const siteObj = this._createSiteObject(site, bigName, subName, minorName);
    if (siteObj) {
      this.searchIndex.push(siteObj);
    }
  }

  /**
   * 初始化数据加载
   */
  async initialize() {
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = this._loadData();
    return this._initPromise;
  }

  /**
   * 异步加载数据
   */
  async _loadData() {
    try {
      const response = await fetch('./data/websites.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.data = await response.json();

      // 构建搜索索引和分类
      this._buildSearchIndex();
      this._buildCategories();

      console.log('[DataManager] 数据加载完成, 网站数量:', this.getTotalSites());
      return true;
    } catch (error) {
      console.error('[DataManager] 数据加载失败:', error);
      // 尝试加载备用数据
      return this._loadFallbackData();
    }
  }

  /**
   * 加载备用数据
   */
  async _loadFallbackData() {
    try {
      const response = await fetch('./data/sites-v2.json');
      if (!response.ok) {
        throw new Error('备用数据也不可用');
      }
      this.data = await response.json();
      this._buildSearchIndex();
      this._buildCategories();
      console.log('[DataManager] 备用数据加载完成');
      return true;
    } catch (error) {
      console.error('[DataManager] 备用数据加载失败:', error);
      return false;
    }
  }

  /**
 * 构建搜索索引
 * 数据格式（九九九九四层级）:
 * {
 *   "大类名": {
   *     subcategories: [
   *       {
   *         name: "中类名",
   *         minor_categories: [
   *           { name: "小类名", sites: [...] }
   *         ]
   *       }
   *     ]
   *   }
   * }
   * 也支持 v2 格式：{version, categories: [...]}
 */
 _buildSearchIndex() {
   this.searchIndex = [];

   if (!this.data || typeof this.data !== 'object') {
     return;
   }

   // 提取 categories 数组（支持 v2 格式：{version, categories, ...}）
   let categories = this.data;
   if (categories.categories && Array.isArray(categories.categories)) {
     categories = categories.categories;
   }

   // 遍历所有大类（支持数组格式）
   const bigEntries = Array.isArray(categories) ? categories.map(c => [c.name, c]) : Object.entries(categories);

   for (const [bigName, bigCategory] of bigEntries) {
     if (!bigCategory || typeof bigCategory !== 'object') continue;

     const subcategories = bigCategory.subcategories || [];

     for (const sub of subcategories) {
       if (!sub || typeof sub !== 'object') continue;
       const subName = sub.name || sub.id || '';

       // 遍历小类（minor_categories）- 四层级结构
       const minorCategories = sub.minor_categories || [];

       for (const minor of minorCategories) {
         if (!minor || typeof minor !== 'object') continue;
         const minorName = minor.name || minor.id || '';
         const sites = minor.sites || [];

         for (const site of sites) {
           this._validateAndAddSite(site, bigName, subName, minorName);
         }
       }

       // 向下兼容：旧格式是中类直接有 sites（无 minor_categories）
       if (sub.sites && minorCategories.length === 0) {
         console.warn('[DataManager] 兼容旧格式：' + bigName + '→' + subName + ' 的 sites 在中类层');
         for (const site of sub.sites) {
           this._validateAndAddSite(site, bigName, subName, '默认');
         }
       }
     }
   }
 }
   /**
   * 构建分类结构
   */
  _buildCategories() {
    this.categories = { big: [], middle: [], minor: [] };

    if (!this.data || typeof this.data !== 'object') {
      return;
    }

    // 大类
    for (const bigName of Object.keys(this.data)) {
      const bigCategory = this.data[bigName];
      const subcategories = bigCategory.subcategories || [];

      this.categories.big.push({
        id: this._generateId(bigName),
        name: bigName,
        icon: bigCategory.icon || this._getIconForCategory(bigName)
      });

      // 中类 (subcategories)
      for (const sub of subcategories) {
        const subName = sub.name || sub.id || '';

        this.categories.middle.push({
          id: this._generateId(subName),
          name: subName,
          bigId: this._generateId(bigName),
          icon: sub.icon || ''
        });

        // 小类 (minor_categories)
        const minorCategories = sub.minor_categories || [];
        for (const minor of minorCategories) {
          const minorName = minor.name || minor.id || '';

          this.categories.minor.push({
            id: this._generateId(minorName),
            name: minorName,
            middleId: this._generateId(subName)
          });
        }
      }
    }
  }

  /**
   * 根据分类名获取默认图标
   */
  _getIconForCategory(name) {
    const iconMap = {
      'AI智能': '🤖',
      '搜索引擎': '🔍',
      '社交媒体': '💬',
      '开发资源': '💻',
      '设计资源': '🎨',
      '学习平台': '📚',
      '娱乐': '🎮',
      '购物': '🛒',
      '新闻': '📰',
      '工具': '🛠️'
    };
    return iconMap[name] || '📁';
  }

  /**
   * 生成唯一ID
   */
  _generateId(name) {
    return name ? name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') : '';
  }

  /**
   * 生成网站图标 URL
   */
  _generateSiteIcon(site) {
    if (site.icon) return site.icon;
    if (!site.url) return '';
    try {
      const hostname = new URL(site.url).hostname;
      return `https://favicon.im/${hostname}`;
    } catch (e) {
      return '';
    }
  }

  /**
   * 获取所有大类
   */
  getBigCategories() {
    return this.categories.big;
  }

  /**
   * 获取中类（按大类筛选）
   */
  getMiddleCategories(bigId) {
    if (!bigId) {
      return this.categories.middle;
    }
    return this.categories.middle.filter(c => c.bigId === bigId);
  }

  /**
   * 获取小类（按中类筛选）
   */
  getMinorCategories(middleId) {
    if (!middleId) {
      return this.categories.minor;
    }
    return this.categories.minor.filter(c => c.middleId === middleId);
  }

  /**
   * 获取网站列表（按分类）
   */
  getSitesByCategory(bigId, middleId, minorId) {
    if (!this.data || typeof this.data !== 'object') {
      return [];
    }

    // 如果没有指定分类，返回空
    if (!bigId) {
      return [];
    }

    const results = [];

    // 遍历查找匹配的大类
    for (const bigName of Object.keys(this.data)) {
      const categoryId = this._generateId(bigName);

      // 匹配大类
      if (bigId && categoryId !== bigId) {
        continue;
      }

      const bigCategory = this.data[bigName];
      const subcategories = bigCategory.subcategories || [];

      for (const sub of subcategories) {
        const subId = this._generateId(sub.name || sub.id);

        // 匹配中类（如果指定）
        if (middleId && subId !== middleId) {
          continue;
        }

        // 获取小类
        const minorCategories = sub.minor_categories || [];

        for (const minor of minorCategories) {
          const minorIdValue = this._generateId(minor.name || minor.id);

          // 匹配小类（如果指定）
          if (minorId && minorIdValue !== minorId) {
            continue;
          }

          const sites = minor.sites || [];
          for (const site of sites) {
            const siteObj = this._createSiteDisplayObject(site, bigName, sub.name || sub.id || '', minor.name || minor.id || '');
            if (siteObj) {
              results.push(siteObj);
            }
          }
        }

        // 向下兼容：旧格式是中类直接有 sites（无 minor_categories）
        if (sub.sites && minorCategories.length === 0) {
          // 只有在没有指定minorId时才处理旧格式
          if (!minorId) {
            for (const site of sub.sites) {
              const siteObj = this._createSiteDisplayObject(site, bigName, sub.name || sub.id || '', '默认');
              if (siteObj) {
                results.push(siteObj);
              }
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * 全文本搜索
   */
  search(query, limit = 50) {
    if (!query || !query.trim()) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    for (const item of this.searchIndex) {
      const nameMatch = item.name && item.name.toLowerCase().includes(searchTerm);
      const descMatch = item.description && item.description.toLowerCase().includes(searchTerm);
      const tagMatch = item.tags && item.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm)
      );

      if (nameMatch || descMatch || tagMatch) {
        results.push({
          ...item,
          _matchType: nameMatch ? 'name' : (descMatch ? 'description' : 'tag'),
          _score: nameMatch ? 3 : (descMatch ? 2 : 1)
        });
      }
    }

    // 按匹配类型排序
    results.sort((a, b) => b._score - a._score);

    return results.slice(0, limit);
  }

  /**
   * 获取总网站数
   */
  getTotalSites() {
    return this.searchIndex.length;
  }

  /**
   * 获取数据加载状态
   */
  isLoaded() {
    return this.data !== null;
  }

  /**
   * 搜索意图路由 - 根据关键词建议分类
   * @param {string} query 搜索关键词
   * @returns {object|null} 建议的分类信息 {bigId, bigName, confidence}
   */
  suggestCategory(query) {
    if (!query || !query.trim()) {
      return null;
    }

    const searchTerm = query.toLowerCase().trim();

    // 意图关键词映射表
    const intentMap = {
      // AI 智能
      'ai': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.95 },
      'chatgpt': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.9 },
      'gpt': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.9 },
      'claude': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.9 },
      'kimi': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.85 },
      '文心一言': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.9 },
      '通义千问': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.9 },
      '豆包': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.85 },
      'gemini': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.9 },
      'llm': { bigId: 'ai智能', bigName: 'AI智能', confidence: 0.85 },

      // 搜索引擎
      '搜索': { bigId: '搜索引擎', bigName: '搜索引擎', confidence: 0.95 },
      'google': { bigId: '搜索引擎', bigName: '搜索引擎', confidence: 0.9 },
      '百度': { bigId: '搜索引擎', bigName: '搜索引擎', confidence: 0.9 },

      // 开发资源
      '开发': { bigId: '开发资源', bigName: '开发资源', confidence: 0.9 },
      'github': { bigId: '开发资源', bigName: '开发资源', confidence: 0.95 },
      'git': { bigId: '开发资源', bigName: '开发资源', confidence: 0.9 },

      // 设计资源
      '设计': { bigId: '设计资源', bigName: '设计资源', confidence: 0.95 },
      'figma': { bigId: '设计资源', bigName: '设计资源', confidence: 0.95 },

      // 学习平台
      '学习': { bigId: '学习平台', bigName: '学习平台', confidence: 0.95 },

      // 娱乐
      '娱乐': { bigId: '娱乐', bigName: '娱乐', confidence: 0.95 },
      '游戏': { bigId: '娱乐', bigName: '娱乐', confidence: 0.95 },

      // 购物
      '购物': { bigId: '购物', bigName: '购物', confidence: 0.95 },
      '淘宝': { bigId: '购物', bigName: '购物', confidence: 0.9 },

      // 社交媒体
      '社交': { bigId: '社交媒体', bigName: '社交媒体', confidence: 0.95 },
      '微信': { bigId: '社交媒体', bigName: '社交媒体', confidence: 0.95 },

      // 工具
      '工具': { bigId: '工具', bigName: '工具', confidence: 0.9 }
    };

    // 精确匹配检查
    if (intentMap[searchTerm]) {
      return intentMap[searchTerm];
    }

    // 模糊匹配检查
    for (const [keyword, category] of Object.entries(intentMap)) {
      if (searchTerm.includes(keyword) || keyword.includes(searchTerm)) {
        return category;
      }
    }

    return null;
  }

  /**
   * 获取友情链接数据
   * @returns {Array} 友情链接数据数组
   */
  getFriendshipLinks() {
    // 尝试从数据中获取友情链接
    if (this.data && this.data.friendshipLinks && Array.isArray(this.data.friendshipLinks)) {
      return this.data.friendshipLinks;
    }

    // 尝试从全局配置中获取友情链接
    if (window.CONFIG && window.CONFIG.friendshipLinks && Array.isArray(window.CONFIG.friendshipLinks)) {
      return window.CONFIG.friendshipLinks;
    }

    // 如果都没有，返回空数组
    return [];
  }
}

// 导出单例
if (typeof window !== 'undefined') {
    window.DataManager = DataManager.getInstance();
}