// BASEのRSSフィードから商品情報を取得してリスト表示
(function() {
    'use strict';

    console.log('🚀 Products script started');

    // 設定
    const RSS_FEED_URL = 'https://thebase.com/note_store/note_store_apps_rss/feed/f00f9466d7f368ed02969b9aacfcf435d7f36bab';
    const MAX_PRODUCTS = 3;
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80';

    // フォールバック用の商品データ（RSSが取得できない場合に使用）
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

    let productList = null;

    function init() {
        productList = document.getElementById('product-list');

        if (!productList) {
            console.warn('⚠️ Product list container not found, retrying...');
            setTimeout(init, 500);
            return;
        }

        console.log('✅ Product list container found');
        fetchProducts();
    }

    function showError(message) {
        console.error('❌ Showing error:', message);
        if (productList) {
            productList.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-sm text-brand-gray mb-4">${message}</p>
                    <a href="https://mukai6666.thebase.in/" class="inline-block text-xs border-b border-brand-black pb-1 hover:opacity-50 transition">
                        商品ページへ移動 →
                    </a>
                </div>
            `;
        }
    }

    function showLoading() {
        if (productList) {
            productList.innerHTML = `
                <div class="text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent mb-4"></div>
                    <p class="text-sm text-brand-gray">商品を読み込み中...</p>
                </div>
            `;
        }
    }

    function extractCategory(title) {
        if (!title || typeof title !== 'string') return 'COFFEE';
        
        if (title.includes('エチオピア') || title.includes('モカ')) {
            return 'ETHIOPIA';
        } else if (title.includes('ペルー')) {
            return 'PERU';
        } else if (title.includes('タンザニア')) {
            return 'TANZANIA';
        } else if (title.includes('グアテマラ') || title.includes('グァテマラ')) {
            return 'GUATEMALA';
        } else if (title.includes('セット') || title.includes('トライアル') || title.includes('お試し')) {
            return 'SET';
        }
        return 'COFFEE';
    }

    function createProductItem(item) {
        try {
            const imageUrl = item.thumbnail || DEFAULT_IMAGE;
            let title = item.title || '商品名未設定';
            const link = item.link || 'https://mukai6666.thebase.in/';
            const category = item.category || extractCategory(title);
            const price = item.price || '';

            // タイトルから価格部分を除去
            title = title.replace(/¥[\d,]+/g, '').trim();

            return `
                <a href="${link}" target="_blank" rel="noopener noreferrer" class="product-item">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${title}" onerror="this.src='${DEFAULT_IMAGE}'">
                    </div>
                    <div class="product-info">
                        <span class="product-category">${category}</span>
                        <h4 class="product-title">${title}</h4>
                        ${price ? `<span class="product-price">${price}</span>` : ''}
                    </div>
                    <div class="product-arrow">↗</div>
                </a>
            `;
        } catch (error) {
            console.error('❌ Error creating product item:', error);
            return '';
        }
    }

    function displayProducts(items) {
        console.log('🎨 Displaying products...', items);

        if (!items || items.length === 0) {
            showError('現在表示できる商品がありません。');
            return;
        }

        try {
            const productsHTML = items
                .slice(0, MAX_PRODUCTS)
                .map(item => createProductItem(item))
                .filter(html => html.length > 0)
                .join('');

            if (productsHTML.length === 0) {
                showError('商品の表示に失敗しました。');
                return;
            }

            productList.innerHTML = productsHTML;
            console.log('✅ Products displayed successfully');

            applyAnimations();

        } catch (error) {
            console.error('❌ Error displaying products:', error);
            showError('商品の表示中にエラーが発生しました。');
        }
    }

    function applyAnimations() {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            const productItems = productList.querySelectorAll('.product-item');
            if (productItems.length > 0) {
                gsap.fromTo(productItems,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.0,
                        ease: "power2.out",
                        stagger: 0.15,
                        scrollTrigger: {
                            trigger: productList,
                            start: "top 80%",
                            toggleActions: "play none none none",
                        }
                    }
                );
            }
        }
    }

    // XMLをパース
    function parseRSSXML(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('XML parse error');
        }

        const items = xmlDoc.querySelectorAll('item');
        const products = [];

        items.forEach((item, index) => {
            if (index >= MAX_PRODUCTS) return;

            const title = item.querySelector('title')?.textContent || '商品名未設定';
            const link = item.querySelector('link')?.textContent || 'https://mukai6666.thebase.in/';
            
            // media:thumbnail の url 属性を取得
            let thumbnail = DEFAULT_IMAGE;
            const mediaThumbnail = item.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'thumbnail')[0];
            if (mediaThumbnail) {
                thumbnail = mediaThumbnail.getAttribute('url') || DEFAULT_IMAGE;
            }

            // note:price を取得
            let price = '';
            const notePrice = item.getElementsByTagNameNS('https://note.com', 'price')[0];
            if (notePrice) {
                price = notePrice.textContent || '';
            }

            products.push({
                title,
                link,
                thumbnail,
                price,
                category: extractCategory(title)
            });
        });

        return products;
    }

    async function fetchProducts() {
        console.log('🔄 Starting to fetch products...');
        showLoading();

        // 複数のプロキシを試行
        const proxyUrls = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_FEED_URL)}`,
            `https://corsproxy.io/?${encodeURIComponent(RSS_FEED_URL)}`
        ];

        for (const proxyUrl of proxyUrls) {
            try {
                console.log('📡 Trying:', proxyUrl);
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    console.warn(`⚠️ HTTP ${response.status}`);
                    continue;
                }

                const text = await response.text();
                console.log('📦 Received data, length:', text.length);

                if (text.includes('<?xml') || text.includes('<rss')) {
                    const products = parseRSSXML(text);
                    if (products.length > 0) {
                        console.log('✅ Successfully parsed', products.length, 'products');
                        displayProducts(products);
                        return;
                    }
                }
            } catch (error) {
                console.warn('⚠️ Proxy failed:', error.message);
            }
        }

        // すべてのプロキシが失敗した場合、フォールバックデータを使用
        console.log('⚠️ Using fallback data');
        displayProducts(FALLBACK_PRODUCTS);
    }

    // 初期化
    console.log('📄 Document ready state:', document.readyState);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
