-- 既存のテーブルがあれば削除（初期化用）
DROP TABLE IF EXISTS cards;

DROP TABLE IF EXISTS lists;

DROP TABLE IF EXISTS boards;

DROP TABLE IF EXISTS users;

-- ユーザーテーブル
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    -- ★★★ この一行を追加しました！ ★★★
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ボードテーブル
CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- リストテーブル
CREATE TABLE lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    board_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- カードテーブル
CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    list_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
);

-- テスト用のダミーユーザーを1件追加
INSERT INTO
    users (id, email, name)
VALUES
    ('1', 'testuser@example.com', 'Test User');