// BASEのRSSフィードから商品情報を取得してリスト表示
// デバッグモード: trueにするとアニメーションを無効化
const DEBUG_MODE = true;

console.log('🚀🚀🚀 products.js LOADED 🚀🚀🚀');

(function() {
    'use strict';

    // ========================================
    // 設定
    // ========================================
    const RSS_FEED_URL = 'https://thebase.com/note_store/note_store_apps_rss/feed/f00f9466d7f368ed02969b9aacfcf435d7f36bab';
    const MAX_PRODUCTS = 3;
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80';

    // フォールバック用の商品データ
    const FALLBACK_PRODUCTS = [
        {
            title: '【エチオピア】モカ ゲイシャ G1 Natural 150g',
            link: 'https://mukai6666.thebase.in/items/124050080',
            thumbnail: 'https://baseec-img-mng.akamaized.net/images/item/origin/0cfd23a87bc0501286a77d7966609f8d.jpg?imformat=generic&q=90&im=Resize,width=300,type=normal',
            price: '1,720円',
            category: 'ETHIOPIA'
        },
        {
            title: '【エチオピア】モカ チェルベサ G1 Natural 150g',
            link: 'https://mukai6666.thebase.in/items/114467561',
            thumbnail: 'https://baseec-img-mng.akamaized.net/images/item/origin/3d6f16d41ea4e83ec52461c4ee35d336.jpg?imformat=generic&q=90&im=Resize,width=300,type=normal',
            price: '1,620円',
            category: 'ETHIOPIA'
        },
        {
            title: 'タンザニア AA トップ イエンガ -Speciality- 150g',
            link: 'https://mukai6666.thebase.in/items/105116833',
            thumbnail: 'https://baseec-img-mng.akamaized.net/images/item/origin/5c2a378346e48ff1ce2fac058a75f096.jpg?imformat=generic&q=90&im=Resize,width=300,type=normal',
            price: '1,600円',
            category: 'TANZANIA'
        }
    ];

    // ========================================
    // ログ関数
    // ========================================
    function log(step, message, data = null) {
        const prefix = `[Products][${step}]`;
        if (data !== null) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    // ========================================
    // DOM操作
    // ========================================
    let productList = null;
    let isInitialized = false;

    function findContainer() {
        log('INIT', 'Looking for #product-list...');
        productList = document.getElementById('product-list');
        
        if (productList) {
            log('INIT', '✅ Found #product-list');
            return true;
        }
        
        log('INIT', '❌ #product-list NOT FOUND');
        return false;
    }

    function extractCategory(title) {
        if (!title) return 'COFFEE';
        if (title.includes('エチオピア') || title.includes('モカ')) return 'ETHIOPIA';
        if (title.includes('ペルー')) return 'PERU';
        if (title.includes('タンザニア')) return 'TANZANIA';
        if (title.includes('グアテマラ') || title.includes('グァテマラ')) return 'GUATEMALA';
        if (title.includes('セット') || title.includes('お試し')) return 'SET';
        return 'COFFEE';
    }

    function createProductHTML(item) {
        const imageUrl = item.thumbnail || DEFAULT_IMAGE;
        const title = (item.title || '商品名未設定').replace(/¥[\d,]+/g, '').trim();
        const link = item.link || 'https://mukai6666.thebase.in/';
        const category = item.category || extractCategory(title);
        const price = item.price || '';

        return `
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="product-item">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${title}" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}';">
                </div>
                <div class="product-info">
                    <span class="product-category">${category}</span>
                    <h4 class="product-title">${title}</h4>
                    ${price ? `<span class="product-price">${price}</span>` : ''}
                </div>
                <div class="product-arrow">↗</div>
            </a>
        `;
    }

    function displayProducts(products) {
        log('RENDER', 'displayProducts called with', products.length + ' items');

        if (!productList) {
            log('RENDER', '❌ productList is null, trying to find again...');
            if (!findContainer()) {
                log('RENDER', '❌ Still cannot find container');
                return;
            }
        }

        if (!products || products.length === 0) {
            log('RENDER', '❌ No products');
            productList.innerHTML = '<div class="text-center py-12"><p class="text-sm text-brand-gray">商品が見つかりませんでした。</p></div>';
            return;
        }

        log('RENDER', 'Generating HTML...');
        const html = products.slice(0, MAX_PRODUCTS).map(createProductHTML).join('');
        
        log('RENDER', 'Inserting HTML, length:', html.length);
        productList.innerHTML = html;
        
        log('RENDER', '✅ Done! Children count:', productList.children.length);

        // ScrollTrigger.refresh
        if (typeof ScrollTrigger !== 'undefined') {
            setTimeout(function() {
                ScrollTrigger.refresh();
                log('RENDER', 'ScrollTrigger.refresh() called');
            }, 200);
        }
    }

    // ========================================
    // RSS取得
    // ========================================
    function parseRSSXML(xmlText) {
        log('PARSE', 'Parsing XML, length:', xmlText.length);
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('XML parse error');
        }

        const items = xmlDoc.querySelectorAll('item');
        log('PARSE', 'Found items:', items.length);

        const products = [];
        items.forEach(function(item, index) {
            if (index >= MAX_PRODUCTS) return;

            const title = item.querySelector('title') ? item.querySelector('title').textContent : '';
            const link = item.querySelector('link') ? item.querySelector('link').textContent : '';
            
            let thumbnail = DEFAULT_IMAGE;
            const mediaThumbnail = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
            if (mediaThumbnail && mediaThumbnail.getAttribute('url')) {
                thumbnail = mediaThumbnail.getAttribute('url');
            }

            let price = '';
            const notePrice = item.getElementsByTagNameNS('https://note.com', 'price')[0];
            if (notePrice && notePrice.textContent) {
                price = notePrice.textContent;
            }

            products.push({ title: title, link: link, thumbnail: thumbnail, price: price, category: extractCategory(title) });
        });

        log('PARSE', 'Parsed products:', products.length);
        return products;
    }

    async function fetchProducts() {
        log('FETCH', '========== STARTING FETCH ==========');

        // まずフォールバックを即表示（何も出ない状態をなくす）
        log('FETCH', 'Displaying FALLBACK first');
        displayProducts(FALLBACK_PRODUCTS);

        // その後、RSSを取得できたら差し替え
        const proxyUrls = [
            'https://api.allorigins.win/raw?url=' + encodeURIComponent(RSS_FEED_URL),
            'https://corsproxy.io/?' + encodeURIComponent(RSS_FEED_URL)
        ];

        for (var i = 0; i < proxyUrls.length; i++) {
            try {
                log('FETCH', 'Trying proxy ' + (i + 1) + '...');
                
                var response = await fetch(proxyUrls[i]);
                log('FETCH', 'Response status:', response.status);
                
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                var text = await response.text();
                log('FETCH', 'Received bytes:', text.length);

                if (text.indexOf('<?xml') !== -1 || text.indexOf('<rss') !== -1) {
                    var products = parseRSSXML(text);
                    if (products && products.length > 0) {
                        log('FETCH', '✅ SUCCESS with proxy ' + (i + 1) + ', updating display');
                        displayProducts(products);
                        return;
                    }
                }
            } catch (error) {
                log('FETCH', '❌ Proxy ' + (i + 1) + ' failed:', error.message);
            }
        }

        log('FETCH', '⚠️ All proxies failed, keeping FALLBACK data');
    }

    // ========================================
    // 初期化
    // ========================================
    function init() {
        if (isInitialized) {
            log('INIT', 'Already initialized, skipping');
            return;
        }
        
        log('INIT', '========== INIT START ==========');
        log('INIT', 'readyState:', document.readyState);

        if (!findContainer()) {
            log('INIT', 'Container not found, retry in 500ms');
            setTimeout(init, 500);
            return;
        }

        isInitialized = true;
        log('INIT', '✅ Container ready, starting fetch');
        fetchProducts();
    }

    // ========================================
    // イベントリスナー（複数の方法で確実に実行）
    // ========================================
    log('BOOT', 'Setting up event listeners...');
    log('BOOT', 'readyState:', document.readyState);

    // 方法1: DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        log('EVENT', 'DOMContentLoaded fired');
        init();
    });

    // 方法2: window.onload
    window.addEventListener('load', function() {
        log('EVENT', 'window.load fired');
        init();
    });

    // 方法3: 既にDOMが読み込まれている場合
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        log('BOOT', 'DOM already ready, calling init in 100ms');
        setTimeout(init, 100);
    }

})();
