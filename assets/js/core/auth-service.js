var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
var AuthService = /** @class */ (function () {
    function AuthService() {
        this.storagePrefix = 'web_nav_user_';
        this.sessionExpiry = 24 * 60 * 60 * 1000; // 24小时
    }
    /**
     * 使用Web Crypto API哈希密码
     * @param {string} password 明文密码
     * @returns {Promise<string>} 哈希后的密码（十六进制字符串）
     * @private
     */
    AuthService.prototype._hashPassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            var encoder, data, hashBuffer, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        encoder = new TextEncoder();
                        data = encoder.encode(password);
                        return [4 /*yield*/, crypto.subtle.digest('SHA-256', data)];
                    case 1:
                        hashBuffer = _a.sent();
                        return [2 /*return*/, Array.from(new Uint8Array(hashBuffer))
                                .map(function (b) { return b.toString(16).padStart(2, '0'); })
                                .join('')];
                    case 2:
                        error_1 = _a.sent();
                        console.error('[AuthService] Password hashing failed:', error_1);
                        throw new Error('Password hashing failed');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 验证密码
     * @param {string} password 明文密码
     * @param {string} hashedPassword 已哈希的密码
     * @returns {Promise<boolean>} 密码是否匹配
     * @private
     */
    AuthService.prototype._verifyPassword = function (password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedInput;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._hashPassword(password)];
                    case 1:
                        hashedInput = _a.sent();
                        return [2 /*return*/, hashedInput === hashedPassword];
                }
            });
        });
    };
    /**
     * 注册新用户
     * @param {Object} userData 用户数据 {username, email, password}
     * @returns {Promise<Object>} 注册结果 {success: boolean, user: Object|null, error: string|null}
     */
    AuthService.prototype.register = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedPassword, newUser, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // 验证输入
                        if (!userData.username || !userData.email || !userData.password) {
                            return [2 /*return*/, { success: false, user: null, error: 'Username, email, and password are required' }];
                        }
                        if (userData.password.length < 6) {
                            return [2 /*return*/, { success: false, user: null, error: 'Password must be at least 6 characters long' }];
                        }
                        return [4 /*yield*/, this._userExists(userData.username)];
                    case 1:
                        // 检查用户名是否已存在
                        if (_a.sent()) {
                            return [2 /*return*/, { success: false, user: null, error: 'Username already exists' }];
                        }
                        return [4 /*yield*/, this._emailExists(userData.email)];
                    case 2:
                        // 检查邮箱是否已存在
                        if (_a.sent()) {
                            return [2 /*return*/, { success: false, user: null, error: 'Email already exists' }];
                        }
                        return [4 /*yield*/, this._hashPassword(userData.password)];
                    case 3:
                        hashedPassword = _a.sent();
                        newUser = {
                            id: this._generateUserId(),
                            username: userData.username.trim(),
                            email: userData.email.trim().toLowerCase(),
                            passwordHash: hashedPassword,
                            createdAt: Date.now()
                        };
                        // 保存用户数据
                        return [4 /*yield*/, this._saveUser(newUser)];
                    case 4:
                        // 保存用户数据
                        _a.sent();
                        return [2 /*return*/, { success: true, user: newUser, error: null }];
                    case 5:
                        error_2 = _a.sent();
                        console.error('[AuthService] Registration failed:', error_2);
                        return [2 /*return*/, { success: false, user: null, error: 'Registration failed. Please try again.' }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 用户登录
     * @param {string} username 用户名或邮箱
     * @param {string} password 明文密码
     * @returns {Promise<Object>} 登录结果 {success: boolean, user: Object|null, error: string|null}
     */
    AuthService.prototype.login = function (username, password) {
        return __awaiter(this, void 0, void 0, function () {
            var user, passwordValid, session, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!username || !password) {
                            return [2 /*return*/, { success: false, user: null, error: 'Username and password are required' }];
                        }
                        return [4 /*yield*/, this._findUserByUsernameOrEmail(username)];
                    case 1:
                        user = _a.sent();
                        if (!user) {
                            return [2 /*return*/, { success: false, user: null, error: 'Invalid username or password' }];
                        }
                        return [4 /*yield*/, this._verifyPassword(password, user.passwordHash)];
                    case 2:
                        passwordValid = _a.sent();
                        if (!passwordValid) {
                            return [2 /*return*/, { success: false, user: null, error: 'Invalid username or password' }];
                        }
                        session = {
                            user: {
                                id: user.id,
                                username: user.username,
                                email: user.email,
                                createdAt: user.createdAt
                            },
                            timestamp: Date.now()
                        };
                        // 保存会话到localStorage
                        localStorage.setItem("".concat(this.storagePrefix, "session"), JSON.stringify(session));
                        return [2 /*return*/, { success: true, user: session.user, error: null }];
                    case 3:
                        error_3 = _a.sent();
                        console.error('[AuthService] Login failed:', error_3);
                        return [2 /*return*/, { success: false, user: null, error: 'Login failed. Please try again.' }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 用户登出
     */
    AuthService.prototype.logout = function () {
        localStorage.removeItem("".concat(this.storagePrefix, "session"));
    };
    /**
     * 检查用户是否已认证
     * @returns {boolean} 是否已认证
     */
    AuthService.prototype.isAuthenticated = function () {
        try {
            var sessionData = localStorage.getItem("".concat(this.storagePrefix, "session"));
            if (sessionData) {
                var session = JSON.parse(sessionData);
                if (session.timestamp && (Date.now() - session.timestamp) < this.sessionExpiry) {
                    return true;
                }
                else {
                    // 会话过期，清除会话数据
                    localStorage.removeItem("".concat(this.storagePrefix, "session"));
                }
            }
        }
        catch (error) {
            console.warn('[AuthService] Session validation failed:', error);
            localStorage.removeItem("".concat(this.storagePrefix, "session"));
        }
        return false;
    };
    /**
     * 获取当前用者信息
     * @returns {Object|null} 当前用户信息，未登录返回null
     */
    AuthService.prototype.getCurrentUser = function () {
        if (this.isAuthenticated()) {
            var sessionData = localStorage.getItem("".concat(this.storagePrefix, "session"));
            if (sessionData) {
                var session = JSON.parse(sessionData);
                return session.user;
            }
        }
        return null;
    };
    // 私有辅助方法
    /**
     * 检查用户名是否已存在
     * @param {string} username 要检查的用户名
     * @returns {Promise<boolean>} 用户名是否存在
     * @private
     */
    AuthService.prototype._userExists = function (username) {
        return __awaiter(this, void 0, void 0, function () {
            var users, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._getAllUsers()];
                    case 1:
                        users = _a.sent();
                        return [2 /*return*/, users.some(function (u) { return u.username.toLowerCase() === username.toLowerCase().trim(); })];
                    case 2:
                        error_4 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 检查邮箱是否已存在
     * @param {string} email 要检查的邮箱
     * @returns {Promise<boolean>} 邮箱是否存在
     * @private
     */
    AuthService.prototype._emailExists = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var users, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._getAllUsers()];
                    case 1:
                        users = _a.sent();
                        return [2 /*return*/, users.some(function (u) { return u.email.toLowerCase() === email.toLowerCase().trim(); })];
                    case 2:
                        error_5 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 通过用户名或邮箱查找用户
     * @param {string} identifier 用户名或邮箱
     * @returns {Promise<Object|null>} 用户对象或null
     * @private
     */
    AuthService.prototype._findUserByUsernameOrEmail = function (identifier) {
        return __awaiter(this, void 0, void 0, function () {
            var users, lowerId_1, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._getAllUsers()];
                    case 1:
                        users = _a.sent();
                        lowerId_1 = identifier.toLowerCase().trim();
                        return [2 /*return*/, users.find(function (u) {
                                return u.username.toLowerCase() === lowerId_1 ||
                                    u.email.toLowerCase() === lowerId_1;
                            }) || null];
                    case 2:
                        error_6 = _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 获取所有用户
     * @returns {Promise<Array>} 用户数组
     * @private
     */
    AuthService.prototype._getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var usersData;
            return __generator(this, function (_a) {
                try {
                    usersData = localStorage.getItem("".concat(this.storagePrefix, "users"));
                    return [2 /*return*/, usersData ? JSON.parse(usersData) : []];
                }
                catch (error) {
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * 保存用户数据
     * @param {Object} user 要保存的用户对象
     * @returns {Promise<void>}
     * @private
     */
    AuthService.prototype._saveUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var users, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this._getAllUsers()];
                    case 1:
                        users = _a.sent();
                        users.push(user);
                        localStorage.setItem("".concat(this.storagePrefix, "users"), JSON.stringify(users));
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 生成用户ID
     * @returns {string} 唯一用户ID
     * @private
     */
    AuthService.prototype._generateUserId = function () {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    };
    return AuthService;
}());
// 导出单例
window.AuthService = new AuthService();
