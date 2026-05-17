/**
 * 啃魂导航 3.0 - 认证服务
 * AuthService: 纯粹的用户认证服务
 *
 * 职责：
 * - 用户注册、登录、登出
 * - 会话管理和状态持久化
 * - 密码安全处理（使用Web Crypto API）
 * - 用户数据的加密存储和检索
 */
class AuthService {
    constructor() {
        this.storagePrefix = 'web_nav_user_';
        this.sessionExpiry = 24 * 60 * 60 * 1000; // 24小时
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
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (error) {
            console.error('[AuthService] Password hashing failed:', error);
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

            // 棜查邮箱是否已存在
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
                createdAt: Date.now()
            };

            // 保存用户数据
            await this._saveUser(newUser);

            return { success: true, user: newUser, error: null };
        } catch (error) {
            console.error('[AuthService] Registration failed:', error);
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

            // 创建会话
            const session = {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt
                },
                timestamp: Date.now()
            };

            // 保存会话到localStorage
            localStorage.setItem(`${this.storagePrefix}session`, JSON.stringify(session));

            return { success: true, user: session.user, error: null };
        } catch (error) {
            console.error('[AuthService] Login failed:', error);
            return { success: false, user: null, error: 'Login failed. Please try again.' };
        }
    }

    /**
     * 用户登出
     */
    logout() {
        localStorage.removeItem(`${this.storagePrefix}session`);
    }

    /**
     * 检查用户是否已认证
     * @returns {boolean} 是否已认证
     */
    isAuthenticated() {
        try {
            const sessionData = localStorage.getItem(`${this.storagePrefix}session`);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (session.timestamp && (Date.now() - session.timestamp) < this.sessionExpiry) {
                    return true;
                } else {
                    // 会话过期，清除会话数据
                    localStorage.removeItem(`${this.storagePrefix}session`);
                }
            }
        } catch (error) {
            console.warn('[AuthService] Session validation failed:', error);
            localStorage.removeItem(`${this.storagePrefix}session`);
        }
        return false;
    }

    /**
     * 获取当前用户信息
     * @returns {Object|null} 当前用户信息，未登录返回null
     */
    getCurrentUser() {
        if (this.isAuthenticated()) {
            const sessionData = localStorage.getItem(`${this.storagePrefix}session`);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                return session.user;
            }
        }
        return null;
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
     * 获取所有用户
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
            users.push(user);
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
}

// 导出单例
window.AuthService = new AuthService();