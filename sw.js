/**
 * Service Worker for 啃魂导航
 * 提供离线访问和缓存功能
 */

const CACHE_NAME = 'kenhun-nav-v1.0.0';
const STATIC_CACHE = 'kenhun-static-v1.0.0';

// 自动检测部署基路径
const BASE_URL = self.registration.scope;

// 需要缓存的静态资源
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './config.js',
    './assets/css/all.css?v=2.6',
    './assets/js/all.js?v=2.6',
    './assets/js/bootstrap.min-4.3.1.js',
    './assets/js/core/auth-service.js',
    './assets/images/favicon.svg',
    './assets/images/logo.svg',
    './data/websites.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安装中...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[Service Worker] 缓存静态资源');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] 安装完成');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] 安装失败:', error);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 激活中...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] 激活完成');
                return self.clients.claim();
            })
    );
});

// 请求拦截 - 缓存优先策略
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 只处理GET请求
    if (request.method !== 'GET') {
        return;
    }

    // 跳过非同源请求
    if (url.origin !== location.origin) {
        return;
    }

    // 静态资源 - 缓存优先
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // HTML页面 - 网络优先
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // 其他请求 - 网络优先
    event.respondWith(networkFirst(request));
});

// 判断是否为静态资源
function isStaticAsset(pathname) {
    return STATIC_ASSETS.some(asset => pathname === asset || pathname === asset.replace('/', ''));
}

// 缓存优先策略
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // 后台更新缓存
        updateCache(request);
        return cachedResponse;
    }

    return fetchAndCache(request);
}

// 网络优先策略
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] 网络请求失败，尝试缓存:', error);

        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // 返回离线页面
        return caches.match('/index.html');
    }
}

// 获取并缓存
async function fetchAndCache(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] 获取资源失败:', error);
        throw error;
    }
}

// 后台更新缓存
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse);
        }
    } catch (error) {
        // 静默失败
    }
}

// 消息处理
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[Service Worker] 脚本加载完成');
