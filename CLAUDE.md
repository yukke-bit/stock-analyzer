# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

- `npm run dev` - 開発サーバーを起動（http://localhost:3000）
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバー起動
- `npm run lint` - ESLintでコードチェック
- `npm run type-check` - TypeScriptの型チェック

## プロジェクト概要

日本株の株価データを取得・分析し、テクニカル分析とファンダメンタル分析の両面から買い時を判定するWEBアプリケーション。

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **チャート**: Chart.js + react-chartjs-2
- **データ取得**: Yahoo Finance スクレイピング (cheerio + axios)
- **認証**: NextAuth.js（特定ユーザー限定公開）
- **データ保存**: JSONファイルベース（Termux環境でのSQLite問題回避）

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── stocks/        # 株価データ取得API
│   │   └── analysis/      # 分析結果API
│   ├── components/        # Reactコンポーネント
│   ├── lib/              # ユーティリティ関数
│   │   ├── scraper.ts    # Yahoo Finance スクレイピング
│   │   ├── technical.ts  # テクニカル分析
│   │   ├── fundamental.ts # ファンダメンタル分析
│   │   └── judgment.ts   # 買い時判定エンジン
│   └── types/            # TypeScript型定義
data/                     # 株価データキャッシュ（JSON）
```

## 主要機能

### 1. 株価データ取得
- Yahoo Finance からのスクレイピング
- 日本株対応（銘柄コード.T形式）
- JSONファイルでのデータキャッシュ

### 2. 分析エンジン

**テクニカル分析指標:**
- 移動平均線（5日、25日、75日）
- ボリンジャーバンド
- RSI（14日）
- MACD
- ストキャスティクス
- 一目均衡表

**ファンダメンタル分析指標:**
- PER（株価収益率）
- PBR（株価純資産倍率）
- ROE（自己資本利益率）
- 配当利回り
- 売上成長率
- 自己資本比率

### 3. 買い時判定システム
- 各指標を0-100でスコア化
- テクニカル：ファンダメンタル = 60：40の重み付け
- 総合スコア80+で「強い買いシグナル」
- 60-80で「買い検討」、60未満で「様子見」

## 開発上の注意点

- Termux環境での開発のため、ネイティブモジュール（SQLite等）は避ける
- スクレイピング対象サイトの利用規約を遵守
- 投資判断は自己責任であることを明記
- データの精度・リアルタイム性に制限があることを表示

## デプロイ

- 特定ユーザー限定公開（NextAuth.js）
- 非商用利用
- GitHub管理でのデプロイ推奨