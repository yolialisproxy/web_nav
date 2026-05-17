/**
 * 啃魂导航 3.0 - 增强智能记忆系统
 * EnhancedMemorySorter: 跟踪用户点击习惯，智能排序网站，并提供预测性建议
 *
 * 职责：
 * - 记录网站点击频率
 * - 基于点击频率动态排序
 * - 记录和学习点击序列模式
 * - 上下文感知权重调整
 * - 预测性网站推荐
 * - 持久化数据到 localStorage
 */

class MemorySorter {
  constructor() {
    this.storageKey = 'kenhun_click_stats';
    this.sequenceStorageKey = 'kenhun_click_sequences';
    this.contextStorageKey = 'kenhun_context_boost';

    // 加载所有存储的数据
    const storedData = this._loadAllStats();
    this.stats = storedData.stats || {};
    this.sequences = storedData.sequences || {};
    this.contextBoost = storedData.contextBoost || {};

    // 跟踪最后点击的网站ID，用于序列记录
    this.lastClickedSiteId = null;
  }

  /**
   * 从 localStorage 加载所有统计数据
   */
  _loadAllStats() {
    try {
      const stats = localStorage.getItem(this.storageKey);
      const sequences = localStorage.getItem(this.sequenceStorageKey);
      const contextBoost = localStorage.getItem(this.contextStorageKey);

      return {
        stats: stats ? JSON.parse(stats) : {},
        sequences: sequences ? JSON.parse(sequences) : {},
        contextBoost: contextBoost ? JSON.parse(contextBoost) : {}
      };
    } catch (e) {
      console.warn('[MemorySorter] 加载统计失败:', e);
      return {
        stats: {},
        sequences: {},
        contextBoost: {}
      };
    }
  }

  /**
   * 保存所有统计数据到 localStorage
   */
  _saveStats() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.stats));
      localStorage.setItem(this.sequenceStorageKey, JSON.stringify(this.sequences));
      localStorage.setItem(this.contextStorageKey, JSON.stringify(this.contextBoost));
    } catch (e) {
      console.warn('[MemorySorter] 保存统计失败:', e);
    }
  }

  /**
   * 私有方法：记录点击序列
   * @param {string} fromSiteId 来源网站ID
   * @param {string} toSiteId 目标网站ID
   */
  _recordSequence(fromSiteId, toSiteId) {
    if (!fromSiteId || !toSiteId) return;

    // 初始化来源网站的序列记录
    if (!this.sequences[fromSiteId]) {
      this.sequences[fromSiteId] = {};
    }

    // 增加序列计数
    this.sequences[fromSiteId][toSiteId] = (this.sequences[fromSiteId][toSiteId] || 0) + 1;
  }

  /**
   * 记录网站点击
   */
  recordClick(siteId) {
    if (!siteId) return;

    // 记录序列：如果有上次点击的网站，则记录从上次网站到当前网站的序列
    if (this.lastClickedSiteId) {
      this._recordSequence(this.lastClickedSiteId, siteId);
    }
    // 更新最后点击的网站
    this.lastClickedSiteId = siteId;

    // 记录点击频率
    this.stats[siteId] = (this.stats[siteId] || 0) + 1;

    this.stats[`${siteId}_last`] = Date.now();

    this._saveStats();
    // 防抖保存
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => this._saveStats(), 500);
  }

  /**
   * 获取网站的点击权重（考虑时间衰减）
   */
  getWeight(siteId) {
    const clicks = this.stats[siteId] || 0;
    const lastClick = this.stats[`${siteId}_last`] || 0;

    if (clicks === 0) return 0;

    // 时间衰减：30天内权重减半
    const daysSinceClick = (Date.now() - lastClick) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(0.9, daysSinceClick);

    return clicks * decayFactor;
  }

  /**
   * 根据点击频率排序网站（向后兼容版本）
   * @param {Array} sites 网站列表
   * @returns {Array} 排序后的网站列表
   */
  sortByFrequency(sites) {
    return [...sites].sort((a, b) => {
      const idA = a.id || a.url;
      const idB = b.id || b.url;
      return this.getWeight(idB) - this.getWeight(idA);
    });
  }

  /**
   * 根据增强权重排序网站（增强版本）
   * @param {Array} sites 网站列表
   * @param {Object} context 当前上下文（可选）
   * @param {string} currentSiteId 当前网站ID（可选，用于序列预测）
   * @returns {Array} 排序后的网站列表
   */
  sortByEnhancedFrequency(sites, context = {}, currentSiteId = null) {
    return [...sites].sort((a, b) => {
      const idA = a.id || a.url;
      const idB = b.id || b.url;
      const weightA = this.getEnhancedWeight(idA, context, currentSiteId);
      const weightB = this.getEnhancedWeight(idB, context, currentSiteId);
      return weightB - weightA;
    });
  }

  /**
   * 获取热门网站 Top N
   */
  getTopSites(n = 10) {
    const entries = Object.entries(this.stats)
      .filter(([key]) => !key.endsWith('_last'))
      .sort(([, a], [, b]) => b - a)
      .slice(0, n);

    return entries.map(([id, clicks]) => ({ id, clicks }));
  }

  /**
   * 清除所有统计数据
   */
  clearStats() {
    this.stats = {};
    this.sequences = {};
    this.contextBoost = {};
    this.lastClickedSiteId = null;
    this._saveStats();
  }

  /**
   * 获取序列权重：从 fromSiteId 到 toSiteId 的转移概率
   * @param {string} fromSiteId 来源网站ID
   * @param {string} toSiteId 目标网站ID
   * @returns {number} 序列权重
   */
  getSequenceWeight(fromSiteId, toSiteId) {
    if (!fromSiteId || !toSiteId || !this.sequences[fromSiteId]) {
      return 0;
    }

    const fromSequences = this.sequences[fromSiteId];
    const toCount = fromSequences[toSiteId] || 0;
    const totalFrom = Object.values(fromSequences).reduce((sum, count) => sum + count, 0);

    return totalFrom > 0 ? toCount / totalFrom : 0;
  }

  /**
   * 获取上下文增强权重：根据当前上下文提升特定网站的权重
   * @param {string} siteId 网站ID
   * @param {Object} context 上下文对象，包含name、categories等
   * @returns {number} 上下文增强因子（>=1.0）
   */
  getContextBoost(siteId, context) {
    if (!siteId || !context || !context.categories) {
      return 1.0; // 没有上下文信息时不增强
    }

    // 获取网站信息
    const site = window.DataManager.searchIndex.find(s => s.id === siteId || s.url === siteId);
    if (!site) {
      return 1.0; // 网站不存在时返回基础值
    }

    // 获取网站的所有分类
    const siteCategories = [
      site._bigCategory,
      site._middleCategory,
      site._minorCategory
    ].filter(Boolean); // 过滤掉空值

    // 如果网站没有分类信息，返回基础增强
    if (siteCategories.length === 0) {
      return 1.2; // 默认上下文增强20%
    }

    // 计算匹配度
    const contextCategories = context.categories;
    let matchCount = 0;

    // 检查网站的每个分类是否在上下文categories中
    for (const siteCat of siteCategories) {
      if (contextCategories.includes(siteCat)) {
        matchCount++;
      }
    }

    // 基于匹配比例计算增强因子
    const matchRatio = matchCount / siteCategories.length;

    // 至少提供10%的基础增强，完全匹配时提供最高增强
    const baseBoost = 1.1; // 10% 基础增强
    const maxBoost = 1.5;  // 50% 最大增强

    return baseBoost + (maxBoost - baseBoost) * matchRatio;
  }

  /**
   * 预测下一可能访问的网站
   * @param {string} currentSiteId 当前网站ID（可选）
   * @param {Object} context 当前上下文（可选）
   * @param {number} limit 返回预测结果的数量限制
   * @returns {Array} 预测的网站ID列表，按可能性排序
   */
  predictNextSites(currentSiteId, context, limit = 5) {
    const predictions = [];

    // 如果有当前网站，基于序列进行预测
    if (currentSiteId && this.sequences[currentSiteId]) {
      const fromSequences = this.sequences[currentSiteId];
      const sequenceEntries = Object.entries(fromSequences)
        .map(([toSiteId, count]) => ({
          siteId: toSiteId,
          weight: count,
          type: 'sequence'
        }))
        .sort((a, b) => b.weight - a.weight);

      predictions.push(...sequenceEntries.slice(0, Math.ceil(limit / 2)));
    }

    // 如果有上下文，可以基于上下文进行预测（需要网站分类信息）
    // 暂时跳过，待网站数据结构可用时实现

    // 结合热门网站作为补充
    if (predictions.length < limit) {
      const topSites = this.getTopSites(limit);
      const topSiteIds = new Set(predictions.map(p => p.siteId));
      for (const site of topSites) {
        if (!topSiteIds.has(site.id) && predictions.length < limit) {
          predictions.push({
            siteId: site.id,
            weight: site.clicks,
            type: 'frequency'
          });
          topSiteIds.add(site.id);
        }
      }
    }

    // 按权重排序并返回前limit个结果
    return predictions
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(p => p.siteId);
  }

  /**
   * 获取增强权重：结合频率、时间衰减、序列和上下文因素
   * @param {string} siteId 网站ID
   * @param {Object} context 当前上下文（可选）
   * @param {string} currentSiteId 当前网站ID（可选，用于序列预测）
   * @returns {number} 增强权重
   */
  getEnhancedWeight(siteId, context = {}, currentSiteId = null) {
    // 基础权重：频率 × 时间衰减
    const baseWeight = this.getWeight(siteId);
    if (baseWeight === 0) {
      return 0;
    }

    let enhancedWeight = baseWeight;

    // 序列增强：如果有当前网站，添加序列预测权重
    if (currentSiteId) {
      const sequenceWeight = this.getSequenceWeight(currentSiteId, siteId);
      if (sequenceWeight > 0) {
        // 序列权重乘以一个因子（序列预测通常比纯频率更有价值）
        enhancedWeight += sequenceWeight * 50; // 可以调整这个因子
      }
    }

    // 上下文增强
    const contextBoost = this.getContextBoost(siteId, context);
    enhancedWeight *= contextBoost;

    return enhancedWeight;

  }
}

// 导出单例
window.MemorySorter = new MemorySorter();
