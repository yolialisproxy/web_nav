/**
 * 排名追踪器测试
 */

describe('RankTracker', () => {
    test('should exist', () => {
        expect(window.RankTracker).toBeDefined();
    });

    test('should initialize with default keywords', () => {
        expect(window.RankTracker.trackedKeywords).toContain('网址导航');
        expect(window.RankTracker.trackedKeywords).toContain('智能导航');
    });

    test('should store rankings', () => {
        // 模拟设置一个排名
        window.RankTracker.rankings['测试关键词'] = 5;
        expect(window.RankTracker.rankings['测试关锧词']).toBe(5);
    });
});
