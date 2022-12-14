これは何?
  TypeScriptとWebGL習熟のために作ったレイトレーサです。
  build/index.htmlを開いて実行します。
  主にsrcフォルダ内が書いたコードで、Webpackによりbuild/index.jsにまとめられています。

何も表示されないし、フリーズしている
  GLSLのコンパイルに時間がかかっていると思われます。
  数分かかることがありますが、待ってください。
  WebGLにSPIR-Vを渡せれば多少短縮できると思いますが、その手段が見当たりませんでした。
  ブラウザの開発者ツールでコンソールに"initializing script"と出力されていれば、コンパイル中です。

めっちゃ重いんですけど?
  グラフィック性能によっては、そうなります。
  生成したGLSLを一度SPIR-Vに変換、最適化してから実行用のGLSLに再変換していますが、
  本質的な計算量/計算資源については解決できません。

ビルドコマンドは?
  npm run build

特徴は?
  TypeScriptから距離関数やプロシージャルなマテリアルを組み立てることができます。
  GLSLに無いオブジェクト指向やジェネリクスを補うことができます。
  また、TypeScriptから距離関数が見えるので、当たり判定などに活用できます。

実用は?
  推奨しません。
  これは開発環境の制限下(4GBストレージ, ポータブル)での実験的な実装であり、より良い実装があるはずです。
    Chrome-Canaryの利用
      WebGLではなくWebGPU、またComputeShaderの利用を見据えた開発ができます。
    TypeScriptではなくRust
      rust-gpuを使えば(2022/6/29 ではアーリーステージですが)、RustからSPIR-Vを出力できます。
      RustからSPIR-VとWebAsmあるいはネイティブ向けのバイナリを出力するのが綺麗なのではと考えています。
  距離関数はちょっと扱いづらいです。
    フラクタルなど得意な図形もありますが、任意形状を作るならそれ用のツールが欲しいです。
    滑かなカーブが欲しいならPN-Triangleなどの曲面パッチをテッセレートする方がポリゴンから移行のハードルは低いと思います。
  マテリアルを実行時に都度計算するのは重いです。
    バンプマップを乱数から生成して適用する場合などが顕著です。
    プロシージャルなマテリアルを画像化せずに保持しておくのは容量やLOD適応で有利ではあります。
    ロード時に各種テクスチャを生成するくらいが妥当な落としどころかも知れません。
