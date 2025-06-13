# フルスタック・タスク管理アプリケーション (Trello風かんばんボード)
A full-stack task management application, inspired by Trello, built with a modern serverless stack on Cloudflare.

**✨ Live Demo: [https://my-task-app.あなたのサブドメイン.workers.dev/](https://my-task-app.あなたのサブドメイン.workers.dev/)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

![Trello Clone Screenshot](**ここにアプリのスクリーンショット画像を貼る**)

## 概要 (Overview)

このプロジェクトは、Trelloにインスパイアされた、かんばん方式のタスク管理ツールです。ユーザーは自分だけのボードを作成し、リストやカードを追加し、ドラッグ＆ドロップでタスクの状態を直感的に管理することができます。

モダンなWeb技術（React, Hono, Cloudflare）を駆使し、フロントエンドからバックエンド、データベース、認証、デプロイまで、フルスタックなWebアプリケーション開発の全工程を実践しました。

## 主な機能 (Features)

-   🔐 **ユーザー認証**: Clerkを利用した、メールアドレスとパスワードによる安全なサインアップ・ログイン機能。
-   📋 **ボード管理**: ユーザーごとに複数のボードを作成・管理。
-   📊 **リスト管理**: ボード内に「未着手」「作業中」「完了」などのリストを自由に作成可能。
-   🃏 **カード管理**: 各リストにタスクカードを作成可能。
-   🖐️ **ドラッグ＆ドロップ**: カードをリスト間で直感的にドラッグ＆ドロップして状態を更新。
-   ⚡ **高速な動作**: Cloudflare Workers上で動作するAPIと、Viteでビルドされた高速なフロントエンド。

## 技術スタック (Technology Stack)

| カテゴリ           | 技術                                                                |
| :----------------- | :------------------------------------------------------------------ |
| **フロントエンド** | `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `@dnd-kit`           |
| **バックエンド** | `Cloudflare Workers`, `Hono`, `TypeScript`                          |
| **データベース** | `Cloudflare D1` (SQL)                                               |
| **認証** | `Clerk`                                                             |
| **開発ツール** | `pnpm Workspaces` (モノレポ), `Git`, `GitHub`                         |

## ローカル環境での実行 (Getting Started)

### 前提条件
-   Node.js (v18 or later)
-   pnpm

### インストールと実行
1.  **リポジトリをクローン**
    ```bash
    git clone [https://github.com/あなたのユーザー名/my-task-app.git](https://github.com/あなたのユーザー名/my-task-app.git)
    cd my-task-app
    ```

2.  **依存パッケージをインストール**
    ```bash
    pnpm install
    ```

3.  **開発用の環境変数を設定**
    `packages/backend`フォルダに`.dev.vars`という名前のファイルを作成し、Clerkの開発用キーを設定します。
    ```ini
    # packages/backend/.dev.vars
    CLERK_SECRET_KEY="sk_test_..."
    CLERK_PUBLISHABLE_KEY="pk_test_..."
    ```

4.  **ローカルデータベースのセットアップ**
    ```bash
    pnpm --filter backend exec -- wrangler d1 execute my-task-app-db --file=./packages/backend/schema.sql --local
    ```

5.  **開発サーバーを起動**
    ```bash
    pnpm dev
    ```
    -   フロントエンド: `http://localhost:5173`
    -   バックエンド: `http://localhost:8787`

## デプロイ (Deployment)

このプロジェクトは、`pnpm run deploy`コマンド一発で、フロントエンドのビルドからCloudflare Workersへのデプロイまでが自動的に行われます。

デプロイ前に、Cloudflareの管理画面で本番用の環境変数とシークレットが設定されていることを確認してください。

1.  **Secret Keyの設定 (初回のみ)**
    ```bash
    pnpm --filter backend exec -- wrangler secret put CLERK_SECRET_KEY
    ```
    (Clerkの本番用Secret Keyを入力)

2.  **Publishable Keyの設定**
    `packages/backend/wrangler.jsonc`の`vars`に、`CLERK_PUBLISHABLE_KEY`として本番用のキーを設定します。

3.  **デプロイ実行**
    ```bash
    pnpm run deploy
    ```

## 今後の課題 (Future Improvements)
-   [ ] カードの編集・削除機能の実装
-   [ ] リストのドラッグ＆ドロップによる並べ替え機能
-   [ ] ボードの複数作成・切り替えUIの実装
-   [ ] Vitestによるテストコードの追加
-   [ ] GitHub Actionsを利用したデプロイの完全自動化（CI/CD）

## ライセンス (License)

This project is licensed under the MIT License.