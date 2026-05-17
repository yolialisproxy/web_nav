/**
 * 广告渲染器
 * 负责从 CONFIG 渲染各广告位并处理关闭逻辑
 */
var AdsRenderer = (function() {
    var STORAGE_KEY = 'kenhun_ads_enabled';
    var HIDDEN_KEY = 'ads_hidden';

    // 广告位映射
    var AD_SLOTS = {
        banner: { container: null, id: 'ad-banner', configPath: 'ads.banner' },
        sidebar: { container: null, id: 'ad-sidebar', configPath: 'ads.sidebar' },
        bottom: { container: null, id: 'ad-bottom', configPath: 'ads.bottom' }
    };

    function getHiddenAds() {
        try {
            return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveHiddenAds(hidden) {
        try {
            localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden));
        } catch (e) {}
    }

    function renderAds() {
        if (!window.CONFIG || !window.CONFIG.ads) {
            return;
        }

        var hiddenAds = getHiddenAds();
        var ads = window.CONFIG.ads;
        var globalEnabled = ads.enabled !== false;

        // 获取DOM引用
        AD_SLOTS.banner.container = document.getElementById('ad-banner');
        AD_SLOTS.sidebar.container = document.getElementById('ad-sidebar');
        AD_SLOTS.bottom.container = document.getElementById('ad-bottom');

        // 渲染顶部横幅广告
        if (AD_SLOTS.banner.container) {
            var bannerAd = ads.banner || {};
            var showBanner = globalEnabled && bannerAd.enabled !== false && !hiddenAds.includes('banner');
            if (showBanner && bannerAd.code) {
                // 找到注入容器
                var adSlot = AD_SLOTS.banner.container.querySelector('#ad-slot') || AD_SLOTS.banner.container;
                if (adSlot) {
                    adSlot.innerHTML = bannerAd.code;
                }
                AD_SLOTS.banner.container.style.display = 'block';
            } else {
                AD_SLOTS.banner.container.style.display = 'none';
            }
        }

        // 渲染侧边栏广告
        if (AD_SLOTS.sidebar.container) {
            var sidebarAd = ads.sidebar || {};
            var showSidebar = globalEnabled && sidebarAd.enabled !== false && !hiddenAds.includes('sidebar');
            if (showSidebar && sidebarAd.code) {
                AD_SLOTS.sidebar.container.innerHTML = sidebarAd.code;
                AD_SLOTS.sidebar.container.style.display = 'block';
            } else {
                AD_SLOTS.sidebar.container.style.display = 'none';
            }
        }

        // 渲染底部广告
        if (AD_SLOTS.bottom.container) {
            var bottomAd = ads.bottom || {};
            var showBottom = globalEnabled && bottomAd.enabled !== false && !hiddenAds.includes('bottom');
            if (showBottom && bottomAd.code) {
                AD_SLOTS.bottom.container.innerHTML = bottomAd.code;
                AD_SLOTS.bottom.container.style.display = 'block';
            } else {
                AD_SLOTS.bottom.container.style.display = 'none';
            }
        }
    }

    // 隐藏指定广告位
    function hideAd(adId) {
        if (!AD_SLOTS[adId]) return;

        var hiddenAds = getHiddenAds();
        if (hiddenAds.indexOf(adId) === -1) {
            hiddenAds.push(adId);
            saveHiddenAds(hiddenAds);
        }

        var container = AD_SLOTS[adId].container;
        if (container) {
            container.style.display = 'none';
        }
    }

    // 显示指定广告位
    function showAd(adId) {
        if (!AD_SLOTS[adId]) return;

        var hiddenAds = getHiddenAds();
        var idx = hiddenAds.indexOf(adId);
        if (idx !== -1) {
            hiddenAds.splice(idx, 1);
            saveHiddenAds(hiddenAds);
        }

        var container = AD_SLOTS[adId].container;
        if (container) {
            container.style.display = 'block';
        }
    }

    // 切换广告显示状态
    function toggleAd(adId) {
        var hiddenAds = getHiddenAds();
        var isHidden = hiddenAds.indexOf(adId) !== -1;

        if (isHidden) {
            showAd(adId);
        } else {
            hideAd(adId);
        }
    }


    return {
        renderAds: renderAds,
        hideAd: hideAd,
        showAd: showAd,
        toggleAd: toggleAd
    };
})();

window.AdsRenderer = AdsRenderer;
