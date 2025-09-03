-- 新しいサーバーベースのデータベーススキーマ

-- ユーザーテーブル（既存を拡張）
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  status VARCHAR(50) DEFAULT 'offline', -- online, idle, dnd, offline
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サーバーテーブル（新規）
CREATE TABLE IF NOT EXISTS servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サーバーメンバーテーブル（新規）
CREATE TABLE IF NOT EXISTS server_members (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(server_id, user_id)
);

-- サーバーロールテーブル（新規）
CREATE TABLE IF NOT EXISTS server_roles (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#99aab5', -- hex color
  position INTEGER DEFAULT 0,
  permissions BIGINT DEFAULT 0, -- bitwise permissions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- メンバーロールテーブル（新規）
CREATE TABLE IF NOT EXISTS member_roles (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES server_roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- カテゴリーテーブル（新規）
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- チャンネルテーブル（新規）
CREATE TABLE IF NOT EXISTS channels (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, voice, announcement
  position INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '{}', -- role-based permissions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- メッセージテーブル（新規）
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  attachments JSONB DEFAULT '[]',
  embeds JSONB DEFAULT '[]',
  mentions JSONB DEFAULT '[]',
  reply_to INTEGER REFERENCES messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- タスクテーブル（サーバーベースに更新）
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- イベントテーブル（サーバーベースに更新）
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(255),
  max_participants INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- イベント参加者テーブル（新規）
CREATE TABLE IF NOT EXISTS event_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'interested', -- interested, going, not_going
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- ホワイトボードテーブル（サーバーベースに更新）
CREATE TABLE IF NOT EXISTS whiteboards (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  data JSONB DEFAULT '{}',
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}', -- view/edit permissions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 予算管理テーブル（サーバーベースに更新）
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100),
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 備品管理テーブル（サーバーベースに更新）
CREATE TABLE IF NOT EXISTS equipments (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  location VARCHAR(255),
  manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- アナウンスメントテーブル（新規）
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知テーブル（新規）
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- mention, message, task_assigned, event_reminder, etc
  title VARCHAR(255) NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_server_id ON tasks(server_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_events_server_id ON events(server_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- 権限の初期値設定（ビットマスク）
-- 1: VIEW_CHANNELS
-- 2: SEND_MESSAGES  
-- 4: MANAGE_MESSAGES
-- 8: MANAGE_CHANNELS
-- 16: MANAGE_ROLES
-- 32: MANAGE_SERVER
-- 64: ADMIN
-- など...

-- デフォルトサーバーロール作成関数
CREATE OR REPLACE FUNCTION create_default_server_roles(server_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
  -- @everyone role (all members get this)
  INSERT INTO server_roles (server_id, name, color, position, permissions)
  VALUES (server_id_param, '@everyone', '#99aab5', 0, 3); -- VIEW_CHANNELS + SEND_MESSAGES
  
  -- Moderator role
  INSERT INTO server_roles (server_id, name, color, position, permissions)
  VALUES (server_id_param, 'Moderator', '#3498db', 1, 31); -- Most permissions except ADMIN
  
  -- Admin role (server owner gets this)
  INSERT INTO server_roles (server_id, name, color, position, permissions)
  VALUES (server_id_param, 'Admin', '#e74c3c', 2, 127); -- All permissions
END;
$$ LANGUAGE plpgsql;

-- デフォルトチャンネル作成関数
CREATE OR REPLACE FUNCTION create_default_channels(server_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
  general_category_id INTEGER;
BEGIN
  -- General category
  INSERT INTO categories (server_id, name, position)
  VALUES (server_id_param, 'General', 0)
  RETURNING id INTO general_category_id;
  
  -- General text channel
  INSERT INTO channels (server_id, category_id, name, type, position)
  VALUES (server_id_param, general_category_id, 'general', 'text', 0);
  
  -- Announcements channel
  INSERT INTO channels (server_id, category_id, name, type, position)
  VALUES (server_id_param, general_category_id, 'announcements', 'announcement', 1);
END;
$$ LANGUAGE plpgsql;
