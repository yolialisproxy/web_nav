/**
 * 啃魂导航 3.0 - 时空隧道系统
 * TimeTunnel: 按时间自动分组网站（常用/最近/全部）
 *
 * 职责：
 * - 按访问时间自动分组网站
 * - 提供常用/最近/全部三种视图
 * - 根据点击频率和时间衰减智能排序
 * - 持久化数据到 localStorage
 */

class TimeTunnel {
  constructor() {
    this.storageKey = 'kenhun_time_tunnel';
    this.timeViews = ['frequent', 'recent', 'all'];
    this.defaultView = 'all';

    // 时间阈值（毫秒）
    this.oneDayMs = 24 * 60 * 60 * 1000;
    this.oneWeekMs = 7 * this.oneDayMs;
    this.oneMonthMs = 30 * this.oneDayMs;

    // 加载存储的数据
    this._loadStats();
  }

  /**
   * 从 localStorage 加载统计数据
   */
  _loadStats() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.stats = JSON.parse(stored);
      } else {
        this.stats = {};
      }
    } catch (e) {
      console.warn('[TimeTunnel] 加载统计失败:', e);
      this.stats = {};
    }
  }

  /**
   * 保存统计数据到 localStorage
   */
  _saveStats() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
    } catch (e) {
      console.warn('[TimeTunnel] 保存统计失败:', e);
    }
  }

  /**
   * 记录网站访问时间
   * @param {string} siteId 网站ID
   */
  recordVisit(siteId) {
    if (!siteId) return;

    this.stats[siteId] = {
      lastVisit: Date.now(),
      visitCount: (this.stats[siteId] && this.stats[siteId].visitCount) || 0 + 1
    };

    this._saveStats();

    // 防抖保存
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => this._saveStats(), 500);
  }

  /**
   * 获取网站的访问权重（考虑时间衰减）
   * @param {string} siteId 网站ID
   * @returns {number} 权重值
   */
  getWeight(siteId) {
    const siteStat = this.stats[siteId];
    if (!siteStat) return 0;

    const lastVisit = siteStat.lastVisit || 0;
    const visitCount = siteStat.visitCount || 0;

    if (visitCount === 0) return 0;

    // 时间衰减计算
    const now = Date.now();
    const timeSinceVisit = now - lastVisit;

    // 不同时间窗口的衰减因子
    let decayFactor = 1;
    if (timeSinceVisit > this.oneMonthMs) {
      // 超过一个月，按月份衰减
      const monthsAgo = timeSinceVisit / this.oneMonthMs;
      decayFactor = Math.pow(0.5, monthsAgo);
    } else if (timeSinceVisit > this.oneWeekMs) {
      // 超过一周，按周衰减
      const weeksAgo = timeSinceVisit / this.oneWeekMs;
      decayFactor = Math.pow(0.7, weeksAgo);
    } else if (timeSinceVisit > this.oneDayMs) {
      // 超过一天，按天衰减
      const daysAgo = timeSinceVisit / this.oneDayMs;
      decayFactor = Math.pow(0.9, daysAgo);
    }

    return visitCount * decayFactor;
  }

  /**
   * 根据时空隧道视图过滤和排序网站
   * @param {Array} sites 网站列表
   * @param {string} timeView 时空隧道视图 ('frequent' | 'recent' | 'all')
   * @returns {Array} 过滤和排序后的网站列表
   */
  filterAndSortByTimeView(sites, timeView) {
    const now = Date.now();

    switch (timeView) {
      case 'frequent':
        // 常用:按访问频率和时间衰减排序
        return [...sites].sort((a, b) => {
          const idA = a.id || a.url;
          const idB = b.id || b.url;
          return this.getWeight(idB) - this.getWeight(idA);
        });

      case 'recent':
        // 最近:只显示最近一周内访问过的网站,按最后访问时间排序
        const recentSites = sites.filter(site => {
          const id = site.id || site.url;
          const lastVisit = this.stats[id]?.lastVisit || 0;
          return (now - lastVisit) <= this.oneWeekMs;
        });

        return [...recentSites].sort((a, b) => {
          const idA = a.id || a.url;
          const idB = b.id || b.url;
          const timeA = this.stats[idA]?.lastVisit || 0;
          const timeB = this.stats[idB]?.lastVisit || 0;
          return timeB - timeA;
        });

      case 'all':
      default:
        // 全部:显示所有网站,按访问权重排序
        return [...sites].sort((a, b) => {
          const idA = a.id || a.url;
          const idB = b.id || b.url;
          return this.getWeight(idB) - this.getWeight(idA);
        });
    }
  }

  /**
   * 获取热门网站 Top N（基于时空隧道算法）
   * @param {number} limit 返回结果数量限制
   * @returns {Array} 热门网站列表
   */
  getTopSites(limit = 10) {
    const siteIds = Object.keys(this.stats)
      .filter(id => this.stats[id] && this.stats[id].visitCount > 0)
      .sort((a, b) => this.getWeight(b) - this.getWeight(a))
      .slice(0, limit);

    return siteIds.map(id => ({
      id,
      weight: this.getWeight(id),
      visitCount: this.stats[id]?.visitCount || 0,
      lastVisit: this.stats[id]?.lastVisit || 0
    }));
  }

  /**
   * 清除所有统计数据
   */
  clearStats() {
    this.stats = {};
    this._saveStats();
  }

  /**
   * 获取当前时间视图描述
   * @param {string} timeView 时空隧道视图
   * @returns {Object} 包含标题和图标的描述对象
   */
  getTimeViewInfo(timeView) {
    const infoMap = {
      frequent: {
        title: '常用',
        icon: '🔥',
        description: '按访问频率和时间衰减智能排序'
      },
      recent: {
        title: '最近',
        icon: '⏰',
        description: '仅显示最近一周内访问过的网站'
      },
      all: {
        title: '全部',
        icon: '📋',
        description: '显示所有网站，按访问权重排序'
      }
    };

    return infoMap[timeView] || infoMap.all;
  }
}

// 导出单例
window.TimeTunnel = new TimeTunnel();