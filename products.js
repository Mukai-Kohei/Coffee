// BASEのRSSフィードから商品情報を取得して表示
(function() {
    'use strict';

    // 設定ファイルの読み込みチェック
    if (typeof CONFIG === 'undefined' || !CONFIG.RSS_FEED_URL) {
        console.error('❌ CONFIG is not defined. Please make sure config.js is loaded before this script.');
        return;
    }

    console.log('✅ CONFIG loaded successfully');
    console.log('📡 RSS Feed URL:', CONFIG.RSS_FEED_URL);

    // 設定
    const RSS_FEED_URL = CONFIG.RSS_FEED_URL;
    const RSS2JSON_API = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEED_URL)}`;
    const MAX_PRODUCTS = 6; // 最大表示件数
    const MIN_PRODUCTS = 3; // 最小表示件数

    // 商品グリッドのコンテナ要素を取得
    const productGrid = document.getElementById('product-grid');

    if (!productGrid) {
        console.error('❌ Product grid container not found');
        return;
    }

    console.log('✅ Product grid found:', productGrid);

    // ローディング表示を作成
    function showLoading() {
        productGrid.innerHTML = `
            <div class="col-span-1 md:col-span-3 flex justify-center items-center py-20">
                <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mb-4"></div>
                    <p class="text-sm text-brand-gray tracking-widest">商品を読み込み中...</p>
                </div>
            </div>
        `;
    }

    // エラー表示を作成
    function showError(message) {
        productGrid.innerHTML = `
            <div class="col-span-1 md:col-span-3 text-center py-20">
                <p class="text-sm text-brand-gray mb-4">${message}</p>
                <a href="https://mukai6666.thebase.in/" class="inline-block text-xs border-b border-brand-black pb-1 hover:opacity-50 transition">
                    商品ページへ移動
                </a>
            </div>
        `;
    }

    // 商品カードのHTMLを生成
    function createProductCard(item) {
        // 画像URLを取得（優先順位: thumbnail > enclosure.thumbnail > descriptionから抽出 > デフォルト）
        let imageUrl = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80'; // デフォルト画像

        if (item.thumbnail) {
            imageUrl = item.thumbnail;
            console.log('🖼️ Using thumbnail:', imageUrl);
        } else if (item.enclosure?.thumbnail) {
            imageUrl = item.enclosure.thumbnail;
            console.log('🖼️ Using enclosure thumbnail:', imageUrl);
        } else {
            const imgMatch = item.description?.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
                imageUrl = imgMatch[1];
                console.log('🖼️ Using description image:', imageUrl);
            } else {
                console.log('⚠️ No image found, using default');
            }
        }

        // 価格を抽出（¥記号を含む数字を検索）
        let price = '';
        const priceMatch = item.description?.match(/¥[\d,]+/) || item.title?.match(/¥[\d,]+/);
        if (priceMatch) {
            price = priceMatch[0];
        }

        // タイトルから価格部分を除去
        let title = item.title || '商品名未設定';
        title = title.replace(/¥[\d,]+/g, '').trim();

        // 説明文を抽出（HTMLタグを除去）
        let description = item.description || '';
        description = description.replace(/<[^>]+>/g, '').trim();
        // 最初の100文字まで
        if (description.length > 100) {
            description = description.substring(0, 100) + '...';
        }

        // 産地やラベルを抽出（タイトルから判断）
        let label = 'COFFEE';
        if (title.includes('エチオピア') || title.includes('モカ')) {
            label = 'ETHIOPIA';
        } else if (title.includes('ペルー')) {
            label = 'PERU';
        } else if (title.includes('タンザニア')) {
            label = 'TANZANIA';
        } else if (title.includes('グアテマラ')) {
            label = 'GUATEMALA';
        } else if (title.includes('セット') || title.includes('トライアル')) {
            label = 'SET';
        }

        return `
            <div class="group cursor-pointer" onclick="window.open('${item.link}', '_blank')">
                <div class="relative overflow-hidden mb-6 bg-white aspect-[4/5] shadow-sm">
                    <img src="${imageUrl}" class="w-full h-full object-cover transform group-hover:scale-105 transition duration-1000 ease-out" alt="${title}" onerror="this.src='https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80'">
                    <div class="absolute bottom-0 left-0 bg-white/90 px-4 py-2 text-xs tracking-widest">${label}</div>
                </div>
                <h4 class="font-serif text-lg mb-2 group-hover:text-brand-accent transition">${title}</h4>
                <p class="text-xs text-brand-gray leading-relaxed line-clamp-2">${description || '炭火焙煎による丁寧に仕上げた珈琲豆です。'}</p>
                ${price ? `<p class="mt-3 text-sm font-medium">${price}</p>` : ''}
            </div>
        `;
    }

    // 商品一覧を表示
    function displayProducts(items) {
        console.log('🎨 Displaying products...');

        if (!items || items.length === 0) {
            console.warn('⚠️ No items to display');
            showError('現在表示できる商品がありません。');
            return;
        }

        // 最大件数まで表示
        const displayItems = items.slice(0, Math.min(items.length, MAX_PRODUCTS));
        console.log(`📋 Displaying ${displayItems.length} products (max: ${MAX_PRODUCTS})`);

        const productsHTML = displayItems.map(item => createProductCard(item)).join('');
        productGrid.innerHTML = productsHTML;
        console.log('✅ Products displayed successfully');

        // GSAPアニメーションを再適用
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            const productCards = productGrid.querySelectorAll('.group');
            if (productCards.length > 0) {
                gsap.fromTo(productCards,
                    {
                        opacity: 0,
                        y: 40,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.3,
                        ease: "expo.out",
                        stagger: 0.2,
                        scrollTrigger: {
                            trigger: productGrid,
                            start: "top 80%",
                            toggleActions: "play none none none",
                        }
                    }
                );
            }
        }
    }

    // RSSフィードを取得
    async function fetchProducts() {
        console.log('🔄 Starting to fetch products...');
        showLoading();

        try {
            console.log('📡 Fetching from:', RSS2JSON_API);
            const response = await fetch(RSS2JSON_API);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Received data:', data);

            if (data.status !== 'ok') {
                throw new Error('RSS feed could not be loaded');
            }

            if (!data.items || data.items.length === 0) {
                console.warn('⚠️ No items found in RSS feed');
                showError('商品情報が見つかりませんでした。');
                return;
            }

            console.log(`✅ Found ${data.items.length} products`);
            displayProducts(data.items);

        } catch (error) {
            console.error('❌ Error fetching products:', error);
            showError('商品情報の読み込みに失敗しました。しばらくしてから再度お試しください。');
        }
    }

    // ページ読み込み時に実行
    console.log('📄 Document ready state:', document.readyState);
    if (document.readyState === 'loading') {
        console.log('⏳ Waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', fetchProducts);
    } else {
        console.log('🚀 DOM already loaded, fetching products now...');
        fetchProducts();
    }
})();
