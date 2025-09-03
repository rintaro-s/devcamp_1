-- Scdio Database Schema
-- 学校生活の連絡最適化プラットフォーム

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    enrollment_year INTEGER,
    is_teacher BOOLEAN DEFAULT FALSE,
    grade INTEGER,
    class_name VARCHAR(50),
    avatar_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'offline', -- online, away, busy, offline
    status_message TEXT,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 役職テーブル
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    permissions TEXT[], -- JSON形式でparseして権限管理
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ユーザー-役職関連テーブル
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- サーバー（学校/組織）テーブル
CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    invite_code VARCHAR(20) UNIQUE,
    owner_id INTEGER REFERENCES users(id),
    server_type VARCHAR(50) DEFAULT 'school', -- school, club, class
    template_type VARCHAR(50), -- 高校生徒会, 中学部活, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サーバーメンバー
CREATE TABLE IF NOT EXISTS server_members (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, user_id)
);

-- チャンネルテーブル
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'text', -- text, voice, announcement, private
    category_id INTEGER REFERENCES channels(id), -- カテゴリチャンネル
    position INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    role_restrictions INTEGER[], -- アクセス可能な役職ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- メッセージテーブル
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, file, system
    reply_to INTEGER REFERENCES messages(id),
    thread_id INTEGER REFERENCES messages(id), -- スレッドの親メッセージ
    attachments TEXT[], -- ファイルURL配列
    mentions INTEGER[], -- メンションされたユーザーID
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- リアクションテーブル
CREATE TABLE IF NOT EXISTS reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

-- 備品管理テーブル
CREATE TABLE IF NOT EXISTS equipments (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 0,
    location VARCHAR(255),
    condition VARCHAR(50) DEFAULT 'good', -- good, fair, poor, broken
    responsible_user_id INTEGER REFERENCES users(id),
    last_checked TIMESTAMP,
    qr_code VARCHAR(255),
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 予算管理テーブル
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- income, expense
    category VARCHAR(100),
    date DATE DEFAULT CURRENT_DATE,
    approved_by INTEGER REFERENCES users(id),
    receipt_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- イベント管理テーブル
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255),
    organizer_id INTEGER REFERENCES users(id),
    max_participants INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- イベント参加者
CREATE TABLE IF NOT EXISTS event_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'going', -- going, maybe, not_going
    response_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- タスク管理テーブル
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assignee_id INTEGER REFERENCES users(id),
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, review, done
    due_date TIMESTAMP,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    tags VARCHAR(50)[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wikiページテーブル
CREATE TABLE IF NOT EXISTS wiki_pages (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    last_editor_id INTEGER REFERENCES users(id),
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    tags VARCHAR(50)[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, slug)
);

-- Wiki履歴テーブル
CREATE TABLE IF NOT EXISTS wiki_revisions (
    id SERIAL PRIMARY KEY,
    wiki_page_id INTEGER REFERENCES wiki_pages(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    editor_id INTEGER REFERENCES users(id),
    version INTEGER NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投稿テーブル（日記・アルバム）
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- diary, album, announcement
    author_id INTEGER REFERENCES users(id),
    visibility VARCHAR(50) DEFAULT 'public', -- public, private, role_restricted
    image_urls TEXT[],
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags VARCHAR(50)[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投稿コメント
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES post_comments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- いいね
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- post, comment, message
    target_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

-- ホワイトボードテーブル
CREATE TABLE IF NOT EXISTS whiteboards (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    data TEXT, -- JSON形式で描画データ保存
    owner_id INTEGER REFERENCES users(id),
    is_collaborative BOOLEAN DEFAULT TRUE,
    background_color VARCHAR(7) DEFAULT '#ffffff',
    grid_enabled BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- スタンプテーブル
CREATE TABLE IF NOT EXISTS stamps (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    category VARCHAR(100) DEFAULT 'general',
    usage_count INTEGER DEFAULT 0,
    is_animated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投票テーブル
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id),
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    multiple_choice BOOLEAN DEFAULT FALSE,
    anonymous BOOLEAN DEFAULT FALSE,
    end_time TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 投票回答
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知テーブル
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- mention, message, event, task, etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    link_url VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    sender_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ファイルアップロードテーブル
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    uploader_id INTEGER REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_image BOOLEAN DEFAULT FALSE,
    thumbnail_path VARCHAR(500),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初期データの挿入
INSERT INTO roles (name, description, color, permissions) VALUES 
('会長', '生徒会会長', '#ff6b6b', '["admin", "manage_users", "manage_events", "manage_budget"]'),
('副会長', '生徒会副会長', '#4ecdc4', '["manage_events", "manage_budget", "moderate"]'),
('会計', '会計担当', '#45b7d1', '["manage_budget", "view_budget"]'),
('渉外', '渉外担当', '#96ceb4', '["manage_events", "manage_equipment"]'),
('一般部員', '一般部員', '#ffeaa7', '["view_basic"]'),
('OB/OG', 'OB/OG', '#dda0dd', '["view_basic", "view_archive"]');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
