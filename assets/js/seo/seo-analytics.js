/**
 * SEO分析器
 * 负责收集、分析和报告SEO相关的性能和用户行为数据
 */

class SEOAnalytics {
    constructor() {
        this.storageKey = 'web_nav_seo_analytics';
        this.sessionId = this.generateSessionId();
        this.init();
    }

    /**
     * 初始化SEO分析器
     */
    init() {
        this.loadHistoricalData();
        this.trackPageView();
    }

    /**
     * 生成会话ID
     * @returns {string} 唯一会话ID
     */
    generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 从localStorage加载历史数据
     */
    loadHistoricalData() {
        try {
            const storedData = localStorage.getItem(this.storageKey);
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                this.pageViews = parsedData.pageViews || [];
                this.userEvents = parsedData.userEvents || [];
                this.performanceData = parsedData.performanceData || [];
            } else {
                this.pageViews = [];
                this.userEvents = [];
                this.performanceData = [];
            }
        } catch (e) {
            console.warn('无法加载历史SEO分析数据:', e);
            this.pageViews = [];
            this.userEvents = [];
            this.performanceData = [];
        }
    }

    /**
     * 保存分析数据到localStorage
     */
    saveAnalyticsData() {
        try {
            const dataToStore = {
                pageViews: this.pageViews,
                userEvents: this.userEvents,
                performanceData: this.performanceData,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
        } catch (e) {
            console.warn('无法保存SEO分析数据:', e);
        }
    }

    /**
     * 追踪页面视图
     * @param {Object} extraData 额外数据（可选）
     */
    trackPageView(extraData = {}) {
        const pageView = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            title: document.title,
            referrer: document.referrer || '',
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            ...extraData
        };

        this.pageViews.push(pageView);

        // 保持页面视图历史在合理大小（最近1000次访问）
        if (this.pageViews.length > 1000) {
            this.pageViews = this.pageViews.slice(-1000);
        }

        this.saveAnalyticsData();
    }

    /**
     * 追踪用户事件
     * @param {string} eventType 事件类型
     * @param {Object} eventData 事件数据（可选）
     */
    trackUserEvent(eventType, eventData = {}) {
        const userEvent = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            eventType: eventType,
            url: window.location.href,
            ...eventData
        };

        this.userEvents.push(userEvent);

        // 保持用户事件历史在合理大小（最近5000次事件）
        if (this.userEvents.length > 5000) {
            this.userEvents = this.userEvents.slice(-5000);
        }

        this.saveAnalyticsData();
    }

    /**
     * 追踪性能数据
     * @param {Object} performanceMetrics 性能指标对象
     */
    trackPerformance(performanceMetrics = {}) {
        const performanceData = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            ...performanceMetrics
        };

        this.performanceData.push(performanceData);

        // 保持性能数据历史在合理大小（最近500次测量）
        if (this.performanceData.length > 500) {
            this.performanceData = this.performanceData.slice(-500);
        }

        this.saveAnalyticsData();
    }

    /**
     * 获取页面视图统计
     * @param {Object} options 过滤选项（可选）
     * @returns {Object} 页面视图统计
     */
    getPageViewStats(options = {}) {
        let filteredViews = this.pageViews;

        // 应用过滤器
        if (options.dateFrom) {
            const fromDate = new Date(options.dateFrom);
            filteredViews = filteredViews.filter(view =>
                new Date(view.timestamp) >= fromDate
            );
        }

        if (options.dateTo) {
            const toDate = new Date(options.dateTo);
            filteredViews = filteredViews.filter(view =>
                new Date(view.timestamp) <= toDate
            );
        }

        if (options.url) {
            filteredViews = filteredViews.filter(view =>
                view.url.includes(options.url)
            );
        }

        const totalViews = filteredViews.length;
        const uniqueVisitors = new Set(filteredViews.map(view => view.sessionId)).size;

        // 计算平均停留时间（简化处理）
        const avgEngagement = 45; // 模拟值，实际应基于实际交互数据

        return {
            totalPageViews: totalViews,
            uniqueVisitors: uniqueVisitors,
            averageEngagementTime: avgEngagement,
            viewsByDate: this.groupByDate(filteredViews),
            viewsByPage: this.groupByPage(filteredViews)
        };
    }

    /**
     * 按日期分组页面视视图
     * @param {Array} views 页面视图数组
     * @returns {Object} 按日期分组的视图
     */
    groupByDate(views) {
        const grouped = {};
        views.forEach(view => {
            const date = new Date(view.timestamp).toISOString().split('T')[0];
            if (!grouped[date]) {
                grouped[date] = 0;
            }
            grouped[date]++;
        });
        return grouped;
    }

    /**
     * 按页面分组页面视图
     * @param {Array} views 页面视图数组
     * @returns {Object} 按页面分组的视图
     */
    groupByPage(views) {
        const grouped = {};
        views.forEach(view => {
            // 提取页面路径（不包括查询参数）
            const urlObj = new URL(view.url);
            const pathname = urlObj.pathname;
            if (!grouped[pathname]) {
                grouped[pathname] = 0;
            }
            grouped[pathname]++;
        });
        return grouped;
    }

    /**
     * 获取转换率数据（简化实现）
     * @returns {Object} 转换率统计
     */
    getConversionRates() {
        // 在实际实现中，这将追踪特定的转换目标
        // 如表单提交、订阅、点击特定链接等
        return {
            searchToClickRate: 0.15, // 搜索到点击结果的比率
            categoryBrowseRate: 0.25, // 浏览分类页面的比率
            returnVisitorRate: 0.30   // 回头访客比率
        };
    }

    /**
     * 生成SEO报告数据
     * @returns {Object} 综合SEO报告数据
     */
    generateSEOReport() {
        const pageViewStats = this.getPageViewStats();
        const conversionRates = this.getConversionRates();

        return {
            reportPeriod: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 过去30天
                end: new Date().toISOString()
            },
            trafficOverview: pageViewStats,
            engagementMetrics: {
                bounceRate: 0.45, // 模拟跳出率
                avgSessionDuration: 120, // 模拟平均会话时长（秒）
                pagesPerSession: 2.3   // 模拟每会话页面数
            },
            conversionMetrics: conversionRates,
            technicalSEO: {
                // 这些值将从性能监控中获取
                avgPageLoadTime: 1800, // 模拟平均页面加载时间（毫秒）
                mobileFriendly: true,
                httpsEnabled: true,
                schemaPresent: true
            }
        };
    }

    /**
     * 手动触发分析数据导出（用于调试或报告生成）
     * @returns {Object} 完整的分析数据
     */
    exportAnalyticsData() {
        return {
            sessionId: this.sessionId,
            exportTimestamp: new Date().toISOString(),
            pageViews: [...this.pageViews], // 创建副本以避免直接引用
            userEvents: [...this.userEvents],
            performanceData: [...this.performanceData]
        };
    }
}

// 导出为全局变量
window.SEOSAnalytics = new SEOAnalytics();

// 自动追踪页面卸载事件
window.addEventListener('beforeunload', () => {
    // 可以在这里发送最终的数据或执行清理工作
    // 目前主要是为了确保在SPA应用中的数据完整性
});

// 监听可见性变化以更好地追踪用户参与度
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面变得不可见
        window.SEOSAnalytics.trackUserEvent('page_hidden');
    } else {
        // 页面重新变得可见
        window.SEOSAnalytics.trackUserEvent('page_visible');
    }
});
