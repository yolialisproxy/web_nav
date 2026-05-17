/**
 * 配置导出引擎
 * 负责将 localStorage 中的管理后台配置合并并导出为部署文件
 */

(function() {
    'use strict';

    /**
     * 导出配置为文件
     * 从 localStorage 读取配置，与 config.js 默认值合并，生成两个下载文件：
     * 1. data/config.json - 完整配置数据
     * 2. update-config.sh - Git 自动提交脚本
     */
    function exportConfig() {
        // 检查是否有配置变更
        const ads = localStorage.getItem('admin_ads_config');
        const friendshipLinks = localStorage.getItem('admin_friendship_links');
        const siteConfig = localStorage.getItem('admin_site_config');
        const searchConfig = localStorage.getItem('admin_search_config');

        if (!ads && !friendshipLinks && !siteConfig) {
            alert('暂无配置变更，请先在广告管理/友链管理/系统配置中修改并保存');
            return;
        }

        try {
            // 获取 config.js 中的默认配置作为兜底
            const defaultConfig = window.CONFIG || {};

            // 构建完整的 config 对象
            const config = {
                site: defaultConfig.site || {},
                theme: defaultConfig.theme || {},
                search: defaultConfig.search || {},
                storage: defaultConfig.storage || {},
                admin: defaultConfig.admin || {},
                api: defaultConfig.api || {},
                features: defaultConfig.features || {},
                contextAwareness: defaultConfig.contextAwareness || {},
                analytics: defaultConfig.analytics || {},
                enableAnalytics: defaultConfig.enableAnalytics !== undefined ? defaultConfig.enableAnalytics : true,
                categories: defaultConfig.categories || {}
            };

            // 如果有自定义搜索配置，合并进去
            if (searchConfig) {
                try {
                    const parsedSearch = JSON.parse(searchConfig);
                    config.search.customEngines = parsedSearch.customEngines || [];
                } catch(e) {
                    console.warn('搜索配置解析失败，使用默认值', e);
                }
            }

            // 合并 site 配置（如果存在）
            if (siteConfig) {
                try {
                    const parsedSite = JSON.parse(siteConfig);
                    config.site = { ...config.site, ...parsedSite };
                } catch(e) {
                    console.warn('站点配置解析失败', e);
                }
            }

            // 合并友谊链接（如果存在）
            if (friendshipLinks) {
                try {
                    config.friendshipLinks = JSON.parse(friendshipLinks);
                } catch(e) {
                    console.warn('友谊链接解析失败', e);
                }
            }

            // 生成配置 JSON 字符串
            const configJson = JSON.stringify(config, null, 2);

            // 生成 bash 脚本内容
            const bashScript = `#!/bin/bash
# 啃魂导航配置更新脚本
# 使用说明：将此脚本与 data/config.json 放在项目根目录，双击运行即可完成 git 提交
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/data/config.json"
if [ -f "$CONFIG_FILE" ]; then
  cd "$SCRIPT_DIR"
  git add data/config.json
  git commit -m "chore: 自动更新网站配置 $(date '+%Y-%m-%d %H:%M:%S')"
  echo "✅ 配置已更新并提交完成！"
else
  echo "❌ 错误：找不到 $CONFIG_FILE"
  echo "请确保 data/config.json 已下载到正确位置"
  exit 1
fi
`;

            // 触发文件下载
            downloadFile('data/config.json', configJson, 'application/json');
            setTimeout(function() {
                downloadFile('update-config.sh', bashScript, 'text/plain');
            }, 300);

        } catch(e) {
            console.error('导出配置失败:', e);
            alert('导出配置失败，请检查控制台获取详细信息');
        }
    }

    /**
     * 触发文件下载
     * @param {string} filename - 文件名
     * @param {string} content - 文件内容
     * @param {string} mimeType - MIME 类型
     */
    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 暴露到全局
    window.ConfigExporter = {
        exportConfig: exportConfig
    };

})();
