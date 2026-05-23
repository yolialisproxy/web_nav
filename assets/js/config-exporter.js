/**
 * 配置导出引擎
 * 负责将 localStorage 中的管理后台配置合并并导出为部署文件
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
(function () {
    'use strict';
    /**
     * 导出配置为文件
     * 从 localStorage 读取配置，与 config.js 默认值合并，生成两个下载文件：
     * 1. data/config.json - 完整配置数据
     * 2. update-config.sh - Git 自动提交脚本
     */
    function exportConfig() {
        // 检查是否有配置变更
        var ads = localStorage.getItem('admin_ads_config');
        var friendshipLinks = localStorage.getItem('admin_friendship_links');
        var siteConfig = localStorage.getItem('admin_site_config');
        var searchConfig = localStorage.getItem('admin_search_config');
        if (!ads && !friendshipLinks && !siteConfig) {
            alert('暂无配置变更，请先在广告管理/友链管理/系统配置中修改并保存');
            return;
        }
        try {
            // 获取 config.js 中的默认配置作为兜底
            var defaultConfig = window.CONFIG || {};
            // 构建完整的 config 对象
            var config = {
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
                    var parsedSearch = JSON.parse(searchConfig);
                    config.search.customEngines = parsedSearch.customEngines || [];
                }
                catch (e) {
                    console.warn('搜索配置解析失败，使用默认值', e);
                }
            }
            // 合并 site 配置（如果存在）
            if (siteConfig) {
                try {
                    var parsedSite = JSON.parse(siteConfig);
                    config.site = __assign(__assign({}, config.site), parsedSite);
                }
                catch (e) {
                    console.warn('站点配置解析失败', e);
                }
            }
            // 合并友谊链接（如果存在）
            if (friendshipLinks) {
                try {
                    config.friendshipLinks = JSON.parse(friendshipLinks);
                }
                catch (e) {
                    console.warn('友谊链接解析失败', e);
                }
            }
            // 生成配置 JSON 字符串
            var configJson = JSON.stringify(config, null, 2);
            // 生成 bash 脚本内容
            var bashScript_1 = "#!/bin/bash\n# \u5543\u9B42\u5BFC\u822A\u914D\u7F6E\u66F4\u65B0\u811A\u672C\n# \u4F7F\u7528\u8BF4\u660E\uFF1A\u5C06\u6B64\u811A\u672C\u4E0E data/config.json \u653E\u5728\u9879\u76EE\u6839\u76EE\u5F55\uFF0C\u53CC\u51FB\u8FD0\u884C\u5373\u53EF\u5B8C\u6210 git \u63D0\u4EA4\nSCRIPT_DIR=\"$(cd \"$(dirname \"$0\")\" && pwd)\"\nCONFIG_FILE=\"$SCRIPT_DIR/data/config.json\"\nif [ -f \"$CONFIG_FILE\" ]; then\n  cd \"$SCRIPT_DIR\"\n  git add data/config.json\n  git commit -m \"chore: \u81EA\u52A8\u66F4\u65B0\u7F51\u7AD9\u914D\u7F6E $(date '+%Y-%m-%d %H:%M:%S')\"\n  echo \"\u2705 \u914D\u7F6E\u5DF2\u66F4\u65B0\u5E76\u63D0\u4EA4\u5B8C\u6210\uFF01\"\nelse\n  echo \"\u274C \u9519\u8BEF\uFF1A\u627E\u4E0D\u5230 $CONFIG_FILE\"\n  echo \"\u8BF7\u786E\u4FDD data/config.json \u5DF2\u4E0B\u8F7D\u5230\u6B63\u786E\u4F4D\u7F6E\"\n  exit 1\nfi\n";
            // 触发文件下载
            downloadFile('data/config.json', configJson, 'application/json');
            setTimeout(function () {
                downloadFile('update-config.sh', bashScript_1, 'text/plain');
            }, 300);
        }
        catch (e) {
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
        var blob = new Blob([content], { type: mimeType });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
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
