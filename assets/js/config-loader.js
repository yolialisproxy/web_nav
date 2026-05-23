/**
 * 配置加载器
 * 从 data/config.json 异步加载配置并深度合并到 window.CONFIG
 * 提供运行时配置读写接口
 */
(function () {
    'use strict';
    /**
     * 深度合并两个对象（递归版本）
     * 将 source 对象的属性递归合并到 target 对象
     * @param {Object} target 目标对象
     * @param {Object} source 源对象
     */
    function deepMerge(target, source) {
        if (!source || typeof source !== 'object')
            return;
        if (!target || typeof target !== 'object')
            return;
        for (var key in source) {
            if (!source.hasOwnProperty(key))
                continue;
            var sourceVal = source[key];
            var targetVal = target[key];
            if (sourceVal && typeof sourceVal === 'object' && !Array.isArray(sourceVal)) {
                // 源值是对象，目标值也是对象则递归合并
                if (targetVal && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
                    deepMerge(targetVal, sourceVal);
                }
                else {
                    // 目标值不是对象，直接覆盖
                    target[key] = sourceVal;
                }
            }
            else {
                // 非对象值直接覆盖（包括数组、字符串、数字等）
                target[key] = sourceVal;
            }
        }
    }
    /**
     * 根据点号分隔的键路径获取嵌套值
     * @param {Object} obj 源对象
     * @param {string} keyPath 点号分隔的键路径，如 "site.name"
     * @returns {*} 对应的值，未找到返回 undefined
     */
    function getNestedValue(obj, keyPath) {
        if (!keyPath || typeof keyPath !== 'string')
            return undefined;
        var keys = keyPath.split('.');
        var current = obj;
        for (var i = 0; i < keys.length; i++) {
            if (current === null || current === undefined)
                return undefined;
            current = current[keys[i]];
        }
        return current;
    }
    /**
     * 根据点号分隔的键路径设置嵌套值
     * @param {Object} obj 目标对象
     * @param {string} keyPath 点号分隔的键路径，如 "site.name"
     * @param {*} value 要设置的值
     * @returns {boolean} 是否设置成功
     */
    function setNestedValue(obj, keyPath, value) {
        if (!keyPath || typeof keyPath !== 'string')
            return false;
        var keys = keyPath.split('.');
        var current = obj;
        for (var i = 0; i < keys.length - 1; i++) {
            var key = keys[i];
            if (current[key] === undefined || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
        return true;
    }
    // ConfigLoader 对象
    var ConfigLoader = {
        /**
         * 是否已完成初始加载
         * @type {boolean}
         */
        _initialized: false,
        /**
         * 异步加载配置文件并合并到 window.CONFIG
         * 失败时仅输出警告，不阻断执行
         * @returns {Promise<void>}
         */
        loadConfig: function () {
            var self = this;
            return new Promise(function (resolve) {
                // 如果还未初始化 CONFIG，先创建基础对象
                if (!window.CONFIG) {
                    window.CONFIG = {
                        site: {},
                        search: { engines: {}, customEngines: [] },
                        storage: {},
                        admin: {},
                        api: {},
                        features: {},
                        contextAwareness: { contextMap: {} },
                        analytics: {},
                        friendshipLinks: [],
                        categories: { icons: {}, defaultIcon: 'fa-link' },
                        theme: {},
                        ads: {
                            sidebar: { enabled: false, name: '', code: '' },
                            banner: { enabled: false, name: '', code: '' },
                            bottom: { enabled: false, name: '', code: '' }
                        }
                    };
                }
                // 发起 fetch 请求
                fetch('./data/config.json')
                    .then(function (response) {
                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                    }
                    return response.json();
                })
                    .then(function (configData) {
                    // 深度合并配置
                    deepMerge(window.CONFIG, configData);
                    self._initialized = true;
                    resolve();
                })
                    .catch(function (error) {
                    console.warn('[ConfigLoader] 配置文件加载失败，使用默认配置:', error.message);
                    // 静默降级，不阻断后续逻辑
                    self._initialized = true;
                    resolve();
                });
            });
        },
        /**
         * 获取配置值（支持点号分隔的路径）
         * @param {string} key 配置键路径，如 "site.name" 或 "friendshipLinks"
         * @param {*} defaultValue 默认值（可选）
         * @returns {*} 配置值或默认值
         */
        get: function (key, defaultValue) {
            if (!key || typeof key !== 'string')
                return defaultValue;
            var value = getNestedValue(window.CONFIG, key);
            return value !== undefined ? value : defaultValue;
        },
        /**
         * 设置配置值（支持点号分隔的路径）
         * @param {string} key 配置键路径，如 "site.name"
         * @param {*} value 要设置的值
         * @returns {boolean} 是否设置成功
         */
        set: function (key, value) {
            if (!key || typeof key !== 'string')
                return false;
            // 确保 CONFIG 存在
            if (!window.CONFIG) {
                window.CONFIG = {};
            }
            return setNestedValue(window.CONFIG, key, value);
        },
        /**
         * 批量更新配置（深度合并）
         * @param {Object} partialConfig 部分配置对象
         */
        update: function (partialConfig) {
            if (!partialConfig || typeof partialConfig !== 'object')
                return;
            if (!window.CONFIG) {
                window.CONFIG = partialConfig;
            }
            else {
                deepMerge(window.CONFIG, partialConfig);
            }
        },
        /**
         * 重置配置到初始状态（从原始 JSON 重新加载）
         * @returns {Promise<void>}
         */
        reset: function () {
            this._initialized = false;
            return this.loadConfig();
        },
        /**
         * 检查是否已完成初始加载
         * @returns {boolean}
         */
        isInitialized: function () {
            return this._initialized;
        }
    };
    // 暴露到全局
    window.ConfigLoader = ConfigLoader;
    // 自动加载配置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            ConfigLoader.loadConfig();
        });
    }
    else {
        ConfigLoader.loadConfig();
    }
})();
