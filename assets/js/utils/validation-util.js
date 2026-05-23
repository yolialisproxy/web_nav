/**
 * 校验工具类 (ValidationUtil)
 * 数据校验、XSS防护、完整性检查
 */
class ValidationUtil {
    /**
     * 验证网站数据结构是否完整有效
     * @param {Object} site 网站数据对象
     * @returns {Boolean} 是否有效
     */
    static validateSite(site) {
        if (!site || typeof site !== 'object') {
            return false;
        }

        // 必须包含name和url字段
        if (!site.name || typeof site.name !== 'string' || site.name.trim() === '') {
            return false;
        }

        if (!site.url || typeof site.url !== 'string' || !this.isValidURL(site.url)) {
            return false;
        }

        // 可选字段类型检查
        if (site.description !== undefined && typeof site.description !== 'string') {
            return false;
        }

        if (site.icon !== undefined && typeof site.icon !== 'string') {
            return false;
        }

        if (site.tags !== undefined && !Array.isArray(site.tags)) {
            return false;
        }

        // 验证tags中的每个元素都是字符串
        if (site.tags && site.tags.some(tag => typeof tag !== 'string')) {
            return false;
        }

        return true;
    }

    /**
     * 验证网站数据结构并返回详细的验证失败原因
     * @param {Object} site 网站数据对象
     * @returns {Object} 验证结果 {isValid: boolean, reason: string}
     */
    static validateSiteWithReason(site) {
        if (!site || typeof site !== 'object') {
            return { isValid: false, reason: 'Site data is null or not an object' };
        }

        // 检查name字段
        if (!site.name) {
            return { isValid: false, reason: 'Missing name field' };
        }
        if (typeof site.name !== 'string') {
            return { isValid: false, reason: 'Name field must be a string' };
        }
        if (site.name.trim() === '') {
            return { isValid: false, reason: 'Name field is empty or contains only whitespace' };
        }

        // 检查url字段
        if (!site.url) {
            return { isValid: false, reason: 'Missing url field' };
        }
        if (typeof site.url !== 'string') {
            return { isValid: false, reason: 'Url field must be a string' };
        }
        if (site.url.trim() === '') {
            return { isValid: false, reason: 'Url field is empty or contains only whitespace' };
        }
        if (!this.isValidURL(site.url)) {
            return { isValid: false, reason: 'Url field is not a valid HTTP/HTTPS URL' };
        }

        // 检查可选字段类型
        if (site.description !== undefined && typeof site.description !== 'string') {
            return { isValid: false, reason: 'Description field must be a string if provided' };
        }

        if (site.icon !== undefined && typeof site.icon !== 'string') {
            return { isValid: false, reason: 'Icon field must be a string if provided' };
        }

        if (site.tags !== undefined && !Array.isArray(site.tags)) {
            return { isValid: false, reason: 'Tags field must be an array if provided' };
        }

        // 验证tags中的每个元素都是字符串
        if (site.tags && site.tags.some(tag => typeof tag !== 'string')) {
            return { isValid: false, reason: 'All tags must be strings' };
        }

        return { isValid: true, reason: 'Valid site data' };
    }

    /**
     * 验证分类数据结构
     * @param {Object} category 分类数据对象
     * @returns {Boolean} 是否有效
     */
    static validateCategory(category) {
        if (!category || typeof category !== 'object') {
            return false;
        }

        // 必须包含name字段
        if (!category.name || typeof category.name !== 'string' || category.name.trim() === '') {
            return false;
        }

        // 可选字段
        if (category.icon !== undefined && typeof category.icon !== 'string') {
            return false;
        }

        return true;
    }

    /**
     * 验证URL格式
     * @param {String} url 要验证的URL
     * @returns {Boolean} 是否为有效URL
     */
    static isValidURL(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        try {
            const urlObj = new URL(url);
            // 必须有协议和主机名
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch (e) {
            return false;
        }
    }

    /**
     * 验证邮箱格式
     * @param {String} email 要验证的邮箱
     * @returns {Boolean} 是否为有效邮箱
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }

        // 简单的邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * 清理HTML以防止XSS攻击
     * @param {String} html 要清理的HTML字符串
     * @returns {String} 清理后的安全HTML
     */
    static sanitizeHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        const tempElement = document.createElement('div');
        tempElement.textContent = html;
        return tempElement.innerHTML;
    }

    /**
     * 移除HTML标签，只保留纯文本
     * @param {String} html 要处理的HTML字符串
     * @returns {String} 纯文本内容
     */
    static stripHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        const tempElement = document.createElement('div');
        tempElement.innerHTML = html;
        return tempElement.textContent || tempElement.innerText || '';
    }

    /**
     * 清理输入内容（结合stripHTML和基本清理）
     * @param {String} input 要清理的输入
     * @returns {String} 清理后的安全输入
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') {
            return '';
        }

        // 首先移除HTML标签
        let sanitized = this.stripHTML(input);
        // 然后清理特殊字符
        sanitized = sanitized
            .replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            }[char]));

        return sanitized;
    }

    /**
     * 验证数据结构是否符合预期的schema
     * @param {Object} data 要验证的数据对象
     * @param {Object} schema 期望的schema结构
     * @returns {Boolean} 是否符合schema
     */
    static validateSchema(data, schema) {
        if (!data || typeof data !== 'object' || !schema || typeof schema !== 'object') {
            return false;
        }

        for (const [key, expectedType] of Object.entries(schema)) {
            if (!(key in data)) {
                // 必须字段缺失
                return false;
            }

            const value = data[key];
            let isValid = false;

            switch (expectedType) {
                case 'string':
                    isValid = typeof value === 'string';
                    break;
                case 'number':
                    isValid = typeof value === 'number' && !isNaN(value);
                    break;
                case 'boolean':
                    isValid = typeof value === 'boolean';
                    break;
                case 'array':
                    isValid = Array.isArray(value);
                    break;
                case 'object':
                    isValid = value !== null && typeof value === 'object' && !Array.isArray(value);
                    break;
                case 'date':
                    isValid = value instanceof Date && !isNaN(value.getTime());
                    break;
                case 'url':
                    isValid = this.isValidURL(value);
                    break;
                case 'email':
                    isValid = this.isValidEmail(value);
                    break;
                default:
                    // 未知类型，尝试直接比较
                    isValid = value === expectedType;
            }

            if (!isValid) {
                return false;
            }
        }

        return true;
    }

    /**
     * 批量验证网站数据
     * @param {Array} sites 网站数据数组
     * @returns {Object} 验证结果 {valid: [], invalid: []}
     */
    static validateSites(sites) {
        if (!Array.isArray(sites)) {
            return { valid: [], invalid: [] };
        }

        const result = {
            valid: [],
            invalid: []
        };

        sites.forEach((site, index) => {
            if (this.validateSite(site)) {
                result.valid.push(site);
            } else {
                result.invalid.push({
                    index: index,
                    data: site,
                    reason: 'Invalid site data structure'
                });
            }
        });

        return result;
    }
}

// 导出到全局
window.ValidationUtil = ValidationUtil;
