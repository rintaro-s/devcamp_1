const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = 8050;
const saltRounds = 10;
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET; // TODO: move to environment variable

// Socket.IO設定
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : ['http://localhost:5000'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS: configure from environment with safe defaults
const cors = require('cors');
let corsOrigin = process.env.CORS_ORIGIN || '*';
// allow comma-separated list in .env
if (typeof corsOrigin === 'string' && corsOrigin.indexOf(',') !== -1) {
  corsOrigin = corsOrigin.split(',').map(s => s.trim());
}

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(bodyParser.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON received:', buf.toString());
      throw new Error('Invalid JSON');
    }
  }
}));

// JSON parsing error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('Bad JSON:', error.message);
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 招待コード生成関数
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// 権限チェック関数
function hasPermission(userPermissions, requiredPermission) {
  return (userPermissions & requiredPermission) === requiredPermission;
}

// 権限定数
const PERMISSIONS = {
  VIEW_CHANNELS: 1,
  SEND_MESSAGES: 2,
  MANAGE_MESSAGES: 4,
  MANAGE_CHANNELS: 8,
  MANAGE_ROLES: 16,
  MANAGE_SERVER: 32,
  ADMIN: 64
};

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath, { recursive: true });
    }
    
    if (file.fieldname === 'stamps') {
      cb(null, path.join(uploadPath, 'stamps'));
    } else if (file.fieldname === 'avatar') {
      cb(null, path.join(uploadPath, 'avatars'));
    } else if (file.fieldname === 'server_icon') {
      cb(null, path.join(uploadPath, 'server_icons'));
    } else {
      cb(null, uploadPath);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'stamps' || file.fieldname === 'avatar' || file.fieldname === 'server_icon') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    } else {
      cb(null, true);
    }
  }
});

// JWT認証ミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// サーバーメンバーシップチェックミドルウェア
const checkServerMembership = async (req, res, next) => {
  try {
    const serverId = req.params.serverId || req.body.server_id;
    if (!serverId) {
      return res.status(400).json({ error: 'Server ID is required' });
    }

    const result = await db.query(
      'SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2',
      [serverId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    req.serverMembership = result.rows[0];
    next();
  } catch (error) {
    console.error('Server membership check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// サーバー権限チェックミドルウェア
const checkServerPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const serverId = req.params.serverId || req.body.server_id;
      
      // サーバーオーナーかチェック
      const serverResult = await db.query(
        'SELECT owner_id FROM servers WHERE id = $1',
        [serverId]
      );
      
      if (serverResult.rows[0]?.owner_id === req.user.id) {
        req.userPermissions = PERMISSIONS.ADMIN;
        return next();
      }

      // ユーザーのロールから権限を取得
      const rolesResult = await db.query(`
        SELECT COALESCE(BIT_OR(sr.permissions), 0) as permissions
        FROM member_roles mr
        JOIN server_roles sr ON mr.role_id = sr.id
        WHERE mr.server_id = $1 AND mr.user_id = $2
      `, [serverId, req.user.id]);

      const userPermissions = parseInt(rolesResult.rows[0]?.permissions || 0);
      req.userPermissions = userPermissions;

      if (!hasPermission(userPermissions, requiredPermission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// ====================
// 認証関連のAPI
// ====================

// ユーザー登録
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // ユーザー名とメールの重複チェック
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ユーザーログイン
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await db.query(
      'SELECT id, username, email, password FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // パスワードを除外して返す
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ユーザー情報取得
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, email, avatar_url, bio, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ユーザープロフィール更新
app.put('/api/users/me', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { username, email, bio, status } = req.body;
    let avatar_url = null;

    if (req.file) {
      avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updateFields.push(`username = $${paramCount++}`);
      values.push(username);
    }
    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (avatar_url) {
      updateFields.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(req.user.id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, avatar_url, bio, status, created_at, updated_at
    `;

    const result = await db.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================
// サーバー関連のAPI
// ====================

// サーバー作成
app.post('/api/servers', authenticateToken, upload.single('server_icon'), async (req, res) => {
  try {
    const { name, description } = req.body;
    let icon_url = null;

    if (req.file) {
      icon_url = `/uploads/server_icons/${req.file.filename}`;
    }

    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    const invite_code = generateInviteCode();

    // サーバー作成
    const serverResult = await db.query(
      'INSERT INTO servers (name, description, icon_url, owner_id, invite_code) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, icon_url, req.user.id, invite_code]
    );

    const server = serverResult.rows[0];

    // オーナーをサーバーメンバーに追加
    await db.query(
      'INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)',
      [server.id, req.user.id]
    );

    // デフォルトロールとチャンネルを作成
    await db.query('SELECT create_default_server_roles($1)', [server.id]);
    await db.query('SELECT create_default_channels($1)', [server.id]);

    // オーナーにAdminロールを付与
    const adminRole = await db.query(
      'SELECT id FROM server_roles WHERE server_id = $1 AND name = $2',
      [server.id, 'Admin']
    );

    if (adminRole.rows.length > 0) {
      await db.query(
        'INSERT INTO member_roles (server_id, user_id, role_id) VALUES ($1, $2, $3)',
        [server.id, req.user.id, adminRole.rows[0].id]
      );
    }

    res.status(201).json(server);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ユーザーのサーバー一覧取得
app.get('/api/servers', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, sm.joined_at,
        (SELECT COUNT(*) FROM server_members WHERE server_id = s.id) as member_count
      FROM servers s
      JOIN server_members sm ON s.id = sm.server_id
      WHERE sm.user_id = $1
      ORDER BY sm.joined_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// サーバー詳細取得
app.get('/api/servers/:serverId', authenticateToken, checkServerMembership, async (req, res) => {
  try {
    const serverResult = await db.query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM server_members WHERE server_id = s.id) as member_count,
        u.username as owner_username
      FROM servers s
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = $1
    `, [req.params.serverId]);

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(serverResult.rows[0]);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// サーバーに招待コードで参加
app.post('/api/servers/join', authenticateToken, async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // サーバー検索
    const serverResult = await db.query(
      'SELECT * FROM servers WHERE invite_code = $1',
      [invite_code.toUpperCase()]
    );

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const server = serverResult.rows[0];

    // 既にメンバーかチェック
    const memberResult = await db.query(
      'SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2',
      [server.id, req.user.id]
    );

    if (memberResult.rows.length > 0) {
      return res.status(400).json({ error: 'You are already a member of this server' });
    }

    // メンバーに追加
    await db.query(
      'INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)',
      [server.id, req.user.id]
    );

    // @everyoneロールを付与
    const everyoneRole = await db.query(
      'SELECT id FROM server_roles WHERE server_id = $1 AND name = $2',
      [server.id, '@everyone']
    );

    if (everyoneRole.rows.length > 0) {
      await db.query(
        'INSERT INTO member_roles (server_id, user_id, role_id) VALUES ($1, $2, $3)',
        [server.id, req.user.id, everyoneRole.rows[0].id]
      );
    }

    res.json({ message: 'Successfully joined server', server });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// サーバーメンバー一覧取得
app.get('/api/servers/:serverId/members', authenticateToken, checkServerMembership, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.avatar_url, u.status, sm.joined_at,
        ARRAY_AGG(sr.name) as roles,
        ARRAY_AGG(sr.color) as role_colors
      FROM users u
      JOIN server_members sm ON u.id = sm.user_id
      LEFT JOIN member_roles mr ON sm.server_id = mr.server_id AND sm.user_id = mr.user_id
      LEFT JOIN server_roles sr ON mr.role_id = sr.id
      WHERE sm.server_id = $1
      GROUP BY u.id, u.username, u.avatar_url, u.status, sm.joined_at
      ORDER BY sm.joined_at
    `, [req.params.serverId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get server members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ====================
// チャンネル関連のAPI
// ====================

// サーバーのチャンネル一覧取得
app.get('/api/servers/:serverId/channels', authenticateToken, checkServerMembership, async (req, res) => {
  try {
    const categoriesResult = await db.query(`
      SELECT c.*, 
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ch.id,
              'name', ch.name,
              'description', ch.description,
              'type', ch.type,
              'position', ch.position
            ) ORDER BY ch.position
          ) FILTER (WHERE ch.id IS NOT NULL),
          '[]'::json
        ) as channels
      FROM categories c
      LEFT JOIN channels ch ON c.id = ch.category_id
      WHERE c.server_id = $1
      GROUP BY c.id, c.name, c.position
      ORDER BY c.position
    `, [req.params.serverId]);

    // カテゴリーなしのチャンネルも取得
    const uncategorizedResult = await db.query(`
      SELECT * FROM channels 
      WHERE server_id = $1 AND category_id IS NULL
      ORDER BY position
    `, [req.params.serverId]);

    const response = {
      categories: categoriesResult.rows,
      uncategorized_channels: uncategorizedResult.rows
    };

    res.json(response);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// チャンネル作成
app.post('/api/servers/:serverId/channels', 
  authenticateToken, 
  checkServerMembership, 
  checkServerPermission(PERMISSIONS.MANAGE_CHANNELS), 
  async (req, res) => {
    try {
      const { name, description, type = 'text', category_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Channel name is required' });
      }

      // 位置を決定（最後の位置 + 1）
      const positionResult = await db.query(
        'SELECT COALESCE(MAX(position), -1) + 1 as position FROM channels WHERE server_id = $1 AND category_id = $2',
        [req.params.serverId, category_id || null]
      );

      const position = positionResult.rows[0].position;

      const result = await db.query(
        'INSERT INTO channels (server_id, category_id, name, description, type, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [req.params.serverId, category_id || null, name, description, type, position]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create channel error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ====================
// メッセージ関連のAPI
// ====================

// チャンネルのメッセージ一覧取得
app.get('/api/channels/:channelId/messages', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;

    // チャンネルのサーバーIDを取得してメンバーシップをチェック
    const channelResult = await db.query(
      'SELECT server_id FROM channels WHERE id = $1',
      [req.params.channelId]
    );

    if (channelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const serverId = channelResult.rows[0].server_id;

    // サーバーメンバーシップチェック
    const memberResult = await db.query(
      'SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2',
      [serverId, req.user.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this server' });
    }

    let query = `
      SELECT m.*, u.username, u.avatar_url,
        CASE WHEN m.reply_to IS NOT NULL THEN
          JSON_BUILD_OBJECT(
            'id', rm.id,
            'content', rm.content,
            'username', ru.username
          )
        END as reply_message
      FROM messages m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN messages rm ON m.reply_to = rm.id
      LEFT JOIN users ru ON rm.user_id = ru.id
      WHERE m.channel_id = $1
    `;

    const values = [req.params.channelId];

    if (before) {
      query += ' AND m.created_at < $2';
      values.push(before);
    }

    query += ' ORDER BY m.created_at DESC LIMIT $' + (values.length + 1);
    values.push(parseInt(limit));

    const result = await db.query(query, values);
    res.json(result.rows.reverse()); // 古い順に並び替え
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.IO接続管理
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ユーザー認証
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      connectedUsers.set(decoded.id, socket.id);
      
      // ユーザーのサーバー一覧を取得してルームに参加
      const servers = await db.query(`
        SELECT s.id FROM servers s
        JOIN server_members sm ON s.id = sm.server_id
        WHERE sm.user_id = $1
      `, [decoded.id]);

      servers.rows.forEach(server => {
        socket.join(`server_${server.id}`);
      });

      socket.emit('authenticated', { userId: decoded.id, username: decoded.username });
    } catch (error) {
      socket.emit('authentication_error', { error: 'Invalid token' });
    }
  });

  // メッセージ送信
  socket.on('send_message', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('error', { error: 'Not authenticated' });
        return;
      }

      const { channel_id, content, attachments, reply_to } = data;

      if (!content && (!attachments || attachments.length === 0)) {
        socket.emit('error', { error: 'Message content is required' });
        return;
      }

      // メッセージをデータベースに保存
      const result = await db.query(`
        INSERT INTO messages (channel_id, user_id, content, attachments, reply_to)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [channel_id, socket.userId, content, JSON.stringify(attachments || []), reply_to]);

      const message = result.rows[0];

      // ユーザー情報を付加
      const userResult = await db.query(
        'SELECT username, avatar_url FROM users WHERE id = $1',
        [socket.userId]
      );

      const messageWithUser = {
        ...message,
        username: userResult.rows[0].username,
        avatar_url: userResult.rows[0].avatar_url
      };

      // チャンネルのサーバーを取得
      const channelResult = await db.query(
        'SELECT server_id FROM channels WHERE id = $1',
        [channel_id]
      );

      if (channelResult.rows.length > 0) {
        const serverId = channelResult.rows[0].server_id;
        io.to(`server_${serverId}`).emit('new_message', messageWithUser);
      }

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { error: 'Failed to send message' });
    }
  });

  // チャンネル参加
  socket.on('join_channel', (channelId) => {
    socket.join(`channel_${channelId}`);
  });

  // チャンネル離脱
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel_${channelId}`);
  });

  // 切断処理
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
  });
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// サーバー起動
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
