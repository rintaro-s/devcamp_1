# Scdio Platform - セットアップ＆使用ガイド

## � ポート設定
- **バックエンドAPI**: ポート 8050
- **フロントエンド**: ポート 5000

## �🚀 クイックスタート

### 1. 環境の確認
```powershell
# Node.jsのバージョン確認
node --version  # v16以上が必要

# PostgreSQLのバージョン確認  
psql --version  # v12以上が推奨
```

### 2. データベースのセットアップ
```powershell
# PostgreSQLデータベースの作成
createdb scdio_platform

# 管理者権限でPostgreSQLに接続
psql -U postgres -d scdio_platform
```

以下のSQLを実行してテーブルを作成：
```sql
-- ユーザーテーブル
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    enrollment_year INTEGER,
    is_teacher BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サーバーテーブル
CREATE TABLE servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    icon_url VARCHAR(255),
    invite_code VARCHAR(20) UNIQUE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- チャンネルテーブル
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'text',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サーバーメンバーテーブル
CREATE TABLE server_members (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, user_id)
);

-- メッセージテーブル
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックスの作成
CREATE INDEX idx_server_members_server_id ON server_members(server_id);
CREATE INDEX idx_server_members_user_id ON server_members(user_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_channels_server_id ON channels(server_id);
```

### 3. バックエンドの起動
```powershell
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール
npm install

# 環境変数ファイルの作成
echo 'PORT=8050
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scdio_platform
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_here' > .env

# サーバー起動
npm start
```

### 4. フロントエンドの起動
```powershell
# 新しいPowerShellウィンドウで
cd frontend

# 依存関係のインストール
npm install

# 開発サーバー起動
npm start
```

## 🎯 基本的な使い方

### アカウント作成
1. ブラウザで `http://localhost:5000` にアクセス
2. 「新規登録」ボタンをクリック
3. 必要情報を入力：
   - ユーザー名（ユニークである必要があります）
   - メールアドレス
   - パスワード（確認用も含む）
   - フルネーム
   - 入学年度
   - 教師として登録する場合はチェックボックスをオン

### ログイン
1. ユーザー名/メールアドレスとパスワードを入力
2. 「ログイン」ボタンをクリック

### サーバーの作成（教師のみ）
1. サイドバーの「サーバー管理」をクリック
2. 「新しいサーバーを作成」ボタンをクリック
3. 以下を入力：
   - サーバー名
   - 説明
   - テンプレート選択（学校/部活動/ゼミ）
4. 「作成」ボタンで完了

### サーバーに参加
1. 管理者から招待コードを取得
2. 「サーバー管理」→「サーバーに参加」
3. 招待コードを入力して「参加」

### チャンネルでの通信
1. サイドバーでサーバーを選択
2. 参加したいチャンネルをクリック
3. メッセージ入力欄でコミュニケーション

## 🔧 管理者機能

### メンバー管理
1. 「サーバー管理」ページでサーバーを選択
2. 「メンバー管理」セクションで権限変更
3. 「管理者に昇格」「メンバーに降格」で権限調整

### 招待コードの生成
1. サーバー詳細で「新しい招待コードを生成」
2. 生成されたコードをメンバーに共有

## 🎨 UI機能

### テーマシステム
- ライト/ダークモード切り替え
- 美しいグラデーション背景
- ガラスモーフィズム効果

### アニメーション
- ページ遷移のスムーズなアニメーション
- ボタンやカードのホバー効果
- フォーム入力時の動的フィードバック

## 🔍 トラブルシューティング

### よくある問題と解決方法

**データベース接続エラー**
```powershell
# PostgreSQLサービスの状態確認
Get-Service postgresql*

# サービスの起動
Start-Service postgresql-x64-14  # バージョンに応じて調整
```

**ポート競合エラー**
```powershell
# ポート使用状況の確認
netstat -ano | findstr :8050
netstat -ano | findstr :5000

# プロセスの終了（PIDを指定）
taskkill /PID [PID番号] /F
```

**Node.jsパッケージエラー**
```powershell
# キャッシュのクリア
npm cache clean --force

# node_modulesの削除と再インストール
Remove-Item -Recurse -Force node_modules
npm install
```

### ログの確認

**バックエンドログ**
```powershell
# バックエンドディレクトリで
npm start  # コンソールでログを確認
```

**ブラウザ開発者ツール**
- F12キーで開発者ツールを開く
- Consoleタブでエラーメッセージを確認
- Networkタブでリクエスト/レスポンスを確認

## 📱 画面説明

### メイン画面構成
- **ヘッダー**: 現在のサーバー・チャンネル情報
- **サイドバー**: サーバー選択、チャンネル一覧、ユーザー情報
- **メインエリア**: メッセージ表示、チャット入力
- **右サイドバー**: オンラインメンバー、通知

### 管理画面
- **サーバー管理**: サーバー作成、設定変更
- **メンバー管理**: 権限変更、招待管理
- **チャンネル管理**: チャンネルの作成・編集・削除

## 🔐 セキュリティ機能

### 認証システム
- JWT（JSON Web Token）による認証
- パスワードハッシュ化（bcrypt使用）
- セッション管理

### アクセス制御
- 役職ベースの権限管理
- サーバーごとの参加制限
- 管理者権限の階層構造

## 📊 パフォーマンス最適化

### フロントエンド
- React.memoによるコンポーネント最適化
- 遅延読み込み（Lazy Loading）
- バンドルサイズの最適化

### バックエンド
- データベースインデックスの活用
- API応答キャッシュ
- Socket.io接続の効率化

## 🔄 開発・拡張

### 新機能の追加
1. バックエンドAPIの拡張
2. フロントエンドコンポーネントの作成
3. データベーススキーマの更新

### カスタマイズ
- テーマカラーの変更
- サーバーテンプレートの追加
- 新しいチャンネルタイプの実装

---

**Scdio Platform で素晴らしい教育コミュニティを築きましょう！** 🎓✨
