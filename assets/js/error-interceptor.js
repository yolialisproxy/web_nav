/**
 * 浏览器错误拦截机制
 * 用于捕获和保存浏览器控制台错误、未捕获的JavaScript异常和Promise rejection
 * 这样可以避免盲目修复各种bug，而是基于实际错误日志进行有针对性的修复
 */

(function() {
    'use strict';

    // 错误存储键名
    const ERROR_STORAGE_KEY = 'web_nav_browser_errors';
    // 最大存储错误数量 - 设置为1以只保留最新的错误信息
    const MAX_ERRORS_STORED = 1;
    // 是否启用错误拦截
    const ERROR_INTERCEPTION_ENABLED = true;

    /**
     * 初始化错误拦截机制
     */
    function initErrorInterceptor() {
        if (!ERROR_INTERCEPTION_ENABLED) {
            console.log('[ErrorInterceptor] 错误拦截机制已禁用');
            return;
        }

        console.log('[ErrorInterceptor] 初始化浏览器错误拦截机制...');

        // 捕获控制台错误
        captureConsoleErrors();

        // 捕获未捕获的JavaScript异常
        captureUnhandledExceptions();

        // 捕获未处理的Promise rejection
        captureUnhandledRejections();

        console.log('[ErrorInterceptor] 浏览器错误拦截机制初始化完成');
    }

    /**
     * 捕获控制台错误
     */
    function captureConsoleErrors() {
        // 保存原始console.error方法
        const originalConsoleError = console.error;

        // 重写console.error方法
        console.error = function(...args) {
            // 调用原始方法以保持正常行为
            originalConsoleError.apply(console, args);

            // 捕获错误信息
            if (args.length > 0) {
                const errorMessage = args.map(arg =>
                    typeof arg === 'object' ?
                        (arg.message || arg.toString()) :
                        String(arg)
                ).join(' ');

                storeError({
                    type: 'console.error',
                    message: errorMessage,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    stack: getStackTrace()
                });
            }
        };
    }

    /**
     * 捕获未捕获的JavaScript异常
     */
    function captureUnhandledExceptions() {
        window.addEventListener('error', function(event) {
            storeError({
                type: 'unhandled_exception',
                message: event.message || 'Unknown error',
                filename: event.filename || '',
                lineno: event.lineno || 0,
                colno: event.colno || 0,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                stack: event.error ? getStackTraceFromError(event.error) : ''
            });

            // 阻止默认处理（可选）
            // return false;
        });
    }

    /**
     * 捕获未处理的Promise rejection
     */
    function captureUnhandledRejections() {
        window.addEventListener('unhandledrejection', function(event) {
            let reasonMessage = 'Unknown reason';
            if (event.reason) {
                if (typeof event.reason === 'string') {
                    reasonMessage = event.reason;
                } else if (event.reason instanceof Error) {
                    reasonMessage = event.reason.message || event.reason.toString();
                } else {
                    reasonMessage = event.reason.toString();
                }
            }

            storeError({
                type: 'unhandled_rejection',
                message: reasonMessage,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                stack: event.reason instanceof Error ? getStackTraceFromError(event.reason) : ''
            });
        });
    }

    /**
     * 获取调用栈信息（简单实现）
     */
    function getStackTrace() {
        try {
            throw new Error();
        } catch (e) {
            return e.stack || '';
        }
    }

    /**
     * 从错误对象获取调用栈
     */
    function getStackTraceFromError(error) {
        return error.stack || '';
    }

    /**
     * 存储错误到localStorage
     */
    function storeError(errorData) {
        try {
            // 从localStorage获取现有错误
            let errors = [];
            const storedErrors = localStorage.getItem(ERROR_STORAGE_KEY);
            if (storedErrors) {
                try {
                    errors = JSON.parse(storedErrors);
                } catch (e) {
                    console.warn('[ErrorInterceptor] 解析存储的错误数据失败:', e);
                    errors = [];
                }
            }

            // 添加新错误
            errors.push(errorData);

            // 限制错误数量，只保留最新的错误信息（根据您的要求）
            if (errors.length > MAX_ERRORS_STORED) {
                errors = errors.slice(-MAX_ERRORS_STORED);
            }

            // 保存回localStorage
            localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));

            // 同时输出到控制台便于调试
            console.log('[ErrorInterceptor] 错误已记录:', errorData.type, errorData.message);

        } catch (e) {
            console.error('[ErrorInterceptor] 存储错误失败:', e);
        }
    }

    /**
     * 获取存储的错误（用于调试和分析）
     */
    function getStoredErrors() {
        try {
            const storedErrors = localStorage.getItem(ERROR_STORAGE_KEY);
            return storedErrors ? JSON.parse(storedErrors) : [];
        } catch (e) {
            console.error('[ErrorInterceptor] 获取存储错误失败:', e);
            return [];
        }
    }

    /**
     * 获取最新的错误信息（如果存在的话）
     */
    function getLatestError() {
        const errors = getStoredErrors();
        return errors.length > 0 ? errors[errors.length - 1] : null;
    }

    /**
     * 清除存储的错误
     */
    function clearStoredErrors() {
        try {
            localStorage.removeItem(ERROR_STORAGE_KEY);
            console.log('[ErrorInterceptor] 已清除所有存储的错误');
        } catch (e) {
            console.error('[ErrorInterceptor] 清除存储错误失败:', e);
        }
    }

    /**
     * 导出错误数据（用于导出分析）
     */
    function exportErrors() {
        const errors = getStoredErrors();
        const blob = new Blob([JSON.stringify(errors, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);

        // 创建临时链接进行下载
        const a = document.createElement('a');
        a.href = url;
        a.download = `web_nav_errors_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 公开API
    window.ErrorInterceptor = {
        init: initErrorInterceptor,
        getErrors: getStoredErrors,
        getLatestError: getLatestError, // 新增：获取最新错误
        clearErrors: clearStoredErrors,
        exportErrors: exportErrors
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initErrorInterceptor);
    } else {
        initErrorInterceptor();
    }

})();