/**
 * SEO分析器测试
 */

describe('SEOAnalytics', () => {
    test('should exist', () => {
        expect(window.SEOSAnalytics).toBeDefined();
    });

    test('should track page views', () => {
        const initialLength = window.SEOSAnalytics.pageViews.length;
        window.SEOSAnalytics.trackPageView({test: true});
        expect(window.SEOSAnalytics.pageViews.length).toBe(initialLength + 1);
    });

    test('should generate session ID', () => {
        expect(window.SEOSAnalytics.sessionId).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/);
    });
});
