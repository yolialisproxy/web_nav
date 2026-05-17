class UIManager {
  constructor() {
    this.dataManager = window.DataManager;
    this.stateManager = window.StateManager;
    this.contextAwareness = window.ContextAwareness;
    this.searchRouter = window.SearchRouter ? new window.SearchRouter() : null;
    this.workflowManager = window.WorkflowManager ? new window.WorkflowManager() : null;

    // DOM 元素缓存
    this.elements = {};
    // 预测建议相关元素
    this.predictiveElements = {};
    // 最后点击的网站ID，用于预测建议和序列记录
    this.lastClickedSiteId = null;
    // 滚动跟踪 - 顶部导航自动隐藏
    this.lastScrollY = 0;
    this.scrollThreshold = 50;
  }

  /**
   * 初始化 UI
   */
  async initialize() {
    // 设置加载状态
    this.stateManager.setState({ isLoading: true });

    // 等待数据加载
    await this.dataManager.initialize();

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
      workflowList: document.getElementById('workflow-list'),
      adsBannerToggle: document.getElementById("ads-banner-toggle"),
      adsSidebarToggle: document.getElementById("ads-sidebar-toggle"),
      adsBottomToggle: document.getElementById("ads-bottom-toggle"),
      friendshipNav: document.getElementById('friendship-nav'),
      predictiveSuggestions: document.getElementById('predictive-suggestions'),
      suggestionsContainer: document.getElementById('suggestions-container')
    };

    // 预测建议相关元素
    this.predictiveElements = {
      container: this.elements.predictiveSuggestions,
      suggestionsContainer: this.elements.suggestionsContainer
    };
  }

  /**
   * 渲染界面
   */
  _render() {
    this._renderSidebar();
    this._renderMiddleCategories();
    this._renderSiteGrid();
    this._renderPredictiveSuggestions();
    this._renderWorkflowList();
    this._renderSearchEngines();
    this._renderFriendshipNav();
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
    // 如果正在显示友情链接，则渲染友情链接
    if (this.stateManager.get('showingFriendship')) {
      this._renderFriendshipGrid();
      return;
    }

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

    // 时空隧道过滤和排序
    const timeView = this.stateManager.get('timeView');
    if (!searchQuery && sites.length > 0) {
      sites = this._applyTimeViewFilter(sites, timeView);
    }

    // 按点击频率排序（仅在不使用时空隧道过滤时应用，或者可以结合）
    if (sites.length > 0 && window.MemorySorter && !searchQuery) {
      // 获取当前上下文
      const currentContext = this.contextAwareness ? this.contextAwareness.detectContext() : {};
      // 获取当前网站ID（如果有的话）
      let currentSiteId = null;
      // 这里我们可以传递最后点击的网站ID，或者在UIManager中追踪它
      // 为了简化，我们先不传递currentSiteId，仅使用上下文
      sites = window.MemorySorter.sortByEnhancedFrequency(sites, currentContext, currentSiteId);
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
          // 更新最后点击的网站ID
          this.lastClickedSiteId = siteId;
          if (siteId && window.MemorySorter) {
            window.MemorySorter.recordClick(siteId);
          }
        });
      });
    }
  }

  /**
   * 渲染友情链接网格
   */
  _renderFriendshipGrid() {
    var links = [];
    if (window.ConfigLoader) {
      links = window.ConfigLoader.get('friendshipLinks', []);
    } else if (window.CONFIG && window.CONFIG.friendshipLinks) {
      links = window.CONFIG.friendshipLinks;
    }

    // 如果没有内容
    if (!links || links.length === 0) {
      this._renderEmptyState();
      return;
    }

    const html = links.map(function(link) {
      return this._renderFriendshipCard(link);
    }).join('');

    if (this.elements.siteGrid) {
      this.elements.siteGrid.innerHTML = html;

      // 添加点击跟踪（虽然友情链接点击会在新标签页打开，但这里保持一致性）
      this.elements.siteGrid.querySelectorAll('.friendship-card').forEach(card => {
        // 更新最后点击的网站ID（虽然友情链接会在新标签页打开）
        const siteId = card.dataset.siteId || card.href; // 使用href作为备选
        this.lastClickedSiteId = siteId;
        // 友情链接点击将在新标签页打开，不需要额外的点击跟踪
      });
    }
  }

  /**
   * 渲染单个友情链接卡片
   */
  _renderFriendshipCard(link) {
    const icon = link.icon || '🔗';
    const name = link.name || '链接';
    const url = link.url || '#';

    return `
   <a class="friendship-card" href="${this.escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
   ${icon
   ? `<img class="site-icon" src="${this.escapeHtml(icon)}" alt="${this.escapeHtml(name)}" onerror="this.classList.add('error')">`
   : `<div class="site-icon icon-fallback">${name ? name.charAt(0).toUpperCase() : '?'}</div>`
   }
   <div class="icon-fallback hidden">${name ? name.charAt(0).toUpperCase() : '?'}</div>
   <div class="site-info">
   <div class="site-name">${this.escapeHtml(name)}</div>
   <div class="site-description">友情链接</div>
   </div>
   </a>
   `;
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
   * 根据时空隧道视图过滤和排序网站
   * @param {Array} sites 网站列表
   * @param {string} timeView 时空隧道视图 ('frequent' | 'recent' | 'all')
   * @returns {Array} 过滤和排序后的网站列表
   */
  _applyTimeViewFilter(sites, timeView) {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const oneWeekMs = 7 * oneDayMs;

    switch (timeView) {
      case 'frequent':
        // 常用：按访问频率排序（使用MemorySorter的逻辑）
        if (window.MemorySorter) {
          return [...sites].sort((a, b) => {
            const weightA = window.MemorySorter.getWeight(a.id || a.url);
            const weightB = window.MemorySorter.getWeight(b.id || b.url);
            return weightB - weightA;
          });
        }
        break;

      case 'recent':
        // 最近：只显示最近一周内访问过的网站，按最后访问时间排序
        const recentSites = sites.filter(site => {
          const lastAccessed = site.lastAccessed || 0;
          return (now - lastAccessed) <= oneWeekMs;
        });

        return [...recentSites].sort((a, b) => {
          const timeA = a.lastAccessed || 0;
          const timeB = b.lastAccessed || 0;
          return timeB - timeA;
        });

      case 'all':
      default:
        // 全部：显示所有网站，按添加时间排序（最新的在前）
        return [...sites].sort((a, b) => {
          const timeA = a.addedTime || 0;
          const timeB = b.addedTime || 0;
          return timeB - timeA;
        });
    }

    // 默认返回原始列表
    return sites;
  }

  /**
   * 渲染空状态
   */
  _renderEmptyState() {
    const searchQuery = this.stateManager.get('activeSearchQuery');
    const showingFriendship = this.stateManager.get('showingFriendship');

    const html = `
 <div class="empty-state">
 <div class="empty-state-icon">${searchQuery ? '🔍' : (showingFriendship ? '🔗' : '📂')}</div>
 <div class="empty-state-title">
 ${searchQuery ? '未找到相关网站' : (showingFriendship ? '暂无友情链接' : '请选择一个分类')}
 </div>
 <div class="empty-state-description">
 ${searchQuery
 ? '尝试使用不同的关键词搜索'
 : (showingFriendship ? '友情链接列表目前为空' : '点击左侧导航栏选择一个分类')}
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

    const engines = window.CONFIG.search.engines;
    const savedEngine = localStorage.getItem('user_default_engine') || window.CONFIG.search.default;

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
   * 渲染友情链接导航菜单
   */
  _renderFriendshipNav() {
    if (!this.elements.friendshipNav) return;

    var links = [];
    if (window.ConfigLoader) {
      links = window.ConfigLoader.get('friendshipLinks', []);
    } else if (window.CONFIG && window.CONFIG.friendshipLinks) {
      links = window.CONFIG.friendshipLinks;
    }

    if (!links || links.length === 0) {
      this.elements.friendshipNav.innerHTML = '';
      return;
    }

    this.elements.friendshipNav.innerHTML = links.map(function(link) {
      var icon = link.icon || '🔗';
      var name = link.name || '链接';
      var url = link.url || '#';
      return '<a href="' + this.escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="friendship-nav-item" data-action="show-friendship">' + icon + ' ' + this.escapeHtml(name) + '</a>';
    }, this).join('');
  }

  /**
   * HTML 转义防止 XSS
   */

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

    // 友情链接导航点击
    if (this.elements.friendshipNav) {
      this.elements.friendshipNav.addEventListener('click', (e) => {
        const linkItem = e.target.closest('.friendship-nav-item[data-action="show-friendship"]');
        if (linkItem) {
          e.preventDefault();
          this.stateManager.setState({ showingFriendship: true });
          // 清除当前选中的分类
          this.stateManager.setCategory(null);
          // 清除搜索查询
          if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
          }
          this.stateManager.setState({ activeSearchQuery: '' });
        }
      });
    }

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

    // 广告位切换开关
    if (this.elements.adsBannerToggle) {
      this.elements.adsBannerToggle.addEventListener('click', () => {
        const isChecked = !this.elements.adsBannerToggle.classList.contains('active');
        this.elements.adsBannerToggle.classList.toggle('active', isChecked);
        this.elements.adsBannerToggle.setAttribute('aria-checked', isChecked);

        // 更新CONFIG中的广告位状态
        if (window.CONFIG?.ads?.banner) {
          window.CONFIG.ads.banner.enabled = isChecked;
          // 触发广告重新渲染
          if (window.AdsRenderer) {
            AdsRenderer.renderAds();
          }
        }
      });

      // 初始化开关状态
      const bannerEnabled = window.CONFIG?.ads?.banner?.enabled ?? false;
      this.elements.adsBannerToggle.classList.toggle('active', bannerEnabled);
      this.elements.adsBannerToggle.setAttribute('aria-checked', bannerEnabled);
    }

    if (this.elements.adsSidebarToggle) {
      this.elements.adsSidebarToggle.addEventListener('click', () => {
        const isChecked = !this.elements.adsSidebarToggle.classList.contains('active');
        this.elements.adsSidebarToggle.classList.toggle('active', isChecked);
        this.elements.adsSidebarToggle.setAttribute('aria-checked', isChecked);

        // 更新CONFIG中的广告位状态
        if (window.CONFIG?.ads?.sidebar) {
          window.CONFIG.ads.sidebar.enabled = isChecked;
          // 触发广告重新渲染
          if (window.AdsRenderer) {
            AdsRenderer.renderAds();
          }
        }
      });

      // 初始化开关状态
      const sidebarEnabled = window.CONFIG?.ads?.sidebar?.enabled ?? false;
      this.elements.adsSidebarToggle.classList.toggle('active', sidebarEnabled);
      this.elements.adsSidebarToggle.setAttribute('aria-checked', sidebarEnabled);
    }

    if (this.elements.adsBottomToggle) {
      this.elements.adsBottomToggle.addEventListener('click', () => {
        const isChecked = !this.elements.adsBottomToggle.classList.contains('active');
        this.elements.adsBottomToggle.classList.toggle('active', isChecked);
        this.elements.adsBottomToggle.setAttribute('aria-checked', isChecked);

        // 更新CONFIG中的广告位状态
        if (window.CONFIG?.ads?.bottom) {
          window.CONFIG.ads.bottom.enabled = isChecked;
          // 触发广告重新渲染
          if (window.AdsRenderer) {
            AdsRenderer.renderAds();
          }
        }
      });

      // 初始化开关状态
      const bottomEnabled = window.CONFIG?.ads?.bottom?.enabled ?? false;
      this.elements.adsBottomToggle.classList.toggle('active', bottomEnabled);
      this.elements.adsBottomToggle.setAttribute('aria-checked', bottomEnabled);
    }
    // 时空隧道视图切换
    if (this.elements.topNav) {
      this.elements.topNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.time-view-btn[data-view]');
        if (btn) {
          const view = btn.dataset.view;
          this.stateManager.setTimeView(view);

          // 更新按钮激活状态
          this.elements.topNav.querySelectorAll('.time-view-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.view === view);
          });
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
      if (this.elements.sidebar) {
        this.elements.sidebar.classList.toggle('collapsed', collapsed);
      }
    });

    this.stateManager.subscribe('settingsOpen', (open) => {
      if (this.elements.settingsModal) {
        this.elements.settingsModal.classList.toggle('hidden', !open);
      }
    });

    this.stateManager.subscribe('isLoading', (isLoading) => {
      if (this.elements.app) {
        this.elements.app.classList.toggle('loading', isLoading);
      }
      // 显示/隐藏加载状态容器
      const loadingState = document.getElementById('loading-state');
      if (loadingState) {
        loadingState.style.display = isLoading ? 'flex' : 'none';
      }
    });

    // 工作区变化时重新渲染
    this.stateManager.subscribe('currentWorkspace', () => {
      this._renderSiteGrid();
    });

    // 时空隧道视图变化时重新渲染
    this.stateManager.subscribe('timeView', () => {
      this._renderSiteGrid();
    });

    // 友情链接显示状态变化时重新渲染
    this.stateManager.subscribe('showingFriendship', () => {
      this._renderSiteGrid();
    });
  }

  /**
   * 应用初始状态
   */
  _applyInitialState() {
    // 应用主题
    const theme = this.stateManager.get('theme');
    document.documentElement.setAttribute('data-theme', theme);

    // 应用主题颜色
    const themeColor = this.stateManager.get('themeColor');
    document.documentElement.setAttribute('data-theme-color', themeColor);

    // 应用侧边栏状态
    const collapsed = this.stateManager.get('sidebarCollapsed');
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    if (this.elements.sidebar) {
      this.elements.sidebar.classList.toggle('collapsed', collapsed);
    }

    // 自动选中第一个分类（如果没有选中任何分类）
    const currentCategory = this.stateManager.get('currentCategory');
    if (!currentCategory.big) {
      const categories = this.dataManager.getBigCategories();
      if (categories.length > 0) {
        this.stateManager.setCategory(categories[0].id);
      }
    }

    // 应用工作区状态
    const currentWorkspace = this.stateManager.get('currentWorkspace');
    const workspaceSwitcher = document.getElementById('workspace-switcher');
    if (workspaceSwitcher) {
      workspaceSwitcher.querySelectorAll('.workspace-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.workspace === currentWorkspace);
      });
    }

    // 初始化时空隧道视图状态
    const currentTimeView = this.stateManager.get('timeView');
    if (this.elements.topNav) {
      this.elements.topNav.querySelectorAll('.time-view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentTimeView);
      });
    }
  }

  /**
   * HTML 转义防止 XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

	/**
	 * 渲染预测建议
	 */
	_renderPredictiveSuggestions() {
  // 只在没有搜索查询时显示预测建议
  const searchQuery = this.stateManager.get('activeSearchQuery');
  if (searchQuery) {
    this._hidePredictiveSuggestions();
    return;
  }

  // 获取当前上下文
  const currentContext = this.contextAwareness ? this.contextAwareness.detectContext() : {};
  // 获取最后点击的网站ID作为当前网站
  const currentSiteId = this.lastClickedSiteId;

  // 如果没有网站数据，隐藏建议
  if (!this.dataManager || !this.dataManager.searchIndex || this.dataManager.searchIndex.length === 0) {
    this._hidePredictiveSuggestions();
    return;
  }

  // 获取所有网站
  const allSites = [...this.dataManager.searchIndex];

  // 应用当前分类过滤
  const currentCategory = this.stateManager.get('currentCategory');
  let filteredSites = allSites;
  if (currentCategory.big) {
    filteredSites = this.dataManager.getSitesByCategory(
      currentCategory.big,
      currentCategory.middle,
      currentCategory.minor
    );
  }

  // 应用工作区过滤
  const currentWorkspace = this.stateManager.get('currentWorkspace');
  if (currentWorkspace !== 'all') {
    filteredSites = filteredSites.filter(site => {
      if (!site.workspace) return true;
      return site.workspace === currentWorkspace;
    });
  }

  // 应用时空隧道过滤
  const timeView = this.stateManager.get('timeView');
  if (!searchQuery && filteredSites.length > 0) {
    filteredSites = this._applyTimeViewFilter(filteredSites, timeView);
  }

  // 如果过滤后没有网站，隐藏建议
  if (filteredSites.length === 0) {
    this._hidePredictiveSuggestions();
    return;
  }

  // 使用增强记忆排序获取预测建议
  const suggestedSites = window.MemorySorter.sortByEnhancedFrequency(
    filteredSites,
    currentContext,
    currentSiteId
  );

  // 取前3个作为建议
  const topSuggestions = suggestedSites.slice(0, 3);

  // 如果没有足够的建议，隐藏建议
  if (topSuggestions.length === 0) {
    this._hidePredictiveSuggestions();
    return;
  }

  // 显示预测建议容器
  this._showPredictiveSuggestions();

  // 渲染建议网站
  const suggestionsHtml = topSuggestions.map(site => {
    const icon = site.icon || this._generateSiteIcon(site);
    return `
      <div class="suggestion-item" data-site-id="${site.id}" data-action="navigate-to-site">
        <span class="suggestion-icon">${icon || '🔗'}</span>
        <span class="suggestion-text">${this.escapeHtml(site.name)}</span>
        ${site.description ? `<span class="suggestion-desc">${this.escapeHtml(site.description)}</span>` : ''}
      </div>
    `;
  }).join('');

  if (this.predictiveElements.suggestionsContainer) {
    this.predictiveElements.suggestionsContainer.innerHTML = suggestionsHtml;

    // 为每个建议项添加点击事件
    this.predictiveElements.suggestionsContainer.querySelectorAll('[data-action="navigate-to-site"]').forEach(element => {
      element.addEventListener('click', () => {
        const siteId = element.dataset.siteId;
        if (siteId) {
          // 记录点击（用于训练模型）
          if (window.MemorySorter) {
            window.MemorySorter.recordClick(siteId);
          }
          // 这里可以实现导航到对应网站的逻辑
          // 暂时我们只记录点击，实际导航需要根据siteId找到对应的URL并打开
          const site = this.dataManager.searchIndex.find(s => s.id === siteId || (s.url && s.url === siteId));
          if (site && site.url) {
            // 在新标签页中打开网站
            window.open(site.url, '_blank');
          }
        }
      });
    });
  }



		/**
	 * 显示预测建议容器
	/**
	 * Show predictive suggestions container
	 */
	_showPredictiveSuggestions() {
	  if (this.predictiveElements.container) {
	  this.predictiveElements.container.style.display = 'block';
	  }
	}

	/**
	 * 隐藏预测建议容器
	 */
	_hidePredictiveSuggestions() {
	  if (this.predictiveElements.container) {
	    this.predictiveElements.container.style.display = 'none';
	  }
	}

} // 结束 UIManager 类

// 导出
window.UIManager = UIManager;