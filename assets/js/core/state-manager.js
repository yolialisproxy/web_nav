/**
 * 啃魂导航 3.0 - 状态管理器
 * StateManager: 全局状态管理
 *
 * 职责：
 * - 管理全局运行状态
 * - 提供订阅/发布模式
 * - 持久化状态到 localStorage
 */

class StateManager {
    constructor() {
        this._listeners = new Map();
        this._state = {
            // 分类导航状态
            currentCategory: {
                big: null,
                middle: null,
                minor: null
            },

            // 工作区模式
            currentWorkspace: 'all', // 'work' | 'entertainment' | 'study' | 'all'

// 时空隧道视图
timeView: 'all', // 'frequent' | 'recent' | 'all'
// 最后选择的分类（用于记住用户偏好）
	lastCategory: null, // { big: string, middle: string, minor: string } 或 null

            // 主题设置
            theme: 'light', // 'light' | 'dark'
            themeColor: 'blue',

            // 搜索状态
            activeSearchQuery: '',

            // 侧边栏状态
            sidebarCollapsed: false,

            // 视图状态
            viewMode: 'grid', // 'grid' | 'list'

            // 加载状态
            isLoading: false,

            // 设置面板
            settingsOpen: false
        };

        // 从 localStorage 恢复状态
        this._loadFromStorage();

        // 监听系统主题变化
        this._initSystemThemeListener();
    }

    /**
     * 初始化系统主题监听
     */
    _initSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setState({ theme: e.matches ? 'dark' : 'light' });
            }
        });
    }

    /**
     * 从 localStorage 加载状态
     */
    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('kenhun_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this._state = { ...this._state, ...parsed };
            }

            // 恢复侧边栏状态
            const sidebarCollapsed = localStorage.getItem('sidebar_collapsed');
            if (sidebarCollapsed !== null) {
                this._state.sidebarCollapsed = sidebarCollapsed === 'true';
            }
        } catch (e) {
            console.warn('[StateManager] 恢复状态失败:', e);
        }
    }

    /**
     * 保存状态到 localStorage
     */
    _saveToStorage() {
        try {
            const toSave = {
                settingsOpen: this._state.settingsOpen,
                theme: this._state.theme,
                themeColor: this._state.themeColor,
                currentWorkspace: this._state.currentWorkspace,
                sidebarCollapsed: this._state.sidebarCollapsed,
                viewMode: this._state.viewMode,
                timeView: this._state.timeView,
                lastCategory: this._state.lastCategory
            };
            localStorage.setItem('kenhun_state', JSON.stringify(toSave));

        } catch (e) {
            console.warn('[StateManager] 保存状态失败:', e);
        }
    }

    /**
     * 获取当前状态
     */
    getState() {
        return { ...this._state };
    }

    /**
     * 获取特定状态
     */
    get(key) {
        return this._state[key];
    }

    /**
     * 设置状态
     */
    setState(newState) {
        const oldState = { ...this._state };
        this._state = { ...this._state, ...newState };

        // 保存到 localStorage
        this._saveToStorage();

        // 触发监听器
        this._notifyListeners(oldState, this._state);
    }

    /**
     * 设置分类
     */
    setCategory(big, middle = null, minor = null) {
        this.setState({
            currentCategory: { big, middle, minor }
        });
    }

    /**
     * 清空分类选择
     */
    clearCategory() {
        this.setState({
            currentCategory: { big: null, middle: null, minor: null }
        });
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const newTheme = this._state.theme === 'light' ? 'dark' : 'light';
        this.setState({ theme: newTheme });

        // 应用到 DOM
        document.documentElement.setAttribute('data-theme', newTheme);
    }

    /**
     * 设置主题颜色
     */
    setThemeColor(color) {
        this.setState({ themeColor: color });
        document.documentElement.setAttribute('data-theme-color', color);
    }

    /**
     * 切换侧边栏
     */
    toggleSidebar() {
        const collapsed = !this._state.sidebarCollapsed;
        this.setState({ sidebarCollapsed: collapsed });

        // 应用到 DOM
        document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    }

    /**
     * 设置工作区
     */
    setWorkspace(workspace) {
        this.setState({ currentWorkspace: workspace });
    }

/**
 * 设置时空隧道视图
 */
setTimeView(view) {
  this.setState({ timeView: view });
}

/**
 * 设置最后选择的分类
 */
setLastCategory(category) {
  this.setState({ lastCategory: category });
}

    /**
     * 订阅状态变化
     */
    subscribe(key, callback) {
        if (!this._listeners.has(key)) {
            this._listeners.set(key, []);
        }
        this._listeners.get(key).push(callback);

        // 返回取消订阅函数
        return () => {
            const callbacks = this._listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * 通知监听器
     */
    _notifyListeners(oldState, newState) {
        for (const [key, callbacks] of this._listeners.entries()) {
            if (oldState[key] !== newState[key]) {
                for (const callback of callbacks) {
                    try {
                        callback(newState[key], oldState[key]);
                    } catch (e) {
                        console.error('[StateManager] 监听器执行失败:', e);
                    }
                }
            }
        }

        // 也触发全局监听
        if (this._listeners.has('*')) {
            for (const callback of this._listeners.get('*')) {
                try {
                    callback(newState, oldState);
                } catch (e) {
                    console.error('[StateManager] 全局监听器执行失败:', e);
                }
            }
        }
    }

    /**
     * 重置状态
     */
    reset() {
        this._state = {
            currentCategory: { big: null, middle: null, minor: null },
            currentWorkspace: 'all',
            timeView: 'all',
            theme: 'light',
            themeColor: 'blue',
            activeSearchQuery: '',
            sidebarCollapsed: false,
            viewMode: 'grid',
            isLoading: false,
            settingsOpen: false,
            lastCategory: null
        };
        this._saveToStorage();
        this._notifyListeners({}, this._state);
    }
}

// 导出单例
window.StateManager = new StateManager();