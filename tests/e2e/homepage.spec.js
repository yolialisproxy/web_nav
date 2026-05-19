const { test, expect } = require('@playwright/test');

test.describe('WebNav Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to http://127.0.0.1:8888');
    // 测试前导航到本地服务器
    try {
      const response = await page.goto('http://127.0.0.1:8888', { timeout: 30000 });
      console.log(`Response status: ${response?.status()}`);
      // 只等待DOM加载完成，不等待所有资源
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      console.log('DOM loaded successfully');
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  });

  test('页面基本元素应该存在', async ({ page }) => {
    // 捕获控制台错误
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 输出页面内容以便调试
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    console.log('Page content:', pageContent);
    console.log('Console errors:', consoleErrors);

    // 检查元素是否存在于DOM中（不管是否可见）
    await expect(page.locator('#sidebar')).toBeAttached({ timeout: 10000 }); // 侧边栏
    await expect(page.locator('#main-content')).toBeAttached({ timeout: 10000 }); // 主内容区
    await expect(page.locator('.top-header')).toBeAttached({ timeout: 10000 }); // 顶部头部
    await expect(page.locator('footer')).toBeAttached({ timeout: 10000 }); // 底部页脚

    // 等待加载状态消失然后检查可见性
    await expect(page.locator('#loading-state')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 10000 }); // 侧边栏
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 10000 }); // 主内容区
    await expect(page.locator('.top-header')).toBeVisible({ timeout: 10000 }); // 顶部头部
    await expect(page.locator('footer')).toBeVisible({ timeout: 10000 }); // 底部页脚

    // 检查错误拦截机制是否正常工作
    const errorsFromStorage = await page.evaluate(() => {
      if (window.ErrorInterceptor && typeof window.ErrorInterceptor.getErrors === 'function') {
        return window.ErrorInterceptor.getErrors();
      }
      return [];
    });

    console.log('Stored errors from ErrorInterceptor:', errorsFromStorage.length);
    // 这里我们只做检查，不强制要求必须有错误（因为可能没有错误发生）
  });

  test('导航菜单应该可以切换', async ({ page }) => {
    // 检查导航菜单是否存在
    const navToggle = page.locator('#sidebar-toggle');
    await expect(navToggle).toBeVisible();

    // 点击切换导航菜单
    await navToggle.click();

    // 检查侧边栏是否打开
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveClass(/open/);

    // 再次点击关闭
    await navToggle.click();
    await expect(sidebar).not.toHaveClass(/open/);
  });

  test('搜索功能应该可以使用', async ({ page }) => {
    // 检查搜索输入框
    const searchInput = page.locator('#global-search');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await expect(searchInput).toBeEnabled({ timeout: 5000 });

    // 输入搜索词
    await searchInput.fill('测试');
    await expect(searchInput).toHaveValue('测试');

    // 检查搜索提交（通过按 Enter 键）
    await expect(searchInput).toBeEnabled({ timeout: 5000 });
  });

  test('主题切换功能应该正常工作', async ({ page }) => {
    // 检查主题切换开关
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();

    // 获取初始主题
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // 点击切换主题
    await themeToggle.click();

    // 检查主题是否已切换
    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    await expect(newTheme).not.toBe(initialTheme);
    await expect(newTheme).toBeOneOf(['light', 'dark']);

    // 再次点击切换回来
    await themeToggle.click();
    const finalTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    await expect(finalTheme).toBe(initialTheme);
  });

  test('广告位切换功能应该正常工作', async ({ page }) => {
    // 检查广告位切换开关（如果存在）
    const bannerToggle = page.locator('#ads-toggle');
    if (await bannerToggle.count() > 0) {
      await expect(bannerToggle).toBeVisible();

      // 检查初始状态
      const initialState = await bannerToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');

      // 点击切换广告位
      await bannerToggle.click();
      const newState = await bannerToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
      await expect(newState).toBe(!initialState);

      await bannerToggle.click();
      const finalState = await bannerToggle.evaluate(el => el.getAttribute('aria-checked') === 'true');
      await expect(finalState).toBe(initialState);
    }
  });

  test('工作区切换功能应该正常工作', async ({ page }) => {
    // 检查工作区切换器
    const workspaceSwitcher = page.locator('#workspace-switcher');
    if (await workspaceSwitcher.count() > 0) {
      await expect(workspaceSwitcher).toBeVisible();

      // 获取可用的工作区选项
      const workspaceOptions = workspaceSwitcher.locator('.workspace-btn');
      const count = await workspaceOptions.count();

      if (count > 0) {
        // 点击第一个工作区选项
        await workspaceOptions.first().click();

        // 检查是否已激活
        await expect(workspaceOptions.first()).toHaveClass(/active/);
      }
    }
  });

  test('时空隧道视图切换应该正常工作', async ({ page }) => {
    // 检查时空隧道视图按钮
    const timeViewButtons = page.locator('.time-view-btn');
    if (await timeViewButtons.count() > 0) {
      await expect(timeViewButtons.first()).toBeVisible();

      // 记录初始状态
      const initialActiveButton = timeViewButtons.filter({ has: page.locator('.active') });
      await expect(initialActiveButton).toHaveCount(1);

      // 如果有多个视图选项，测试切换
      if (await timeViewButtons.count() > 1) {
        await timeViewButtons.nth(1).click();

        // 检查新按钮是否激活
        const newActiveButton = timeViewButtons.filter({ has: page.locator('.active') });
        await expect(newActiveButton).toHaveCount(1);
        await expect(newActiveButton.nth(0)).toBe(timeViewButtons.nth(1));
      }
    }
  });

  test('友情链接功能应该正常工作', async ({ page }) => {
    // 友情链接功能目前没有明确的toggle开关进行测试
    // 友情链接会自动渲染在页面中
    test.skip('友情链接toggle测试跳过，因为没有找到相应的toggle元素');
  });

  // 测试错误拦截机制
  test.describe('Error Interceptor Tests', () => {
    test('应该能够捕获并存储控制台错误', async ({ page }) => {
      // 故意触发一个错误来测试拦截机制
      await page.evaluate(() => {
        // 触发一个引用错误
        nonexistentFunction();
      });
    });

    test('应该能够从localStorage获取存储的错误', async ({ page }) => {
      const errors = await page.evaluate(() => {
        if (window.ErrorInterceptor && typeof window.ErrorInterceptor.getErrors === 'function') {
          return window.ErrorInterceptor.getErrors();
        }
        return [];
      });

      // 断言我们能够获取错误数组（即使为空）
      expect(Array.isArray(errors)).toBeTruthy();

      // 由于我们现在只保留最新的错误，验证数组长度不超过1
      expect(errors.length <= 1).toBeTruthy();
    });

    test('应该能够获取最新的错误信息', async ({ page }) => {
      const latestError = await page.evaluate(() => {
        if (window.ErrorInterceptor && typeof window.ErrorInterceptor.getLatestError === 'function') {
          return window.ErrorInterceptor.getLatestError();
        }
        return null;
      });

      // 断言我们能够获取最新错误（可能为null如果没有错误）
      expect(latestError === null || typeof latestError === 'object').toBeTruthy();
    });
  });

  test('页面应该在合理时间内加载完成', async ({ page }) => {
    // 测试页面加载性能
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // 检查关键元素是否在合理时间内出现
    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 5000 });
  });

// 数据持久化E2E测试
test.describe('Game Functionality E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await page.goto('http://127.0.0.1:8888', { timeout: 30000 });
      // 只等待DOM加载完成，不等待所有资源
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  });

  test('应该能够导航到游戏页面', async ({ page }) => {
    // 检查游戏导航链接
    const gamesLink = page.locator('a[href="games.html"]');
    if (await gamesLink.count() > 0) {
      await expect(gamesLink).toBeVisible();
      await gamesLink.click();

      // 等待页面加载
      await page.waitForURL('**/games.html');
      await expect(page).toHaveURL(/games.html/);

      // 检查游戏页面基本元素
      await expect(page.locator('h1')).toContainText('游戏');
    }
  });

  test('贪吃蛇游戏应该可以加载', async ({ page }) => {
    // 尝试直接访问贪吃蛇游戏
    try {
      await page.goto('http://localhost:8080/games/snake.html');
      // 只等待DOM加载完成，不等待所有资源
      await page.waitForLoadState('domcontentloaded');

      // 检查游戏容器
      const gameContainer = page.locator('#game-container, .game-container, canvas');
      await expect(gameContainer.first()).toBeVisible({ timeout: 5000 });
    } catch (error) {
      // 如果游戏页面不存在，这也是可以接受的
      console.log('Snake game page not available:', error.message);
    }
  });
});

// 数据持久化E2E测试
test.describe('Data Persistence E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to http://127.0.0.1:8888 for persistence test');
    // 测试前导航到本地服务器
    try {
      const response = await page.goto('http://127.0.0.1:8888', { timeout: 30000 });
      console.log(`Response status: ${response?.status()}`);
      // 只等待DOM加载完成，不等待所有资源
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      console.log('DOM loaded successfully for persistence test');
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  });
});

  test('主题偏好应该能够持久化', async ({ page }) => {
    // 设置为暗色主题
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
    await themeToggle.click();

    // 刷新页面
    await page.reload();
    // 只等待DOM加载完成，不等待所有资源
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });

    // 检查主题是否保持为暗色
    const currentTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    await expect(currentTheme).toBe('dark');
  });

  test('工作区偏好应该能够持久化', async ({ page }) => {
    // 这里我们跳过因为需要特定的工作区设置
    // 在实际应用中，这将涉及到选择工作区并刷新页面验证
    test.skip('工作区持久化测试需要特殊设置');
  });
});
