/**
 * 啃魂导航 3.0 - 上下文感知系统
 * ContextAwareness: 根据当前环境智能推荐相关工具
 *
 * 职责：
 * - 监测当前打开的网站
 * - 识别用户上下文场景
 * - 智能推荐相关工具网站
 * - 基于时间/场景自动切换
 */

class ContextAwareness {
  constructor() {
    this.referrer = document.referrer;
    this.currentHour = new Date().getHours();
    this.dayOfWeek = new Date().getDay();

    // 上下文映射表
    this.contextMap = {
      // 开发场景
      'github.com': {
        name: '开发模式',
        categories: ['开发资源', 'AI智能', '办公效率'],
        priority: ['ide', 'docs', 'debug', 'ai'],
        icon: '💻'
      },
      'gitlab.com': {
        name: '开发模式',
        categories: ['开发资源', '办公效率'],
        icon: '💻'
      },
      'stackoverflow.com': {
        name: '开发模式',
        categories: ['开发资源', 'AI智能'],
        icon: '💻'
      },

      // 搜索场景
      'google.com': {
        name: '搜索模式',
        categories: ['AI智能', '办公效率'],
        icon: '🔍'
      },
      'baidu.com': {
        name: '搜索模式',
        categories: ['AI智能', '办公效率'],
        icon: '🔍'
      },
      'bing.com': {
        name: '搜索模式',
        categories: ['AI智能', '办公效率'],
        icon: '🔍'
      },

      // 视频场景
      'youtube.com': {
        name: '视频模式',
        categories: ['视频娱乐', '创意工具'],
        icon: '📺'
      },
      'bilibili.com': {
        name: '视频模式',
        categories: ['视频娱乐', '学习教育'],
        icon: '📺'
      },

      // 设计场景
      'figma.com': {
        name: '设计模式',
        categories: ['创意工具', 'AI智能'],
        icon: '🎨'
      },
      'dribbble.com': {
        name: '设计模式',
        categories: ['创意工具'],
        icon: '🎨'
      },

      // 学习场景
      'zhihu.com': {
        name: '学习模式',
        categories: ['学习教育', 'AI智能'],
        icon: '📚'
      },
      'wikipedia.org': {
        name: '学习模式',
        categories: ['学习教育', '办公效率'],
        icon: '📚'
      },

      // 工作场景
      'slack.com': {
        name: '工作模式',
        categories: ['办公效率', '开发资源'],
        icon: '📋'
      },
      'notion.so': {
        name: '工作模式',
        categories: ['办公效率', '学习教育'],
        icon: '📋'
      },

      // 娱乐场景
      'weibo.com': {
        name: '娱乐模式',
        categories: ['视频娱乐'],
        icon: '🎮'
      },
      'twitter.com': {
        name: '娱乐模式',
        categories: ['视频娱乐'],
        icon: '🎮'
      },
      'x.com': {
        name: '娱乐模式',
        categories: ['视频娱乐'],
        icon: '🎮'
      }
    };
  }

  /**
   * 检测当前上下文
   */
  detectContext() {
    // 优先检查来源网站
    if (this.referrer) {
      try {
        const hostname = new URL(this.referrer).hostname;
        for (const [domain, context] of Object.entries(this.contextMap)) {
          if (hostname.includes(domain)) {
            return {
              ...context,
              matched: domain,
              source: 'referrer'
            };
          }
        }
      } catch (e) {}
    }

    // 基于时间检测
    return this._detectByTime();
  }

  /**
   * 基于时间检测场景
   */
  _detectByTime() {
    const hour = this.currentHour;
    const isWeekend = this.dayOfWeek === 0 || this.dayOfWeek === 6;

    // 工作日
    if (!isWeekend) {
      if (hour >= 9 && hour < 12) {
        return {
          name: '工作时间',
          categories: ['开发资源', '办公效率', '学习平台'],
          icon: '💼',
          source: 'time'
        };
      }
      if (hour >= 14 && hour < 18) {
        return {
          name: '工作时间',
          categories: ['开发资源', '办公效率'],
          icon: '💼',
          source: 'time'
        };
      }
      if (hour >= 19 && hour < 23) {
        return {
          name: '晚间学习',
          categories: ['学习平台', 'AI智能', '创意工具'],
          icon: '🌙',
          source: 'time'
        };
      }
      if (hour >= 23 || hour < 6) {
        return {
          name: '深夜模式',
          categories: ['视频娱乐', '办公效率'],
          icon: '🌃',
          source: 'time'
        };
      }
    } else {
      // 周末
      return {
        name: '周末模式',
        categories: ['视频娱乐', '学习教育', '创意工具'],
        icon: '☀️',
        source: 'time'
      };
    }

    // 默认
    return {
      name: '通用模式',
      categories: ['AI智能', '办公效率'],
      icon: '📍',
      source: 'default'
    };
  }

  /**
   * 获取推荐的分类列表
   */
  getRecommendedCategories() {
    const context = this.detectContext();
    return context.categories || [];
  }

  /**
   * 过滤网站列表，优先显示相关网站
   */
  prioritizeSites(sites) {
    const context = this.detectContext();
    const priorityCategories = context.categories || [];

    return [...sites].sort((a, b) => {
      const aPriority = priorityCategories.includes(a.bigCategory) ? 1 : 0;
      const bPriority = priorityCategories.includes(b.bigCategory) ? 1 : 0;
      return bPriority - aPriority;
    });
  }

  /**
   * 显示上下文提示
   */
  getContextHint() {
    const context = this.detectContext();
    return {
      text: `已进入 ${context.name}`,
      icon: context.icon,
      source: context.source
    };
  }
}

// 导出单例
window.ContextAwareness = new ContextAwareness();
