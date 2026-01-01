
        console.log('✅ Main script starting...');
        // リロード時にTOPから表示（複数の方法で確実に）
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // 即座にスクロール位置をリセット
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // ページ表示時にもスクロール位置をリセット
        window.addEventListener('beforeunload', function() {
            window.scrollTo(0, 0);
        });

        // ローディング画面の背景画像をランダムに設定
        const loadingImages = ['./coffee.JPG', './焙煎機.JPG'];
        const randomImage = loadingImages[Math.floor(Math.random() * loadingImages.length)];
        const preloaderElement = document.getElementById('preloader');
        if (preloaderElement) {
            preloaderElement.style.backgroundImage = `url('${randomImage}')`;
        }

        // YouTube動画の準備完了を検出（バグ修正：動画読み込み待機）
        let isVideoReady = false;
        let videoReadyTimeout = null;

        // 動画を強制的に再読み込みする関数（キャッシュ回避）
        function reloadVideo() {
            const heroVideoIframe = document.querySelector('.hero-bg-video iframe');
            if (heroVideoIframe) {
                // 現在のsrcを取得
                const currentSrc = heroVideoIframe.getAttribute('src');
                const baseUrl = currentSrc.split('?')[0].split('#')[0];

                // キャッシュバスターとしてタイムスタンプを追加
                const timestamp = new Date().getTime();
                const newSrc = `${baseUrl}?autoplay=1&mute=1&loop=1&playlist=EsEM4zzvE2k&controls=0&start=4&playsinline=1&rel=0&modestbranding=1&t=${timestamp}`;

                console.log('🔄 Reloading video with cache buster');

                // srcを更新して動画を再読み込み
                heroVideoIframe.src = newSrc;

                return heroVideoIframe;
            }
            return null;
        }

        // 動画の準備を開始
        function initVideoLoad() {
            isVideoReady = false;

            // 既存のタイムアウトをクリア
            if (videoReadyTimeout) {
                clearTimeout(videoReadyTimeout);
            }

            // 最大待機時間（3.5秒）のフォールバック
            const maxWaitTime = 3500;
            videoReadyTimeout = setTimeout(() => {
                console.log('⚠️ Video load timeout - proceeding anyway');
                isVideoReady = true;
            }, maxWaitTime);

            // iframe要素を取得（または再読み込み）してload eventを監視
            const heroVideoIframe = reloadVideo();
            if (heroVideoIframe) {
                // 既存のリスナーを削除（重複防止）
                heroVideoIframe.removeEventListener('load', onVideoLoad);
                heroVideoIframe.addEventListener('load', onVideoLoad);
            } else {
                // iframeが見つからない場合は即座に準備完了扱い
                console.log('⚠️ Video iframe not found');
                clearTimeout(videoReadyTimeout);
                isVideoReady = true;
            }
        }

        function onVideoLoad() {
            console.log('✅ Video iframe loaded');
            clearTimeout(videoReadyTimeout);
            isVideoReady = true;
        }

        // 初回読み込み
        initVideoLoad();

        // ページ表示時（bfcache対策・リロード対策）
        window.addEventListener('pageshow', function(event) {
            console.log('📄 Page show event - persisted:', event.persisted);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

            // bfcacheから戻った場合、または通常のリロードの場合も動画を再読み込み
            if (event.persisted || performance.navigation.type === 1) {
                console.log('🔄 Reloading video due to page restore/reload');

                // プリローダーを再表示
                const preloader = document.getElementById('preloader');
                if (preloader) {
                    preloader.style.display = 'flex';
                    preloader.style.opacity = '1';
                    preloader.style.visibility = 'visible';
                }

                // ヒーローセクションを非表示
                const heroSection = document.querySelector('#hero-section');
                if (heroSection) {
                    heroSection.style.opacity = '0';
                }

                // 動画を再読み込み
                initVideoLoad();
            }
        });

        // GSAPとScrollTriggerを登録
        gsap.registerPlugin(ScrollTrigger);
        
        // ScrollTriggerの初期化時にスクロール位置をリセット
        ScrollTrigger.config({ ignoreMobileResize: true });

        // ========================================
        // Lenis (慣性スクロール) の初期化
        // ========================================
        let lenis;

        function initLenis() {
            lenis = new Lenis({
                duration: 2.8,           // スクロールの重さ（大きいほど重い）
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
                direction: 'vertical',
                gestureDirection: 'vertical',
                smooth: true,
                smoothTouch: false,
                touchMultiplier: 1.5,
                wheelMultiplier: 0.6,    // ホイールスクロールの感度を下げる
            });

            // GSAPのScrollTriggerと連携
            lenis.on('scroll', ScrollTrigger.update);

            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });

            gsap.ticker.lagSmoothing(0);
        }

        // ページ読み込み時に実行
        window.addEventListener('load', () => {
            // アニメーション中はスクロールを禁止
            document.body.classList.add('no-scroll');

            // TOPから確実にスタート（複数回実行で確実に）
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // ScrollTriggerをリフレッシュしてスクロール位置を確定
            ScrollTrigger.refresh();

            // 動画の準備完了を待つ（バグ修正：確実に動画を表示）
            const waitForVideo = () => {
                if (isVideoReady) {
                    startHeroAnimation();
                } else {
                    requestAnimationFrame(waitForVideo);
                }
            };

            // 最低表示時間（1.5秒）を確保してから動画チェック開始
            setTimeout(() => {
                waitForVideo();
            }, 1500);

            function startHeroAnimation() {
                // ========================================
                // Phase 0: プリローダー → ヒーロー（シンプルな流れ）
                // ========================================
                const preloader = document.getElementById('preloader');
                const heroSection = document.querySelector('#hero-section');
                const heroBrand = document.querySelector('.hero-brand');
                const heroTitleTop = document.querySelector('.hero-title-top');
                const heroTitleBottom = document.querySelector('.hero-title-bottom');
                const heroSubcopy = document.querySelector('.hero-subcopy');
                const heroMovieBox = document.querySelector('.hero-movie-box');
                const heroNavigation = document.querySelector('.hero-navigation');
                const heroBgOverlay = document.querySelector('.hero-bg-overlay');

                // ヒーローセクション内の背景オーバーレイを準備
                gsap.set(heroBgOverlay, { opacity: 1 });

                // 全体のマスタータイムライン
                const masterTL = gsap.timeline({
                    onComplete: () => {
                        // すべてのアニメーション完了後、スクロールを許可
                        document.body.classList.remove('no-scroll');
                        // 背景色をブランドライトに変更
                        document.body.style.backgroundColor = '#F5F5F3';
                        // 最終的な中央揃えを強制（レースコンディション対策）
                        gsap.set(heroSubcopy, { xPercent: -50, yPercent: -50, y: 0 });
                        // スクロール位置を再度リセット
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        // ScrollTriggerを再度リフレッシュ
                        ScrollTrigger.refresh();
                        // Lenisを初期化
                        initLenis();
                    }
                });

                // === Step 1: ローディングレイヤーを非表示にする ===
                // まずヒーローセクションを表示（ローディングの下で準備）
                masterTL.to(heroSection, {
                    opacity: 1,
                    duration: 0.01
                }, 0.3); // 即座に準備

                masterTL.to(preloader, {
                    autoAlpha: 0,
                    duration: 1.0,
                    ease: 'power2.inOut',
                    onComplete: () => {
                        preloader.style.display = 'none';
                    }
                }, 0.5); // 0.5秒後に開始（動画準備完了済み）

            // === Step 2: メインビジュアルのテキストを順番に表示 ===
            
            // 2-1. 「陶器、」を表示（ローディング消失と食い気味に）
            masterTL.fromTo(heroTitleTop,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 1.8, ease: 'power2.out' },
                '-=0.6' // 前のアニメーションより0.6秒早く開始
            );

            // 2-2. 「焙煎」を表示（少し遅延）
            masterTL.fromTo(heroTitleBottom,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 1.8, ease: 'power2.out' },
                '-=1.3' // 陶器、が0.5秒表示された後に開始
            );

            // 2-3. 「栃木県栃木市にて、陶器と炭火が紡ぐ珈琲。」を表示
            // （xPercent/yPercentで中央配置し、y:30で少し下にずらす）
            gsap.set(heroSubcopy, { xPercent: -50, yPercent: -50, y: 30, opacity: 0 });
            masterTL.to(heroSubcopy,
                { y: 0, opacity: 1, duration: 1.8, ease: 'power2.out' },
                '-=1.3' // 焙煎が0.5秒表示された後に開始
            );

            // 2-4. その他全て（工藝 迎ふ、YouTube動画、ナビゲーション）を同時に表示
            masterTL.fromTo(heroBrand,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' },
                '-=1.2' // サブコピーが0.6秒表示された後に開始
            );

            masterTL.fromTo(heroMovieBox,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' },
                '<' // 前のアニメーションと同時に開始
            );

            masterTL.fromTo(heroNavigation,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' },
                '<' // 前のアニメーションと同時に開始
            );
            }
        });

        // DOMContentLoadedでScrollTriggerなどを設定
        document.addEventListener('DOMContentLoaded', () => {
            // TOPから確実にスタート
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // ========================================
            // Phase 2: スクロール連動アニメーション
            // ========================================
            const heroSection = document.querySelector('#hero-section');
            const heroBrand = document.querySelector('.hero-brand');
            const heroTitleTop = document.querySelector('.hero-title-top');
            const heroTitleBottom = document.querySelector('.hero-title-bottom');
            const heroSubcopy = document.querySelector('.hero-subcopy');
            const heroMovieBox = document.querySelector('.hero-movie-box');
            const heroNavigation = document.querySelector('.hero-navigation');
            const heroDarkOverlay = document.querySelector('.hero-dark-overlay');
            const conceptOverlay = document.querySelector('.concept-overlay');
            const conceptSection = document.querySelector('#concept-section');

            // CRAFTSMANSHIPセクションを取得
            const craftsmanshipSection = document.getElementById('craftsmanship-section');

            // ScrollTrigger Pinningで画面固定（CRAFTSMANSHIPセクションまで）
            const scrollTL = gsap.timeline({
                scrollTrigger: {
                    trigger: conceptSection,
                    start: 'top bottom',
                    endTrigger: craftsmanshipSection,
                    end: 'bottom top',
                    pin: heroSection,
                    pinSpacing: false,
                    scrub: 1,
                    // markers: true // デバッグ用
                }
            });

            // === タイムライン開始位置（0秒）で、すべての要素を表示状態に設定 ===
            scrollTL.set(heroSubcopy, {
                yPercent: -50,
                y: 0,
                opacity: 1,
                filter: 'blur(0px)'
            }, 0);

            scrollTL.set(heroMovieBox, {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)'
            }, 0);

            scrollTL.set(heroNavigation, {
                opacity: 1,
                filter: 'blur(0px)'
            }, 0);

            scrollTL.set(heroDarkOverlay, {
                backgroundColor: 'rgba(0, 0, 0, 0)'
            }, 0);

            scrollTL.set(heroBrand, {
                opacity: 1,
                filter: 'blur(0px)'
            }, 0);

            scrollTL.set([heroTitleTop, heroTitleBottom], {
                opacity: 1,
                filter: 'blur(0px)'
            }, 0);

            scrollTL.set(conceptOverlay, {
                opacity: 0,
                scale: 0.95,
                visibility: 'hidden',
                y: 30
            }, 0);

            // === Step A: サブコピーの先行移動 ===
            scrollTL.to(heroSubcopy, {
                yPercent: -150,
                opacity: 0,
                filter: 'blur(12px)',
                duration: 1.2,
                ease: 'power2.out'
            }, 0);

            // YouTube動画の退場
            scrollTL.to(heroMovieBox, {
                opacity: 0,
                y: -60,
                filter: 'blur(12px)',
                duration: 1.2,
                ease: 'power2.out'
            }, 0);

            // ナビゲーションの退場
            scrollTL.to(heroNavigation, {
                opacity: 0,
                y: -30,
                filter: 'blur(12px)',
                duration: 1.2,
                ease: 'power2.out'
            }, 0);

            // 背景を暗転
            scrollTL.to(heroDarkOverlay, {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                duration: 2,
                ease: 'power2.inOut'
            }, 0);

            // === Step B: メインタイトルの退場（早めに開始） ===
            scrollTL.to([heroBrand, heroTitleTop, heroTitleBottom], {
                opacity: 0,
                filter: 'blur(15px)',
                duration: 1.0,
                ease: 'power2.in'
            }, 0.5);

            // === Step C: コンセプトセクションの入場（早めに開始） ===
            scrollTL.to(conceptOverlay, {
                opacity: 1,
                scale: 1,
                visibility: 'visible',
                y: 0,
                duration: 1.2,
                ease: 'power3.out'
            }, 1.0);

            // コンセプトを長く保持
            scrollTL.to(conceptOverlay, {
                opacity: 1,
                duration: 2.0
            }, 2.0);

            // コンセプトをフェードアウト（CRAFTSMANSHIPセクションに移行）
            scrollTL.to(conceptOverlay, {
                opacity: 0,
                visibility: 'hidden',
                duration: 1.5,
                ease: 'power2.in'
            }, 4.0);

            // 背景の暗転を維持（CRAFTSMANSHIPセクション中も暗いまま）
            scrollTL.to(heroDarkOverlay, {
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                duration: 2.0,
                ease: 'power2.inOut'
            }, 4.0);

            // ========================================
            // Phase 2.5: 詩的テキストの順次フェードインアニメーション
            // ========================================
            const conceptLines = document.querySelectorAll('.concept-line');
            let conceptAnimationPlayed = false;



            // コンセプトオーバーレイが表示されたらテキストと画像のアニメーションを開始
            ScrollTrigger.create({
                trigger: conceptSection,
                start: 'top 80%',  // より早めにトリガー（バグ修正）
                onEnter: () => {
                    if (!conceptAnimationPlayed) {
                        conceptAnimationPlayed = true;
                        // テキストのワイプアニメーション（左から右へ）
                        conceptLines.forEach((line, index) => {
                            const delay = index * 0.2; // 各行0.2秒ずつ遅延（stagger）
                            gsap.to(line, {
                                opacity: 1,
                                x: 0,
                                clipPath: 'inset(0 0% 0 0)', // 左から右へワイプ表示
                                duration: 0.8,
                                delay: delay,
                                ease: 'power2.out'
                            });
                        });

                    }
                },
                onLeaveBack: () => {
                    // スクロールを戻した時にリセット
                    conceptAnimationPlayed = false;
                    conceptLines.forEach((line) => {
                        gsap.set(line, {
                            opacity: 0,
                            x: -20,
                            clipPath: 'inset(0 100% 0 0)'
                        });
                    });

                },
                // バグ修正：ページロード時にすでに表示領域にある場合も対応
                onRefresh: (self) => {
                    if (self.progress > 0 && !conceptAnimationPlayed) {
                        conceptAnimationPlayed = true;
                        conceptLines.forEach((line) => {
                            gsap.set(line, {
                                opacity: 1,
                                x: 0,
                                clipPath: 'inset(0 0% 0 0)'
                            });
                        });
                    }
                }
            });

            // ========================================
            // Phase 2.7: 動画から白背景への遷移アニメーション
            // ========================================
            const transitionOverlay = document.getElementById('transition-overlay');
            const lineupSection = document.getElementById('lineup-section');
            
            if (transitionOverlay && lineupSection) {
                // CRAFTSMANSHIPセクションの終わりからLineupセクションにかけて白くなる
                gsap.to(transitionOverlay, {
                    opacity: 1,
                    scrollTrigger: {
                        trigger: craftsmanshipSection,
                        start: 'bottom 80%',    // CRAFTSMANSHIPセクションの下部が画面80%に来たら開始
                        end: 'bottom 20%',      // CRAFTSMANSHIPセクションの下部が画面20%に来たら完了
                        scrub: true             // スクロールに完全同期（白くなったら維持）
                    }
                });
            }

            // ========================================
            // Phase 2.8: CRAFTSMANSHIPセクションのワイプアニメーション
            // ========================================
            const craftsmanshipLines = document.querySelectorAll('.craftsmanship-line');
            let craftsmanshipAnimationPlayed = false;

            ScrollTrigger.create({
                trigger: craftsmanshipSection,
                start: 'top 80%',  // より早めにトリガー（バグ修正）
                onEnter: () => {
                    if (!craftsmanshipAnimationPlayed) {
                        craftsmanshipAnimationPlayed = true;
                        // テキストのワイプアニメーション（左から右へ）
                        craftsmanshipLines.forEach((line, index) => {
                            const delay = index * 0.2; // 各行0.2秒ずつ遅延
                            gsap.to(line, {
                                opacity: 1,
                                x: 0,
                                clipPath: 'inset(0 0% 0 0)', // 左から右へワイプ表示
                                duration: 0.8,
                                delay: delay,
                                ease: 'power2.out'
                            });
                        });
                    }
                },
                // バグ修正：ページロード時にすでに表示領域にある場合も対応
                onRefresh: (self) => {
                    if (self.progress > 0 && !craftsmanshipAnimationPlayed) {
                        craftsmanshipAnimationPlayed = true;
                        craftsmanshipLines.forEach((line) => {
                            gsap.set(line, {
                                opacity: 1,
                                x: 0,
                                clipPath: 'inset(0 0% 0 0)'
                            });
                        });
                    }
                }
                // onLeaveBackを削除：一度表示されたら画面上にいる限り消えない
            });

            // ========================================
            // Phase 3: その他の要素のアニメーション
            // ========================================
            const fadeUpElements = gsap.utils.toArray('.fade-up');

            fadeUpElements.forEach((element, index) => {
                gsap.fromTo(element,
                    {
                        opacity: 0,
                        y: 40,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.4,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: element,
                            start: "top 85%",
                            end: "top 20%",
                            toggleActions: "play none none none",
                            // markers: true, // デバッグ用（本番では削除）
                        }
                    }
                );
            });

            // Lineupヘッダーのアニメーション
            const lineupHeader = document.querySelector('.lineup-header');
            if (lineupHeader) {
                gsap.fromTo(lineupHeader,
                    {
                        opacity: 0,
                        y: 30,
                    },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1.3,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: lineupHeader,
                            start: "top 85%",
                            toggleActions: "play none none none",
                        }
                    }
                );
            }

            // 商品カードのアニメーション（stagger付き）
            const productCards = document.querySelectorAll('.product-item');
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
                        stagger: 0.2, // 順次0.2秒遅延
                        scrollTrigger: {
                            trigger: productCards[0].parentElement,
                            start: "top 80%",
                            toggleActions: "play none none none",
                        }
                    }
                );
            }
        });

        // ========================================
        // CRAFTSMANSHIPセクションのスライドショー
        // ========================================
        (function() {
            const slides = document.querySelectorAll('.craftsmanship-slide');
            if (slides.length < 2) return;

            let currentSlide = 0;
            const totalSlides = slides.length;
            const intervalTime = 4000; // 4秒ごとに切り替え

            function showNextSlide() {
                // 現在のスライドをフェードアウト
                slides[currentSlide].style.opacity = '0';
                
                // 次のスライドに移動
                currentSlide = (currentSlide + 1) % totalSlides;
                
                // 次のスライドをフェードイン
                slides[currentSlide].style.opacity = '1';
            }

            // スライドショーを開始
            setInterval(showNextSlide, intervalTime);
        })();
    