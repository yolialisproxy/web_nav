/**
 * 啃魂导航 3.0 - 用户管理器
 * UserManager: 用户认证和个人数据管理
 *
 * 职责：
 * - 用户注册、登录、登出
 * - 会话管理和状态持久化
 * - 用户偏好和个性化设置
 * - 密码安全处理（使用Web Crypto API）
 */

class UserManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionExpiry = 24 * 60 * 60 * 1000; // 24小时
        this.storagePrefix = 'web_nav_user_';

        // 从存储中恢复用户状态
        this._restoreUserState();
    }

    /**
     * 从localStorage恢复用户状态
     * @private
     */
    _restoreUserState() {
        try {
            const userData = localStorage.getItem(`${this.storagePrefix}currentUser`);
            if (userData) {
                const parsed = JSON.parse(userData);
                // 检查会话是否过期
                if (parsed.timestamp && (Date.now() - parsed.timestamp) < this.sessionExpiry) {
                    this.currentUser = parsed.user;
                    this.isAuthenticated = true;
                } else {
                    // 会话过期，清除数据
                    this._clearUserState();
                }
            }
        } catch (error) {
            console.warn('[UserManager] Failed to restore user state:', error);
            this._clearUserState();
        }
    }

    /**
     * 保存用户状态到localStorage
     * @private
     */
    _saveUserState() {
        try {
            if (this.currentUser) {
                const userData = {
                    user: this.currentUser,
                    timestamp: Date.now()
                };
                localStorage.setItem(`${this.storagePrefix}currentUser`, JSON.stringify(userData));
            }
        } catch (error) {
            console.warn('[UserManager] Failed to save user state:', error);
        }
    }

    /**
     * 清除用户状态
     * @private
     */
    _clearUserState() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem(`${this.storagePrefix}currentUser`);
        localStorage.removeItem(`${this.storagePrefix}preferences`);
    }

    /**
     * 使用Web Crypto API哈希密码
     * @param {string} password 明文密码
     * @returns {Promise<string>} 哈希后的密码（十六进制字符串）
     * @private
     */
    async _hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('[UserManager] Password hashing failed:', error);
            throw new Error('Password hashing failed');
        }
    }

    /**
     * 验证密码
     * @param {string} password 明文密码
     * @param {string} hashedPassword 已哈希的密码
     * @returns {Promise<boolean>} 密码是否匹配
     * @private
     */
    async _verifyPassword(password, hashedPassword) {
        const hashedInput = await this._hashPassword(password);
        return hashedInput === hashedPassword;
    }

    /**
     * 注册新用户
     * @param {Object} userData 用户数据 {username, email, password}
     * @returns {Promise<Object>} 注册结果 {success: boolean, user: Object|null, error: string|null}
     */
    async register(userData) {
        try {
            // 验证输入
            if (!userData.username || !userData.email || !userData.password) {
                return { success: false, user: null, error: 'Username, email, and password are required' };
            }

            if (userData.password.length < 6) {
                return { success: false, user: null, error: 'Password must be at least 6 characters long' };
            }

            // 检查用户名是否已存在
            if (await this._userExists(userData.username)) {
                return { success: false, user: null, error: 'Username already exists' };
            }

            // 检查邮箱是否已存在
            if (await this._emailExists(userData.email)) {
                return { success: false, user: null, error: 'Email already exists' };
            }

            // 哈希密码
            const hashedPassword = await this._hashPassword(userData.password);

            // 创建用户对象
            const newUser = {
                id: this._generateUserId(),
                username: userData.username.trim(),
                email: userData.email.trim().toLowerCase(),
                passwordHash: hashedPassword,
                createdAt: Date.now(),
                preferences: this._getDefaultPreferences()
            };

            // 保存用户数据
            await this._saveUser(newUser);

            // 自动登录
            await this.login(userData.username, userData.password);

            return { success: true, user: { ...newUser, passwordHash: undefined }, error: null };
        } catch (error) {
            console.error('[UserManager] Registration failed:', error);
            return { success: false, user: null, error: 'Registration failed. Please try again.' };
        }
    }

    /**
     * 用户登录
     * @param {string} username 用户名或邮箱
     * @param {string} password 明文密码
     * @returns {Promise<Object>} 登录结果 {success: boolean, user: Object|null, error: string|null}
     */
    async login(username, password) {
        try {
            if (!username || !password) {
                return { success: false, user: null, error: 'Username and password are required' };
            }

            // 查找用户（支持用户名或邮箱登录）
            const user = await this._findUserByUsernameOrEmail(username);
            if (!user) {
                return { success: false, user: null, error: 'Invalid username or password' };
            }

            // 验证密码
            const passwordValid = await this._verifyPassword(password, user.passwordHash);
            if (!passwordValid) {
                return { success: false, user: null, error: 'Invalid username or password' };
            }

            // 设置当前用户
            this.currentUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                preferences: user.preferences || this._getDefaultPreferences()
            };
            this.isAuthenticated = true;

            // 保存状态
            this._saveUserState();

            // 加载用户偏好到StateManager
            this._applyUserPreferences();

            return { success: true, user: this.currentUser, error: null };
        } catch (error) {
            console.error('[UserManager] Login failed:', error);
            return { success: false, user: null, error: 'Login failed. Please try again.' };
        }
    }

    /**
     * 用户登出
     */
    logout() {
        this._clearUserState();
        // 重置为访客状态
        window.StateManager.setState({
            currentWorkspace: 'all',
            theme: 'light',
            themeColor: 'blue',
            activeSearchQuery: '',
            sidebarCollapsed: false,
            viewMode: 'grid'
        });
    }

    /**
     * 获取当前用户
     * @returns {Object|null} 当前用户信息，未登录返回null
     */
    getCurrentUser() {
        return this.isAuthenticated ? { ...this.currentUser } : null;
    }

    /**
     * 检查是否已认证
     * @returns {boolean} 是否已认证
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * 更新用户偏好
     * @param {Object} preferences 新的偏好设置
     * @returns {Promise<boolean>} 更新是否成功
     */
    async updatePreferences(preferences) {
        if (!this.isAuthenticated) {
            return false;
        }

        try {
            this.currentUser.preferences = {
                ...this.currentUser.preferences,
                ...preferences
            };

            // 更新存储
            await this._saveUser(this.currentUser);

            // 保存状态
            this._saveUserState();

            // 应用偏好
            this._applyUserPreferences();

            return true;
        } catch (error) {
            console.error('[UserManager] Failed to update preferences:', error);
            return false;
        }
    }

    /**
     * 获取用户偏好
     * @returns {Object} 用户偏好设置
     */
    getUserPreferences() {
        return this.isAuthenticated ? { ...this.currentUser.preferences } : this._getDefaultPreferences();
    }

    // 私有辅助方法

    /**
     * 检查用户名是否已存在
     * @param {string} username 要检查的用户名
     * @returns {Promise<boolean>} 用户名是否存在
     * @private
     */
    async _userExists(username) {
        try {
            const users = await this._getAllUsers();
            return users.some(u => u.username.toLowerCase() === username.toLowerCase().trim());
        } catch (error) {
            return false;
        }
    }

    /**
     * 检查邮箱是否已存在
     * @param {string} email 要检查的邮箱
     * @returns {Promise<boolean>} 邮箱是否存在
     * @private
     */
    async _emailExists(email) {
        try {
            const users = await this._getAllUsers();
            return users.some(u => u.email.toLowerCase() === email.toLowerCase().trim());
        } catch (error) {
            return false;
        }
    }

    /**
     * 通过用户名或邮箱查找用户
     * @param {string} identifier 用户名或邮箱
     * @returns {Promise<Object|null>} 用户对象或null
     * @private
     */
    async _findUserByUsernameOrEmail(identifier) {
        try {
            const users = await this._getAllUsers();
            const lowerId = identifier.toLowerCase().trim();
            return users.find(u =>
                u.username.toLowerCase() === lowerId ||
                u.email.toLowerCase() === lowerId
            ) || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 获取所有用者
     * @returns {Promise<Array>} 用户数组
     * @private
     */
    async _getAllUsers() {
        try {
            const usersData = localStorage.getItem(`${this.storagePrefix}users`);
            return usersData ? JSON.parse(usersData) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * 保存用户数据
     * @param {Object} user 要保存的用户对象
     * @returns {Promise<void>}
     * @private
     */
    async _saveUser(user) {
        try {
            const users = await this._getAllUsers();
            const index = users.findIndex(u => u.id === user.id);

            if (index !== -1) {
                // 更新现有用户
                users[index] = user;
            } else {
                // 添加新用户
                users.push(user);
            }

            localStorage.setItem(`${this.storagePrefix}users`, JSON.stringify(users));
        } catch (error) {
            throw error;
        }
    }

    /**
     * 生成用户ID
     * @returns {string} 唯一用户ID
     * @private
     */
    _generateUserId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取默认用户偏好
     * @returns {Object} 默认偏好设置
     * @private
     */
    _getDefaultPreferences() {
        return {
            workspace: 'all',
            theme: 'light',
            themeColor: 'blue',
            sidebarCollapsed: false,
            viewMode: 'grid',
            timeView: 'all',
            defaultSearchEngine: 'baidu',
            showAds: true,
            notificationsEnabled: true
        };
    }

    /**
     * 将用户偏好应用到StateManager
     * @private
     */
    _applyUserPreferences() {
        if (!this.isAuthenticated) return;

        const prefs = this.currentUser.preferences;
        window.StateManager.setState({
            currentWorkspace: prefs.workspace,
            theme: prefs.theme,
            themeColor: prefs.themeColor,
            sidebarCollapsed: prefs.sidebarCollapsed,
            viewMode: prefs.viewMode,
            timeView: prefs.timeView
        });

        // 更新localStorage中的搜索引擎偏好
        localStorage.setItem('user_default_engine', prefs.defaultSearchEngine);

        // 更新广告设置
        const adsEnabled = prefs.showAds !== false;
        localStorage.setItem('kenhun_ads_enabled', adsEnabled.toString());

        // 应用广告设置到UI
        const adBanner = document.getElementById('ad-banner');
        const adsToggle = document.getElementById('ads-toggle');
        if (adBanner) {
            adBanner.style.display = adsEnabled ? 'block' : 'none';
        }
        if (adsToggle) {
            adsToggle.setAttribute('aria-checked', adsEnabled);
            adsToggle.classList.toggle('active', adsEnabled);
        }
    }
}

// 导出单例
window.UserManager = new UserManager();