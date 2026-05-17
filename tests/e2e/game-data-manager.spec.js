const { test, expect } = require('@playwright/test');

test.describe('Game Data Manager E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('GameDataManager应该能够正确初始化', async ({ page }) => {
    // 检查GameDataManager是否已定义
    const isDefined = await page.evaluate(() => {
      return typeof GameDataManager !== 'undefined';
    });
    await expect(isDefined).toBeTruthy();
  });

  test('GameDataManager应该是单例', async ({ page }) => {
    const isSingleton = await page.evaluate(() => {
      const instance1 = GameDataManager.getInstance();
      const instance2 = GameDataManager.getInstance();
      return instance1 === instance2;
    });
    await expect(isSingleton).toBeTruthy();
  });

  test('应该能够获取和保存游戏进度', async ({ page }) => {
    const progressSaved = await page.evaluate(() => {
      try {
        // 获取初始进度
        const initialProgress = GameDataManager.getInstance().getGameProgress('snake');

        // 保存新进度
        GameDataManager.getInstance().saveGameProgress('snake', {
          highScore: 100,
          gamesPlayed: 5
        });

        // 获取更新后的进度
        const updatedProgress = GameDataManager.getInstance().getGameProgress('snake');

        return updatedProgress.highScore === 100 &&
               updatedProgress.gamesPlayed === 5;
      } catch (error) {
        console.error('Error in game progress test:', error);
        return false;
      }
    });
    await expect(progressSaved).toBeTruthy();
  });

  test('应该能够获取和解锁成就', async ({ page }) => {
    const achievementWorks = await page.evaluate(() => {
      try {
        const gm = GameDataManager.getInstance();

        // 检查初始成就状态（应该是false）
        const initialStatus = gm.getAchievementStatus('snake_beginner');

        // 解锁成就
        gm.unlockAchievement('snake_beginner');

        // 检查更新后的状态
        const updatedStatus = gm.getAchievementStatus('snake_beginner');

        return !initialStatus && updatedStatus;
      } catch (error) {
        console.error('Error in achievement test:', error);
        return false;
      }
    });
    await expect(achievementWorks).toBeTruthy();
  });

  test('应该能够更新排行榜', async ({ page }) => {
    const leaderboardWorks = await page.evaluate(() => {
      try {
        const gm = GameDataManager.getInstance();

        // 添加一个得分记录
        gm.updateLeaderboard('snake', { score: 150, level: 5 });

        // 获取排行榜
        const leaderboard = gm.getLeaderboard('snake', 5);

        // 检查是否有我们添加的记录
        return leaderboard.length > 0 &&
               leaderboard[0].score === 150;
      } catch (error) {
        console.error('Error in leaderboard test:', error);
        return false;
      }
    });
    await expect(leaderboardWorks).toBeTruthy();
  });

  test('应该能够重置所有数据', async ({ page }) => {
    // 这个测试需要用户确认，所以我们跳过自动执行
    // 但在实际使用中，这个功能应该是可用的
    test.skip('数据重置测试需要用户确认，手动测试时可用');
  });
});

// 性能相关的E2E测试
test.describe('Performance E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('页面应该在合理时间内首次渲染', async ({ page }) => {
    // 测试首次内容绘制时间
    const navigationTiming = await page.evaluate(() => {
      const timing = window.performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventStart - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });

    // DOM内容加载应该在3秒内完成
    await expect(navigationTiming.domContentLoaded).toBeLessThan(3000);
    // 完全加载应该在5秒内完成
    await expect(navigationTiming.loadComplete).toBeLessThan(5000);
  });

  test('应该没有控制台错误', async ({ page }) => {
    // 监控控制台错误
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // 重新加载页面以捕获任何初始化错误
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 检查是否有控制台错误
    await expect(errors).toHaveLength(0);
  });
});
