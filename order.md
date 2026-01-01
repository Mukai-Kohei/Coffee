【バグ修正依頼】 デプロイ環境およびローカル環境において、ブラウザの再読み込み（リロード）を行った際に、スクロール位置が途中のまま復元されてしまい、以下の問題が発生しています。

オープニングアニメーションが正しく動作しない。

GSAP ScrollTriggerの計算位置がずれる。

これを防ぐため、エントリーポイントとなるJavaScriptファイル（main.js または index.js など）の最上部に、以下の処理を追加してください。

実装要件:

ブラウザの標準機能である「スクロール位置の復元（Scroll Restoration）」を無効化し、リロード時は必ずページトップ（x: 0, y: 0）から開始されるように設定してください。

具体的には、history.scrollRestoration APIを使用し、値を "manual" に設定してください。

さらに念のため、window.scrollTo(0, 0); も実行して確実にトップに戻るようにしてください。

コードイメージ:

JavaScript

// ブラウザのスクロール復元を無効化（リロード時は必ずトップから開始）
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
この処理は、GSAPや他のライブラリが読み込まれる前、可能な限り早い段階で実行されるように配置してください。