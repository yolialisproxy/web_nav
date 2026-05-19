/**
 * 啃魂导航 3.0 - 主入口
 * main.js: 程序初始化和启动
 */

(function() {
    'use strict';

    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        try {
            console.log('[DEBUG] init() function started');
            // 等待 ConfigLoader 加载外部配置
            if (window.ConfigLoader) {
              await window.ConfigLoader.loadConfig();
            }

            // 初始化用户管理器（如果还没有初始化的话）
            if (window.UserManager && typeof window.UserManager.initPromise === 'undefined') {
                window.UserManager.initPromise = Promise.resolve();
            }

            // 初始化数据管理器
            if (window.DataManager) {
                console.log('[DEBUG] DataManager found, initializing...');
                await window.DataManager.initialize();
                console.log('[DEBUG] DataManager initialized');
            } else {
                console.log('[DEBUG] DataManager NOT found!');
            }

            // 创建并初始化 UI 管理器
            const uiManager = new window.UIManager();
            await uiManager.initialize();

            // 渲染友谊链接（使用 ConfigLoader 或 CONFIG）
            renderFriendshipLinks();

            // 移除加载状态
            document.body.classList.add('app-ready');

            // 显示界面
            document.documentElement.style.visibility = '';
        } catch (error) {
            console.error('[Kenhun Nav 3.0] 初始化失败:', error);
            console.error('错误堆栈:', error.stack);
            showError();
        }
    }

    /**
     * 渲染友谊链接
     * 从 window.CONFIG.friendshipLinks 或 ConfigLoader 获取数据
     */
    function renderFriendshipLinks() {
        const container = document.getElementById('friendship-links');
        if (!container) return;

        let links = [];
        if (window.ConfigLoader) {
            links = window.ConfigLoader.get('friendshipLinks', []);
        } else if (window.CONFIG && window.CONFIG.friendshipLinks) {
            links = window.CONFIG.friendshipLinks;
        }

        if (!links || links.length === 0) {
            const section = document.getElementById('friendship-section');
            if (section) section.style.display = 'none';
            return;
        }

        // 预分配数组以减少内存重分配
        const htmlParts = new Array(links.length);

        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const icon = link.icon || '🔗';
            const name = escapeHtml(link.name || '链接');
            const url = escapeHtml(link.url || '#');
            const description = escapeHtml(link.description || '友情链接网站');

            let iconElement;
            if (icon && icon !== '🔗' && icon !== '🐙') {
                iconElement = `<img class="site-icon" src="${icon}" alt="${name}" onerror="this.classList.add('error')">`;
            } else {
                iconElement = `<div class="site-icon icon-fallback">${icon || '🔗'}</div>`;
            }

            htmlParts[i] = `
                <a class="site-card" href="${url}" target="_blank" rel="noopener noreferrer" data-site-id="${url}">
                    ${iconElement}
                    <div class="site-info">
                        <div class="site-name">${name}</div>
                        <div class="site-description">${description}</div>
                    </div>
                </a>`;
        }

        container.innerHTML = htmlParts.join('');
    }

    /**
     * HTML 转义防止 XSS - 优化版本，避免创建DOM元素
     */
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function showError() {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div style="display: flex; align-items: center; justify-center; height: 100vh; flex-direction: column; gap: 16px; padding: 24px; text-align: center;">
                    <div style="font-size: 48px;">⚠️</div>
                    <div style="font-size: 18px; font-weight: 600;">加载失败</div>
                    <div style="color: #718096; font-size: 14px;">请刷新页面重试</div>
                </div>
            `;
        }
    }

})();