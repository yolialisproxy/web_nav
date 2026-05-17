/**
 * 啃魂导航 3.0 - 智能搜索路由
 * search-router.js: 处理搜索意图并分发至最佳搜索引擎
 */
class SearchRouter {
    constructor() {
        this.config = window.CONFIG.search;
        this.intentMap = {
            // 编程相关
            programming: {
                keywords: ['python', 'js', 'javascript', 'html', 'css', 'java', 'cpp', 'golang', 'rust', 'api', 'git', 'github', 'stackoverflow', 'vscode', 'docker', 'kubernetes', 'react', 'vue', 'angular', '编程', '代码', '开发', '软件', '框架', '库', '函数', '变量', '类', '接口', '算法', '数据结构', '机器学习', '深度学习', '人工智能', '神经网络', 'AI', 'ML', 'DL'],
                engine: 'google'
            },
            // 学术/专业相关
            academic: {
                keywords: ['scholar', 'arxiv', 'paper', 'thesis', 'pubmed', 'ieeexplore', '学术', '论文', '期刊', '研究', '调查', '统计', '实验', '理论', '文献', '引用', '摘要', '会议', '期刊', '校园', '学校', '大学', '学习', '教育', '培训', '课程', '教程', '讲义'],
                engine: 'scholar'
            },
            // 生活/日常相关
            life: {
                keywords: ['生活', '新闻', '天气', '菜谱', '做饭', '旅游', '景点', '酒店', '机票', '火车', '电影', '电视剧', '综艺', '音乐', '歌曲', '明星', '娱乐', '购物', '电商', '淘宝', '京东', '拼多多', '价格', '打折', '优惠', '健康', '医院', '医生', '药品', '体育', '运动', '足球', '篮球', '赛事', '比赛', '直播'],
                engine: 'baidu'
            },
            // AI 相关
            ai: {
                keywords: ['chatgpt', 'claude', 'gpt', 'llm', 'prompt', 'midjourney', 'stable diffusion', 'ai', '智能体', '智能助手', '对话机器人', '语言模型'],
                engine: 'doubao' // 默认路由到 AI 搜索
            },
            // 磁力/资源相关
            resource: {
                keywords: ['magnet', 'torrent', '磁力', '种子', '资源', '下载', 'BT', '种子搜索', '磁力链接', '资源站', '资源下载'],
                engine: 'bing' // 磁力搜索通常在 Bing 等通用搜索引擎中通过特定关键词效果更好
            }
        };
    }

    /**
     * 根据查询词决定使用的搜索引擎
     * @param {string} query
     * @returns {string} 搜索引擎 ID
     */
    route(query) {
        const lowerQuery = query.toLowerCase().trim();
        if (!lowerQuery) return this.config.default;

        // 1. 检查是否匹配特定意图（按优先级顺序）
        // 先检查更具体的意图，避免误匹配
        const intentScores = {};

        // 计算每个意图的匹配分数
        for (const [intent, data] of Object.entries(this.intentMap)) {
            let score = 0;
            for (const keyword of data.keywords) {
                if (lowerQuery.includes(keyword)) {
                    // 关键词越长，匹配越具体，分数越高
                    score += keyword.length;
                }
            }
            if (score > 0) {
                intentScores[intent] = score;
            }
        }

        // 找到分数最高的意图
        if (Object.keys(intentScores).length > 0) {
            const bestIntent = Object.keys(intentScores).reduce((a, b) =>
                intentScores[a] > intentScores[b] ? a : b);
            return this.intentMap[bestIntent].engine;
        }

        // 2. 检查是否是直接的引擎名称
        for (const engineId of Object.keys(this.config.engines)) {
            if (lowerQuery.includes(engineId)) {
                return engineId;
            }
        }

        // 3. 回退到默认引擎
        return this.config.default;
    }

    /**
     * 执行搜索跳转
     * @param {string} query
     */
    execute(query) {
        const engineId = this.route(query);
        const engine = this.config.engines[engineId] || this.config.engines[this.config.default];

        if (engine && engine.url) {
            window.open(`${engine.url}${encodeURIComponent(query)}`, '_blank');
        }
    }
}

window.SearchRouter = SearchRouter;
