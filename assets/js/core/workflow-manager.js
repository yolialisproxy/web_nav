/**
 * 啃魂导航 3.0 - 一键工作流系统
 * workflow-manager.js: 管理预设工作流，支持一键批量打开多个网站
 */
class WorkflowManager {
    constructor() {
        this.storageKey = 'kenhun_workflows';
        this.defaultWorkflows = [
            {
                id: 'work-morning',
                name: '开始上班',
                icon: '💼',
                description: '打开日常工作必备网站',
                sites: [
                    { name: '邮箱', url: 'https://mail.google.com' },
                    { name: 'GitHub', url: 'https://github.com' },
                    { name: '钉钉', url: 'https://www.dingtalk.com' }
                ]
            },
            {
                id: 'work-afternoon',
                name: '下午茶时间',
                icon: '☕',
                description: '休息一下',
                sites: [
                    { name: '知乎', url: 'https://www.zhihu.com' },
                    { name: '微博', url: 'https://weibo.com' }
                ]
            },
            {
                id: 'entertainment',
                name: '摸鱼时间',
                icon: '🎮',
                description: '娱乐休闲网站合集',
                sites: [
                    { name: 'B站', url: 'https://www.bilibili.com' },
                    { name: '抖音', url: 'https://www.douyin.com' },
                    { name: '微博', url: 'https://weibo.com' }
                ]
            },
            {
                id: 'study',
                name: '学习模式',
                icon: '📚',
                description: '专注学习网站',
                sites: [
                    { name: 'GitHub', url: 'https://github.com' },
                    { name: 'MDN', url: 'https://developer.mozilla.org' },
                    { name: 'Stack Overflow', url: 'https://stackoverflow.com' }
                ]
            }
        ];
    }

    /**
     * 获取所有工作流
     */
    getWorkflows() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('[WorkflowManager] 读取工作流失败:', e);
        }
        return this.defaultWorkflows;
    }

    /**
     * 保存工作流
     */
    saveWorkflows(workflows) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(workflows));
        } catch (e) {
            console.warn('[WorkflowManager] 保存工作流失败:', e);
        }
    }

    /**
     * 批量打开工作流中的所有网站
     */
    executeWorkflow(workflowId) {
        const workflows = this.getWorkflows();
        const workflow = workflows.find(w => w.id === workflowId);

        if (!workflow || !workflow.sites || workflow.sites.length === 0) {
            return false;
        }

        // 逐个打开网站（延迟一点点避免被浏览器拦截）
        workflow.sites.forEach((site, index) => {
            setTimeout(() => {
                window.open(site.url, '_blank');
            }, index * 100);
        });

        return true;
    }

    /**
     * 添加自定义工作流
     */
    addWorkflow(workflow) {
        const workflows = this.getWorkflows();
        workflow.id = 'custom-' + Date.now();
        workflows.push(workflow);
        this.saveWorkflows(workflows);
        return workflow;
    }

    /**
     * 删除工作流
     */
    removeWorkflow(workflowId) {
        const workflows = this.getWorkflows();
        const filtered = workflows.filter(w => w.id !== workflowId);
        this.saveWorkflows(filtered);
    }
}

window.WorkflowManager = WorkflowManager;