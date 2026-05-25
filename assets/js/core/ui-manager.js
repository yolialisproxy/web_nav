class UIManager {
  constructor() {
    this.dataManager = window.DataManager;
    this.stateManager = window.StateManager;
    this.memorySorter = window.MemorySorter;
    this.contextAwareness = window.ContextAwareness;
    this.searchRouter = window.SearchRouter ? new window.SearchRouter() : null;
    this.workflowManager = window.WorkflowManager ? new window.WorkflowManager() : null;
    this.authService = window.AuthService;

    // DOM 元素缓存
    this.elements = {};
    // 滚动跟踪 - 顶部导航自动隐藏
    this.lastScrollY = 0;
    this.scrollThreshold = 50;
    this.timeTunnel = window.TimeTunnel || null;
  }

  /**
   * 应用初始状态
   */
  _applyInitialState() {
    // 应用主题
    const theme = this.stateManager.get('theme');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // 应用侧边栏折叠状态
    const sidebarCollapsed = this.stateManager.get('sidebarCollapsed');
    if (sidebarCollapsed !== undefined) {
      document.documentElement.classList.toggle('sidebar-collapsed', sidebarCollapsed);
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.toggle('collapsed', sidebarCollapsed);
      }
    }

    // 应用设置面板状态
    const settingsOpen = this.stateManager.get('settingsOpen');
    if (settingsOpen !== undefined && this.elements.settingsModal) {
      this.elements.settingsModal.classList.toggle('hidden', !settingsOpen);
    }
  }

  /**
   * 初始化 UI
   */
  async initialize() {
    // 设置加载状态
    this.stateManager.setState({ isLoading: true });

    // 等待数据加载
    const dataLoaded = await this.dataManager.initialize();
    if (!dataLoaded) {
      throw new Error('数据加载失败，无法初始化界面');
    }

    // 缓存 DOM 元素
    this._cacheElements();

    // 渲染界面
    this._render();

    // 绑定事件
    this._bindEvents();

    // 应用初始状态
    this._applyInitialState();

    // 清除加载状态
    this.stateManager.setState({ isLoading: false });

    // 开发时验证UI元素
    this._validateUIElements();
  }

  /**
   * 缓存 DOM 元素
   */
  _cacheElements() {
    this.elements = {
      sidebar: document.getElementById('sidebar'),
      sidebarToggle: document.getElementById('sidebar-toggle'),
      bigCategoryNav: document.getElementById('big-category-nav'),
      middleCategoryNav: document.getElementById('middle-category-nav'),
      minorCategoryNav: document.getElementById('minor-category-nav'),
      searchInput: document.getElementById('global-search'),
      searchResults: document.getElementById('search-results'),
      siteGrid: document.getElementById('site-grid'),
      settingsModal: document.getElementById('settings-modal'),
      closeSettings: document.getElementById('close-settings'),
      searchEngineGrid: document.getElementById('search-engine-grid'),
      app: document.getElementById('app'),
      topNav: document.getElementById('top-nav'),
      workflowList: document.getElementById('workflow-list')
    };
  }

  /**
   * 渲染界面
   */
  _render() {
    this._renderSidebar();
    this._renderMiddleCategories();
    this._renderSiteGrid();
    this._renderWorkflowList();
    this._renderSearchEngines();
    this._renderUserInfo();
    this.renderFriendshipLinksNav();
  }

  /**
   * 渲染友情链接导航
   */
  renderFriendshipLinksNav() {
    // 如果友情链接功能被禁用，则不渲染
    if (this.stateManager.get('friendshipLinksEnabled') === false) {
      return;
    }

    // 获取友情链接数据
    const friendshipLinks = this.dataManager.getFriendshipLinks();
    if (!friendshipLinks || friendshipLinks.length === 0) {
      return;
    }

    // 创建友情链接容器
    const friendshipLinksContainer = document.createElement('div');
    friendshipLinksContainer.className = 'friendship-links';

    // 创建标题
    const title = document.createElement('div');
    title.className = 'friendship-links-title';
    title.innerHTML = '<span>友情链接</span>';
    friendshipLinksContainer.appendChild(title);

    // 创建链接容器
    const linksContainer = document.createElement('div');
    linksContainer.className = 'friendship-links-container';

    // 添加友情链接
    friendshipLinks.forEach(link => {
      const linkElement = document.createElement('a');
      linkElement.href = link.url;
      linkElement.target = '_blank';
      linkElement.rel = 'noopener';
      linkElement.className = 'friendship-link';
      linkElement.title = link.name || link.url;

      const favicon = document.createElement('img');
      favicon.src = link.favicon || './assets/images/favicon.ico';
      favicon.alt = link.name || '友情链接';
      favicon.className = 'friendship-link-favicon';

      const linkText = document.createElement('span');
      linkText.className = 'friendship-link-text';
      linkText.textContent = link.name || link.url;

      linkElement.appendChild(favicon);
      linkElement.appendChild(linkText);
      linksContainer.appendChild(linkElement);
    });

    friendshipLinksContainer.appendChild(linksContainer);

    // 将友情链接添加到页面中
    const appElement = this.elements.app;
    if (appElement) {
      appElement.appendChild(friendshipLinksContainer);
    }
  }

  /**
   * 渲染侧边栏大类导航
   */
  _renderSidebar() {
    const categories = this.dataManager.getBigCategories();
    const currentCategory = this.stateManager.get('currentCategory');

    const html = categories.map(cat => `
 <a class="nav-item ${currentCategory.big === cat.id ? 'active' : ''}"
 data-big="${cat.id}" data-action="select-big">
 <span class="nav-item-icon">${cat.icon || '📁'}</span>
 <span class="nav-item-text">${cat.name}</span>
 </a>
 `).join('');

    if (this.elements.bigCategoryNav) {
      this.elements.bigCategoryNav.innerHTML = html;
    }
  }

  /**
   * 渲染中类导航
   */
  _renderMiddleCategories() {
    const currentCategory = this.stateManager.get('currentCategory');

    if (!currentCategory.big) {
      this._clearMiddleCategories();
      return;
    }

    const categories = this.dataManager.getMiddleCategories(currentCategory.big);

    const html = categories.map(cat => `
 <button class="category-chip ${currentCategory.middle === cat.id ? 'active' : ''}"
 data-middle="${cat.id}" data-action="select-middle">
 ${cat.name}
 </button>
 `).join('');

    if (this.elements.middleCategoryNav) {
      this.elements.middleCategoryNav.innerHTML = html;
    }
  }

  /**
   * 渲染小类导航
   */
  _renderMinorCategories() {
    const currentCategory = this.stateManager.get('currentCategory');

    if (!currentCategory.middle) {
      this._clearMinorCategories();
      return;
    }

    const categories = this.dataManager.getMinorCategories(currentCategory.middle);

    const html = categories.map(cat => `
 <button class="category-chip ${currentCategory.minor === cat.id ? 'active' : ''}"
 data-minor="${cat.id}" data-action="select-minor">
 ${cat.name}
 </button>
 `).join('');

    if (this.elements.minorCategoryNav) {
      this.elements.minorCategoryNav.innerHTML = html;
    }
  }

  /**
   * 清除中类导航
   */
  _clearMiddleCategories() {
    if (this.elements.middleCategoryNav) {
      this.elements.middleCategoryNav.innerHTML = '';
    }
    this._clearMinorCategories();
  }

  /**
   * 清除小类导航
   */
  _clearMinorCategories() {
    if (this.elements.minorCategoryNav) {
      this.elements.minorCategoryNav.innerHTML = '';
    }
  }

  /**
   * 渲染网站网格
   */
  _renderSiteGrid() {
    const currentCategory = this.stateManager.get('currentCategory');
    const searchQuery = this.stateManager.get('activeSearchQuery');

    let sites = [];

    // 如果有搜索词，使用搜索结果
    if (searchQuery) {
      sites = this.dataManager.search(searchQuery);
    } else if (currentCategory.big) {
      // 否则按分类获取
      sites = this.dataManager.getSitesByCategory(
        currentCategory.big,
        currentCategory.middle,
        currentCategory.minor
      );
    }
    // 按工作区过滤
    const currentWorkspace = this.stateManager.get('currentWorkspace');
    if (currentWorkspace !== 'all') {
      sites = sites.filter(site => {
        if (!site.workspace) return true;
        return site.workspace === currentWorkspace;
      });
    }
    // 按时空隧道过滤和排序
    if (this.timeTunnel) {
      const currentTimeView = this.stateManager.get("timeView");
      sites = this.timeTunnel.filterAndSortByTimeView(sites, currentTimeView);
    }

    // 按点击频率排序
    if (sites.length > 0 && this.memorySorter && !searchQuery) {
      sites = this.memorySorter.sortByFrequency(sites);
    }

    // 上下文感知优先排序
    if (sites.length > 0 && this.contextAwareness && !searchQuery) {
      sites = this.contextAwareness.prioritizeSites(sites);
    }

    // 如果没有内容
    if (sites.length === 0) {
      this._renderEmptyState();
      return;
    }

    const html = sites.map(site => this._renderSiteCard(site)).join('');

    if (this.elements.siteGrid) {
      this.elements.siteGrid.innerHTML = html;

      // 添加点击跟踪
      this.elements.siteGrid.querySelectorAll('.site-card').forEach(card => {
        card.addEventListener('click', () => {
          const siteId = card.dataset.siteId;
          if (siteId && this.memorySorter) {
            this.memorySorter.recordClick(siteId);
          }
        });
      });
    }
  }

  /**
   * 渲染单个网站卡片
   */
  _renderSiteCard(site) {
    const icon = site.icon || site.favicon || '';
    const initial = site.name ? site.name.charAt(0).toUpperCase() : '?';

    return `
 <a class="site-card" href="${site.url}" target="_blank" rel="noopener noreferrer"
 data-site-id="${site.id || site.url}">
 ${icon
 ? `<img class="site-icon" src="${icon}" alt="${site.name}" onerror="this.classList.add('error')">`
 : `<div class="site-icon icon-fallback">${initial}</div>`
}
 <div class="icon-fallback hidden">${initial}</div>
 <div class="site-info">
 <div class="site-name">${site.name}</div>
 <div class="site-description">${site.description || ''}</div>
 </div>
 </a>
 `;
  }

  /**
   * 渲染空状态
   */
  _renderEmptyState() {
    const searchQuery = this.stateManager.get('activeSearchQuery');

    const html = `
 <div class="empty-state">
 <div class="empty-state-icon">${searchQuery ? '🔍' : '📂'}</div>
 <div class="empty-state-title">
 ${searchQuery ? '未找到相关网站' : '请选择一个分类'}
 </div>
 <div class="empty-state-description">
 ${searchQuery
 ? '尝试使用不同的关键词搜索'
 : '点击左侧导航栏选择一个分类'}
 </div>
 </div>
 `;

    if (this.elements.siteGrid) {
      this.elements.siteGrid.innerHTML = html;
    }
  }

  /**
   * 渲染搜索引擎选项
   */
  _renderSearchEngines() {
    if (!this.elements.searchEngineGrid || !window.CONFIG?.search?.engines) return;

    const engines = window.CONFIG?.search?.engines || {};
    const savedEngine = localStorage.getItem('user_default_engine') || window.CONFIG?.search?.default || 'baidu';

    const html = Object.entries(engines).map(([key, engine]) => `
      <button class="search-engine-btn ${savedEngine === key ? 'active' : ''}"
              data-engine="${key}"
              title="${engine.description}">
        <span class="engine-icon">${engine.icon}</span>
        <span class="engine-name">${engine.name}</span>
        <span class="engine-desc">${engine.description}</span>
      </button>
    `).join('');

    this.elements.searchEngineGrid.innerHTML = html;
  }

  /**
   * 选择搜索引擎
   */
  _selectSearchEngine(engineKey) {
    // 保存到 localStorage
    localStorage.setItem('user_default_engine', engineKey);

    // 更新 CONFIG.search.default
    if (window.CONFIG?.search) {
      window.CONFIG.search.default = engineKey;
    }

    // 更新按钮状态
    if (this.elements.searchEngineGrid) {
      this.elements.searchEngineGrid.querySelectorAll('.search-engine-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.engine === engineKey);
      });
    }
  }

  /**
   * 渲染工作流列表
   */
  _renderWorkflowList() {
    if (!this.elements.workflowList || !this.workflowManager) return;

    const workflows = this.workflowManager.getWorkflows();
    const html = workflows.map(wf => `
 <button class="workflow-btn" data-workflow-id="${wf.id}">
 <span class="workflow-icon">${wf.icon}</span>
 <span class="workflow-name">${wf.name}</span>
 </button>
 `).join('');

    this.elements.workflowList.innerHTML = html;

    // 绑定点击事件
    this.elements.workflowList.querySelectorAll('.workflow-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const workflowId = btn.dataset.workflowId;
        if (workflowId && this.workflowManager) {
          this.workflowManager.executeWorkflow(workflowId);
        }
      });
    });
  }

  /**
   * 渲染用户信息（在顶部导航栏中）
   */
  _renderUserInfo() {
    // 安全检查：确保authService和topNav元素存在
    if (!this.elements.topNav || !this.authService) {
      console.warn('[UIManager] Missing topNav or authService, skipping user info render');
      return;
    }

    // 安全检查：确保必要的方法存在
    if (typeof this.authService.getCurrentUser !== 'function' || typeof this.authService.isAuthenticated !== 'function') {
      console.warn('[UIManager] Missing authService methods, skipping user info render');
      return;
    }

    try {
      const userInfo = this.authService.getCurrentUser();
      const isAuthenticated = this.authService.isAuthenticated();

      // 创建用户信息容器
      let userInfoHTML = '';

      if (isAuthenticated && userInfo) {
        // 已登录状态
        userInfoHTML = `
          <div class="user-info">
            <span class="user-avatar">${userInfo.username ? userInfo.username.charAt(0).toUpperCase() : '?'}</span>
            <div class="user-details">
              <div class="user-name">${escapeHtml(userInfo.username)}</div>
              <div class="user-email">${escapeHtml(userInfo.email)}</div>
            </div>
            <button class="user-settings-btn" id="user-settings-btn">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">设置</span>
            </button>
            <button class="user-logout-btn" id="user-logout-btn">
              <span class="nav-icon">🚪</span>
              <span class="nav-text">退出</span>
            </button>
          </div>
        `;
      } else {
        // 未登录状态 - 显示登录/注册按钮
        userInfoHTML = `
          <div class="guest-info">
            <button class="guest-login-btn" id="guest-login-btn">
              <span class="nav-icon">🔐</span>
              <span class="nav-text">登录</span>
            </button>
            <button class="guest-register-btn" id="guest-register-btn">
              <span class="nav-icon">📝</span>
              <span class="nav-text">注册</span>
            </button>
          </div>
        `;
      }
    // 移除任何可能已经存在的用户信息容器
    const existingContainer = this.elements.topNav.querySelector(".user-info-container");
    if (existingContainer) {
        existingContainer.remove();
    }


      // 将用户信息添加到顶部导航栏
      const userInfoContainer = document.createElement('div');
      userInfoContainer.className = 'user-info-container';
      userInfoContainer.innerHTML = userInfoHTML;

      // 使用安全的插入方法将用户信息添加到顶部导航栏（放置在设置按钮后，即最右侧）
      this._insertAfterSettings(userInfoContainer);

      // 绑定事件
      this._bindUserEvents();

      // 开发时验证UI元素
      this._validateUIElements();
    } catch (error) {
      console.error('[UIManager] Error rendering user info:', error);
      // 即使出错也不中断UI渲染
    }
  }

  /**
   * 安全地在设置按钮后插入元素（用于登录/注册菜单）
   * @param {HTMLElement} element 要插入的元素
   * @private
   */
  _insertAfterSettings(element) {
    // 安全检查
    if (!this.elements.topNav || !element) {
      console.warn('[UIManager] Invalid parameters for _insertAfterSettings');
      return;
    }

    try {
      const settingsItem = this.elements.topNav.querySelector('[data-action="settings"]');
      if (settingsItem) {
        // 如果找到设置按钮，尝试在其之后插入
        if (settingsItem.nextSibling) {
          this.elements.topNav.insertBefore(element, settingsItem.nextSibling);
        } else {
          // 如果是最后一个元素，追加到末尾
          this.elements.topNav.appendChild(element);
        }
      } else {
        // 如果没有找到设置按钮，追加到末尾
        this.elements.topNav.appendChild(element);
      }
    } catch (error) {
      console.error('[UIManager] Error in _insertAfterSettings:', error);
      // 作为后备方案，追加到末尾
      try {
        this.elements.topNav.appendChild(element);
      } catch (appendError) {
        console.error('[UIManager] Failed to append element as fallback:', appendError);
      }
    }
  }

  /**
   * 绑定用户信息区域的事件
   */
  _bindUserEvents() {
    try {
      // 绑定登录按钮事件
      const loginBtn = this.elements.topNav.querySelector('#guest-login-btn');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => {
          // 触发登录流程
          if (this.authService && typeof this.authService.showLogin === 'function') {
            this.authService.showLogin();
          }
        });
      }

      // 绑定注册按钮事件
      const registerBtn = this.elements.topNav.querySelector('#guest-register-btn');
      if (registerBtn) {
        registerBtn.addEventListener('click', () => {
          // 触发注册流程
          if (this.authService && typeof this.authService.showRegister === 'function') {
            this.authService.showRegister();
          }
        });
      }

      // 绑定设置按钮事件
      const settingsBtn = this.elements.topNav.querySelector('#user-settings-btn');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
          // 触发设置流程
          if (this.authService && typeof this.authService.showSettings === 'function') {
            this.authService.showSettings();
          }
        });
      }

      // 绑定退出按钮事件
      const logoutBtn = this.elements.topNav.querySelector('#user-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          // 触发退出流程
          if (this.authService && typeof this.authService.logout === 'function') {
            this.authService.logout();
          }
        });
      }
    } catch (error) {
      console.error('[UIManager] Error binding user events:', error);
      // 即使事件绑定失败，也不中断UI渲染
    }
  }

  /**
   * 显示游戏区域
   */
  _showGamesSection() {
    // 导航到游戏页面
    window.location.href = 'games.html';
  }

  /**
   * 开发时的验证函数 - 检查UI元素是否正确渲染
   * 在生产环境中应被移除或禁用
   * @private
   */
  _validateUIElements() {
    // 只在开发环境中运行验证
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      try {
        // 检查顶部导航是否存在
        if (!this.elements.topNav) {
          console.warn('[UIManager Validation] Top navigation element not found');
          return false;
        }

        // 检查用户信息容器是否存在（如果应该存在的话）
        const userInfoContainer = this.elements.topNav.querySelector('.user-info-container');
        const isAuthenticated = this.authService && this.authService.isAuthenticated();

        // 在开发环境中，我们可以记录一些调试信息
        console.debug('[UIManager Validation] UI validation completed', {
          topNavExists: !!this.elements.topNav,
          userInfoContainerExists: !!userInfoContainer,
          isAuthenticated: isAuthenticated,
          authServiceAvailable: !!this.authService
        });

        return true;
      } catch (error) {
        console.error('[UIManager Validation] Error during validation:', error);
        return false;
      }
    }
    return true; // 在非开发环境中总是返回true以避免干扰
  }

  /**
   * 设置滚动自动隐藏行为 - 顶部导航栏
   */
  _setupScrollBehavior() {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      // 小范围滚动不触发
      if (Math.abs(currentScrollY - this.lastScrollY) < this.scrollThreshold) {
        return;
      }

      if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
        // 向下滚动 - 隐藏导航
        if (this.elements.topNav) {
          this.elements.topNav.classList.add('nav-hidden');
        }
      } else {
        // 向上滚动 - 显示导航
        if (this.elements.topNav) {
          this.elements.topNav.classList.remove('nav-hidden');
        }
      }

      this.lastScrollY = currentScrollY;
    }, { passive: true });
  }

  /**
   * 绑定事件
   */
  _bindEvents() {
    // 顶部导航栏滚动隐藏逻辑
    this._setupScrollBehavior();

    // 顶部导航栏点击事件
    if (this.elements.topNav) {
      this.elements.topNav.addEventListener('click', (e) => {
        const item = e.target.closest('.top-nav-item');
        if (!item) return;

        e.preventDefault();
        const action = item.dataset.action;

        // 更新激活状态
        document.querySelectorAll('.top-nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        switch(action) {
          case 'home':
            this.stateManager.setCategory(null);
            if (this.elements.searchInput) {
              this.elements.searchInput.value = '';
            }
            this.stateManager.setState({ activeSearchQuery: '' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
          case 'forum':
            window.open(item.href, '_blank');
            break;
          case 'about':
            window.location.href = 'about/index.html';
            break;
          case 'translate':
            window.location.href = item.href;
            break;
          case 'games':
            // 显示游戏页面或区域
            this._showGamesSection();
            break;
          case 'settings':
            this.stateManager.setState({ settingsOpen: true });
            break;
        }
      });
    }

    // 侧边栏折叠按钮
    if (this.elements.sidebarToggle) {
      this.elements.sidebarToggle.addEventListener('click', () => {
        this.stateManager.toggleSidebar();
      });
    }

    // 大类导航点击
    if (this.elements.bigCategoryNav) {
      this.elements.bigCategoryNav.addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item[data-big]');
        if (navItem) {
          const bigId = navItem.dataset.big;
          this.stateManager.setCategory(bigId);
        }
      });
    }

    // 友情链接导航点击 - 使用事件委托处理动态渲染的元素
    document.addEventListener('click', (e) => {
      const friendshipLink = e.target.closest('[data-action="scroll-to-friendship"]');
      if (friendshipLink) {
        e.preventDefault();
        const friendshipSection = document.getElementById('friendship-section');
        if (friendshipSection) {
          window.scrollTo({
            top: friendshipSection.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });

    // 中类导航点击
    if (this.elements.middleCategoryNav) {
      this.elements.middleCategoryNav.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip[data-middle]');
        if (chip) {
          const current = this.stateManager.get('currentCategory');
          this.stateManager.setCategory(current.big, chip.dataset.middle);
        }
      });
    }

    // 小类导航点击
    if (this.elements.minorCategoryNav) {
      this.elements.minorCategoryNav.addEventListener('click', (e) => {
        const chip = e.target.closest('.category-chip[data-minor]');
        if (chip) {
          const current = this.stateManager.get('currentCategory');
          this.stateManager.setCategory(current.big, current.middle, chip.dataset.minor);
        }
      });
    }

    // 搜索输入
    if (this.elements.searchInput) {
      let searchTimeout = null;

      this.elements.searchInput.addEventListener('input', (e) => {
        const query = e.target.value;

        // 防抖
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.stateManager.setState({ activeSearchQuery: query });
        }, 300);
      });

      // 清除搜索
      this.elements.searchInput.addEventListener('blur', (e) => {
        if (!e.target.value) {
          this.stateManager.setState({ activeSearchQuery: '' });
        }
      });

      // 搜索提交 - 智能路由
      this.elements.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value.trim();
          if (query && this.searchRouter) {
            e.preventDefault();
            this.searchRouter.execute(query);
            // 清除搜索状态
            this.elements.searchInput.value = '';
            this.stateManager.setState({ activeSearchQuery: '' });
            this.elements.searchInput.blur();
          }
        }
      });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.elements.searchInput?.focus();
        return;
      }

      if (e.key === 'Escape') {
        if (this.elements.searchInput?.value) {
          this.elements.searchInput.value = '';
          this.stateManager.setState({ activeSearchQuery: '' });
        } else {
          this.stateManager.setState({ settingsOpen: false });
        }
        this.elements.searchInput?.blur();
        return;
      }

      if (!isInputFocused) {
        const currentCategory = this.stateManager.get('currentCategory');
        const bigCategories = this.dataManager.getBigCategories();

        if (e.key === 'j' || e.key === 'ArrowDown') {
          e.preventDefault();
          const currentIndex = bigCategories.findIndex(c => c.id === currentCategory.big);
          const nextIndex = (currentIndex + 1) % bigCategories.length;
          this.stateManager.setCategory(bigCategories[nextIndex].id);
          return;
        }

        if (e.key === 'k' || e.key === 'ArrowUp') {
          e.preventDefault();
          const currentIndex = bigCategories.findIndex(c => c.id === currentCategory.big);
          const prevIndex = currentIndex <= 0 ? bigCategories.length - 1 : currentIndex - 1;
          this.stateManager.setCategory(bigCategories[prevIndex].id);
          return;
        }

        if (e.key === 'h' || e.key === 'ArrowLeft') {
          e.preventDefault();
          if (!currentCategory.big) {
            this.stateManager.toggleSidebar();
          }
          return;
        }

        if (e.key === 'l' || e.key === 'ArrowRight') {
          e.preventDefault();
          if (currentCategory.big && this.stateManager.get('sidebarCollapsed')) {
            this.stateManager.toggleSidebar();
          }
          return;
        }

        if (e.key === '/') {
          e.preventDefault();
          this.elements.searchInput?.focus();
          return;
        }

        if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.stateManager.toggleTheme();
          return;
        }

        if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.stateManager.setState({ settingsOpen: true });
          return;
        }

        if (e.key === '?') {
          e.preventDefault();
          alert('键盘快捷键:\n\nCtrl+K - 搜索\n/ - 聚焦搜索\nj/↓ - 下一个分类\nk/↑ - 上一个分类\nh/← - 收起侧边栏\nl/→ - 展开侧边栏\nt - 切换主题\ns - 打开设置\nEsc - 关闭/清除\n? - 显示帮助');
          return;
        }
      }
    });

    // 设置面板关闭
    if (this.elements.closeSettings) {
      this.elements.closeSettings.addEventListener('click', () => {
        this.stateManager.setState({ settingsOpen: false });
      });
    }

    // 工作区切换
    const workspaceSwitcher = document.getElementById('workspace-switcher');
    if (workspaceSwitcher) {
      workspaceSwitcher.addEventListener('click', (e) => {
        const btn = e.target.closest('.workspace-btn[data-workspace]');
        if (btn) {
          const workspace = btn.dataset.workspace;
          this.stateManager.setWorkspace(workspace);

          // 更新按钮状态
          workspaceSwitcher.querySelectorAll('.workspace-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.workspace === workspace);
          });
        }
      });
    }

    // 主题切换开关
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.stateManager.toggleTheme();

        // 更新开关状态
        const isDark = this.stateManager.get('theme') === 'dark';
        themeToggle.setAttribute('aria-checked', isDark);
        themeToggle.classList.toggle('active', isDark);
      });

      // 初始化开关状态
      const initialTheme = this.stateManager.get('theme');
      const isInitiallyDark = initialTheme === 'dark';
      themeToggle.setAttribute('aria-checked', isInitiallyDark);
      themeToggle.classList.toggle('active', isInitiallyDark);
    }

    // 搜索引擎选择
    if (this.elements.searchEngineGrid) {
      this.elements.searchEngineGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.search-engine-btn[data-engine]');
        if (btn) {
          const engine = btn.dataset.engine;
          this._selectSearchEngine(engine);
        }
      });
    }

    // 状态变化监听 - 重新渲染
    this.stateManager.subscribe('currentCategory', () => {
      this._renderMiddleCategories();
      this._renderMinorCategories();
      this._renderSiteGrid();
    });

    this.stateManager.subscribe('activeSearchQuery', () => {
      this._renderSiteGrid();
    });

    this.stateManager.subscribe('sidebarCollapsed', (collapsed) => {
      // Update both documentElement and sidebar element for consistent state
      document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.toggle('collapsed', collapsed);
      }
    });

    this.stateManager.subscribe('settingsOpen', (open) => {
      if (this.elements.settingsModal) {
        this.elements.settingsModal.classList.toggle('hidden', !open);
      }
    });

    // 广告位切换开关

    // 登录按钮
    const loginBtn = document.getElementById('guest-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this._showLoginModal();
      });
    }

    // 注册按钮
    const registerBtn = document.getElementById('guest-register-btn');
    if (registerBtn) {
      registerBtn.addEventListener('click', () => {
        this._showRegisterModal();
      });
    }

    // 关闭登录模态框
    const loginCloseBtn = document.getElementById('login-modal-close');
    if (loginCloseBtn) {
      loginCloseBtn.addEventListener('click', () => {
        this._hideLoginModal();
      });
    }

    // 关闭注册模态框
    const registerCloseBtn = document.getElementById('register-modal-close');
    if (registerCloseBtn) {
      registerCloseBtn.addEventListener('click', () => {
        this._hideRegisterModal();
      });
    }

    // 登录表单提交
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        if (username && password) {
          this._login(username, password);
        } else {
          this._showError('请填写完整的登录信息');
        }
      });
    }

    // 注册表单提交
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm-password').value.trim();
        if (username && email && password && confirmPassword) {
          if (password === confirmPassword) {
            this._register(username, email, password);
          } else {
            this._showError('两次输入的密码不一致');
          }
        } else {
          this._showError('请填写完整的注册信息');
        }
      });
    }

    // 访客登录按钮
    const guestLoginBtn = document.getElementById('guest-login-btn');
    if (guestLoginBtn) {
      guestLoginBtn.addEventListener('click', () => {
        this._loginAsGuest();
      });

  }
    }

} // 结束 UIManager 类

// 导出
window.UIManager = UIManager;
