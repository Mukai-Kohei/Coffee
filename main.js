
        // =============================================
        // 最優先: スクロール位置を強制的にトップにリセット
        // =============================================
        (function forceScrollToTop() {
            // History APIでブラウザのスクロール復元を無効化
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }

            // 即座にスクロール位置をリセット（複数の方法で確実に）
            window.scrollTo(0, 0);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // スタイルでも強制
            document.documentElement.style.scrollBehavior = 'auto';

            console.log('✅ Scroll position reset to top');
        })();

        console.log('✅ Main script starting...');

        // ローディング画面の背景画像をランダムに設定
        const loadingImages = ['./coffee.JPG', './焙煎機.JPG'];
        const randomImage = loadingImages[Math.floor(Math.random() * loadingImages.length)];
        const preloaderElement = document.getElementById('preloader');
        if (preloaderElement) {
            preloaderElement.style.backgroundImage = `url('${randomImage}')`;
        }

        // グローバル状態管理
        let isVideoReady = false;
        let videoReadyTimeout = null;
        let hasInitialized = false;

        // 動画を確実に初期化する関数（キャッシュ完全回避・リロード時も毎回実行）
        function initializeVideo() {
            console.log('🎬 Initializing video (fresh load)...');

            const heroVideoIframe = document.getElementById('hero-video-iframe');
            if (!heroVideoIframe) {
                console.log('⚠️ Video iframe not found');
                isVideoReady = true;
                return;
            }

            // キャッシュを完全に回避するために毎回ユニークなパラメータを追加
            const timestamp = new Date().getTime();
            const randomParam = Math.random().toString(36).substring(7);
            const sessionParam = Math.floor(Math.random() * 1000000);

            // より多くのキャッシュバスター付きURL
            const newSrc = `https://www.youtube.com/embed/EsEM4zzvE2k?autoplay=1&mute=1&loop=1&playlist=EsEM4zzvE2k&controls=0&start=4&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&disablekb=1&fs=0&iv_load_policy=3&version=3&nocache=${timestamp}&rand=${randomParam}&session=${sessionParam}`;

            console.log('🔄 Setting fresh video src');

            // 既存のタイムアウトをクリア
            if (videoReadyTimeout) {
                clearTimeout(videoReadyTimeout);
            }

            // リセット
            isVideoReady = false;

            // 最大待機時間（2秒）のフォールバック
            videoReadyTimeout = setTimeout(() => {
                console.log('⚠️ Video load timeout - proceeding anyway');
                isVideoReady = true;
            }, 2000);

            // 古いイベントリスナーをクリーンアップ
            const oldOnLoad = heroVideoIframe.onload;
            const oldOnError = heroVideoIframe.onerror;

            // loadイベントハンドラ
            heroVideoIframe.onload = () => {
                console.log('✅ Video iframe loaded successfully');
                clearTimeout(videoReadyTimeout);
                isVideoReady = true;
            };

            // エラーハンドラ
            heroVideoIframe.onerror = () => {
                console.log('⚠️ Video iframe load error - continuing anyway');
                clearTimeout(videoReadyTimeout);
                isVideoReady = true;
            };

            // srcを直接設定（これにより確実に再読み込みが発生）
            heroVideoIframe.src = newSrc;
        }

        // =============================================
        // 複数のタイミングでスクロールリセットを確実に実行
        // =============================================

        // DOMContentLoaded時
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOMContentLoaded - resetting scroll');
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            initializeVideo();
        });

        // pageshow時（bfcache・リロード対策）
        window.addEventListener('pageshow', (event) => {
            console.log('📄 pageshow - persisted:', event.persisted);
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // bfcacheから復帰した場合は完全にリセット
            if (event.persisted) {
                console.log('🔄 Restoring from bfcache - full reset');
                location.reload();
            }
        });

        // 念のため即座に初期化（既にDOMが準備できている場合）
        if (document.readyState !== 'loading') {
            console.log('📄 DOM already ready');
            initializeVideo();
        }

        // =============================================
        // GSAPとScrollTriggerの初期化
        // =============================================
        gsap.registerPlugin(ScrollTrigger);

        // ScrollTriggerのグローバル設定
        ScrollTrigger.config({
            ignoreMobileResize: true,
            autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load'
        });

        // 既存のScrollTriggerインスタンスをすべてクリア（リロード時の残骸対策）
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());

        console.log('✅ ScrollTrigger initialized and cleared');

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
            // 既に初期化済みの場合はスキップ（重複実行防止）
            if (hasInitialized) {
                console.log('⚠️ Already initialized, skipping...');
                return;
            }
            hasInitialized = true;

            console.log('🚀 Page load event triggered');

            // アニメーション中はスクロールを禁止
            document.body.classList.add('no-scroll');

            // TOPから確実にスタート（複数回実行で確実に）
            window.scrollTo(0, 0);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // ScrollTriggerを完全にリセットしてから再計算
            console.log('🔄 Killing all ScrollTrigger instances');
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());

            // 少し待ってからrefresh（DOM安定化のため）
            setTimeout(() => {
                ScrollTrigger.refresh();
                console.log('✅ ScrollTrigger refreshed');
            }, 100);

            // 動画の準備完了を待つ（バグ修正：確実に動画を表示）
            let checkCount = 0;
            const maxChecks = 50; // 最大5秒（100ms × 50）

            const waitForVideo = () => {
                checkCount++;

                if (isVideoReady) {
                    console.log('✅ Video ready, starting hero animation');
                    startHeroAnimation();
                } else if (checkCount >= maxChecks) {
                    console.log('⚠️ Max wait time reached, forcing start');
                    isVideoReady = true;
                    startHeroAnimation();
                } else {
                    setTimeout(waitForVideo, 100);
                }
            };

            // 最低表示時間（1.2秒）を確保してから動画チェック開始
            setTimeout(() => {
                waitForVideo();
            }, 1200);

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
                        console.log('✅ Master timeline complete - finalizing');

                        // すべてのアニメーション完了後、スクロールを許可
                        document.body.classList.remove('no-scroll');

                        // 背景色をブランドライトに変更
                        document.body.style.backgroundColor = '#F5F5F3';

                        // 最終的な中央揃えを強制（レースコンディション対策）
                        gsap.set(heroSubcopy, { xPercent: -50, yPercent: -50, y: 0 });

                        // スクロール位置を最終確認
                        window.scrollTo(0, 0);
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;

                        // ScrollTriggerを再度完全にリフレッシュ（最終調整）
                        setTimeout(() => {
                            ScrollTrigger.refresh(true); // 強制的に完全リフレッシュ
                            console.log('✅ Final ScrollTrigger refresh complete');

                            // Lenisを初期化
                            initLenis();
                            console.log('✅ Lenis initialized');
                        }, 200);
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
            console.log('🎯 DOMContentLoaded - Setting up animations');

            // TOPから確実にスタート
            window.scrollTo(0, 0);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // =============================================
            // アニメーション要素の初期状態を確実に設定
            // =============================================
            const conceptLines = document.querySelectorAll('.concept-line');
            const craftsmanshipLines = document.querySelectorAll('.craftsmanship-line');

            // concept-lineの初期状態を設定
            if (conceptLines.length > 0) {
                conceptLines.forEach(line => {
                    gsap.set(line, {
                        opacity: 0,
                        x: -20,
                        clipPath: 'inset(0 100% 0 0)'
                    });
                });
                console.log(`✅ Set initial state for ${conceptLines.length} concept lines`);
            }

            // craftsmanship-lineの初期状態を設定
            if (craftsmanshipLines.length > 0) {
                craftsmanshipLines.forEach(line => {
                    gsap.set(line, {
                        opacity: 0,
                        x: -15,
                        clipPath: 'inset(0 100% 0 0)'
                    });
                });
                console.log(`✅ Set initial state for ${craftsmanshipLines.length} craftsmanship lines`);
            }

            // fade-up要素の初期状態を設定
            const fadeUpElements = document.querySelectorAll('.fade-up');
            if (fadeUpElements.length > 0) {
                fadeUpElements.forEach(element => {
                    gsap.set(element, { opacity: 0, y: 40 });
                });
                console.log(`✅ Set initial state for ${fadeUpElements.length} fade-up elements`);
            }

            // lineup-header要素の初期状態を設定
            const lineupHeader = document.querySelector('.lineup-header');
            if (lineupHeader) {
                gsap.set(lineupHeader, { opacity: 0, y: 30 });
                console.log('✅ Set initial state for lineup header');
            }

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
                        console.log('🎬 Concept animation triggered');
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
                // バグ修正：ページロード時・リロード時にすでに表示領域にある場合も対応
                onRefresh: (self) => {
                    console.log('🔄 Concept ScrollTrigger refresh - progress:', self.progress);
                    // スクロール位置が既にトリガーを過ぎている場合は即座に表示
                    if (self.progress > 0 && !conceptAnimationPlayed) {
                        console.log('⚡ Fast-forwarding concept animation');
                        conceptAnimationPlayed = true;
                        conceptLines.forEach((line) => {
                            gsap.set(line, {
                                opacity: 1,
                                x: 0,
                                clipPath: 'inset(0 0% 0 0)'
                            });
                        });
                    }
                    // トリガー位置より前にいる場合は確実に初期状態に
                    else if (self.progress === 0 && !conceptAnimationPlayed) {
                        conceptLines.forEach((line) => {
                            gsap.set(line, {
                                opacity: 0,
                                x: -20,
                                clipPath: 'inset(0 100% 0 0)'
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
                        console.log('🎬 Craftsmanship animation triggered');
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
                // バグ修正：ページロード時・リロード時にすでに表示領域にある場合も対応
                onRefresh: (self) => {
                    console.log('🔄 Craftsmanship ScrollTrigger refresh - progress:', self.progress);
                    // スクロール位置が既にトリガーを過ぎている場合は即座に表示
                    if (self.progress > 0 && !craftsmanshipAnimationPlayed) {
                        console.log('⚡ Fast-forwarding craftsmanship animation');
                        craftsmanshipAnimationPlayed = true;
                        craftsmanshipLines.forEach((line) => {
                            gsap.set(line, {
                                opacity: 1,
                                x: 0,
                                clipPath: 'inset(0 0% 0 0)'
                            });
                        });
                    }
                    // トリガー位置より前にいる場合は確実に初期状態に
                    else if (self.progress === 0 && !craftsmanshipAnimationPlayed) {
                        craftsmanshipLines.forEach((line) => {
                            gsap.set(line, {
                                opacity: 0,
                                x: -15,
                                clipPath: 'inset(0 100% 0 0)'
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
    