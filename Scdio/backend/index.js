const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8051;  // 異なるポートを使用
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

app.use(express.urlencoded({ extended: true }));

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
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    if (file.fieldname === 'stamps') {
      const stampsPath = path.join(uploadPath, 'stamps');
      if (!fs.existsSync(stampsPath)) {
        fs.mkdirSync(stampsPath, { recursive: true });
      }
      cb(null, stampsPath);
    } else if (file.fieldname === 'avatar') {
      const avatarsPath = path.join(uploadPath, 'avatars');
      if (!fs.existsSync(avatarsPath)) {
        fs.mkdirSync(avatarsPath, { recursive: true });
      }
      cb(null, avatarsPath);
    } else if (file.fieldname === 'server_icon') {
      const iconsPath = path.join(uploadPath, 'server_icons');
      if (!fs.existsSync(iconsPath)) {
        fs.mkdirSync(iconsPath, { recursive: true });
      }
      cb(null, iconsPath);
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
      const serverId = req.params.id || req.params.serverId || req.body.server_id;
      
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
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
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

    console.log('Login attempt:', { username, password: '***' });

    const result = await db.query(
      'SELECT id, username, email, password FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    console.log('User query result:', { found: result.rows.length > 0, user: result.rows[0] ? { id: result.rows[0].id, username: result.rows[0].username, email: result.rows[0].email } : null });

    if (result.rows.length === 0) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    console.log('Password check:', { valid: validPassword });

    if (!validPassword) {
      console.log('Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      jwtSecret,
      { expiresIn: '1h' }
    );

    console.log('Login successful');
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
  'SELECT id, username, email FROM users WHERE id = $1',
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

// ====================
// サーバー管理API
// ====================

// サーバー一覧取得
app.get('/api/servers', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, sm.role, sm.joined_at
      FROM servers s
      JOIN server_members sm ON s.id = sm.server_id
      WHERE sm.user_id = $1
      ORDER BY sm.joined_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

// サーバー作成
app.post('/api/servers', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }

    const inviteCode = generateInviteCode();

    const result = await db.query(`
      INSERT INTO servers (name, description, owner_id, invite_code)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, req.user.id, inviteCode]);

    const server = result.rows[0];

    // サーバー作成者をメンバーとして追加
    await db.query(`
      INSERT INTO server_members (server_id, user_id, role)
      VALUES ($1, $2, 'owner')
    `, [server.id, req.user.id]);

    res.status(201).json(server);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Failed to create server' });
  }
});

// サーバー詳細取得
app.get('/api/servers/:id', authenticateToken, async (req, res) => {
  try {
    const serverId = req.params.id;

    // サーバーのメンバーかチェック
    const memberCheck = await db.query(`
      SELECT sm.role FROM server_members sm
      WHERE sm.server_id = $1 AND sm.user_id = $2
    `, [serverId, req.user.id]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT s.*, COUNT(sm.user_id) as member_count
      FROM servers s
      LEFT JOIN server_members sm ON s.id = sm.server_id
      WHERE s.id = $1
      GROUP BY s.id
    `, [serverId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

// サーバー更新
app.put('/api/servers/:id', authenticateToken, checkServerPermission(PERMISSIONS.MANAGE_SERVER), async (req, res) => {
  try {
    const serverId = req.params.id;
    const { name, description } = req.body;

    const result = await db.query(`
      UPDATE servers
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [name, description, serverId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ error: 'Failed to update server' });
  }
});

// サーバー削除
app.delete('/api/servers/:id', authenticateToken, async (req, res) => {
  try {
    const serverId = req.params.id;

    // オーナーかチェック
    const ownerCheck = await db.query(`
      SELECT owner_id FROM servers WHERE id = $1
    `, [serverId]);

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (ownerCheck.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only server owner can delete the server' });
    }

    await db.query('DELETE FROM servers WHERE id = $1', [serverId]);
    res.status(204).send();
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

// サーバー参加（招待コード）
app.post('/api/servers/join/:inviteCode', authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const serverResult = await db.query(`
      SELECT id, name FROM servers WHERE invite_code = $1
    `, [inviteCode]);

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const server = serverResult.rows[0];

    // 既にメンバーかチェック
    const existingMember = await db.query(`
      SELECT id FROM server_members
      WHERE server_id = $1 AND user_id = $2
    `, [server.id, req.user.id]);

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this server' });
    }

    // メンバーとして追加
    await db.query(`
      INSERT INTO server_members (server_id, user_id, role)
      VALUES ($1, $2, 'member')
    `, [server.id, req.user.id]);

    res.json({ message: 'Successfully joined server', server });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Failed to join server' });
  }
});

// サーバーメンバー一覧
app.get('/api/servers/:id/members', authenticateToken, async (req, res) => {
  try {
    const serverId = req.params.id;

    // サーバーのメンバーかチェック
    const memberCheck = await db.query(`
      SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2
    `, [serverId, req.user.id]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT u.id as user_id, u.username, u.email, sm.role, sm.joined_at
      FROM server_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.server_id = $1
      ORDER BY sm.joined_at ASC
    `, [serverId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get server members error:', error);
    res.status(500).json({ error: 'Failed to fetch server members' });
  }
});

// サーバーチャンネル一覧
app.get('/api/servers/:id/channels', authenticateToken, async (req, res) => {
  try {
    const serverId = req.params.id;

    // サーバーのメンバーかチェック
    const memberCheck = await db.query(`
      SELECT role FROM server_members WHERE server_id = $1 AND user_id = $2
    `, [serverId, req.user.id]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // カテゴリー付きチャンネルとカテゴリーなしチャンネルを取得
    const categoriesResult = await db.query(`
      SELECT cc.*, array_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'type', c.type,
          'position', c.position
        ) ORDER BY c.position
      ) FILTER (WHERE c.id IS NOT NULL) as channels
      FROM channel_categories cc
      LEFT JOIN channels c ON cc.id = c.category_id AND c.server_id = $1
      WHERE cc.server_id = $1
      GROUP BY cc.id
      ORDER BY cc.position
    `, [serverId]);

    const uncategorizedResult = await db.query(`
      SELECT id, name, type, position
      FROM channels
      WHERE server_id = $1 AND category_id IS NULL
      ORDER BY position
    `, [serverId]);

    res.json({
      categories: categoriesResult.rows.map(cat => ({
        ...cat,
        channels: cat.channels || []
      })),
      uncategorized_channels: uncategorizedResult.rows
    });
  } catch (error) {
    console.error('Get server channels error:', error);
    res.status(500).json({ error: 'Failed to fetch server channels' });
  }
});

// チャンネル作成
app.post('/api/servers/:id/channels', authenticateToken, checkServerPermission(PERMISSIONS.MANAGE_CHANNELS), async (req, res) => {
  try {
    const serverId = req.params.id;
    const { name, type = 'text', category_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const result = await db.query(`
      INSERT INTO channels (name, type, server_id, category_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, type, serverId, category_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// ====================
// Wiki関連のAPI
// ====================

// Wiki一覧取得
app.get('/api/wiki', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT wp.*, u.username as author_name
      FROM wiki_pages wp
      LEFT JOIN users u ON wp.author_id = u.id
      ORDER BY wp.updated_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get wiki pages error:', error);
    res.status(500).json({ error: 'Failed to fetch wiki pages' });
  }
});

// Wiki作成
app.post('/api/wiki', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, tags, slug } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // デフォルトのserver_idを1とする（またはユーザーの所属するサーバーから取得）
    const defaultServerId = 1;

    const result = await db.query(`
      INSERT INTO wiki_pages (server_id, slug, title, content, author_id, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [defaultServerId, slug || title.toLowerCase().replace(/\s+/g, '-'), title, content, req.user.id, tags || []]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create wiki page error:', error);
    res.status(500).json({ error: 'Failed to create wiki page' });
  }
});

// Wiki詳細取得
app.get('/api/wiki/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT wp.*, u.username as author_name
      FROM wiki_pages wp
      LEFT JOIN users u ON wp.author_id = u.id
      WHERE wp.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wiki page not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get wiki page error:', error);
    res.status(500).json({ error: 'Failed to fetch wiki page' });
  }
});

// Wiki更新
app.put('/api/wiki/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    const result = await db.query(`
      UPDATE wiki_pages
      SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP, last_editor_id = $4
      WHERE id = $5
      RETURNING *
    `, [title, content, tags, req.user.id, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wiki page not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update wiki page error:', error);
    res.status(500).json({ error: 'Failed to update wiki page' });
  }
});

// Wiki削除
app.delete('/api/wiki/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM wiki_pages WHERE id = $1 RETURNING id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wiki page not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete wiki page error:', error);
    res.status(500).json({ error: 'Failed to delete wiki page' });
  }
});

// ====================
// タスク関連のAPI
// ====================

// タスク一覧取得
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, u.username as assignee_name, c.username as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users c ON t.user_id = c.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// タスク作成
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, status, priority, assignee_id, due_date } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // デフォルトのserver_idを1とする
    const defaultServerId = 1;

    const result = await db.query(`
      INSERT INTO tasks (server_id, title, description, status, priority, assignee_id, due_date, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [defaultServerId, title, description, status || 'todo', priority || 'medium', assignee_id, due_date, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ====================
// イベント関連のAPI
// ====================

// イベント一覧取得
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, u.username as organizer_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      ORDER BY e.start_time ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// イベント作成
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const { name, description, start_time, end_time, location, max_participants } = req.body;
    
    if (!name || !start_time) {
      return res.status(400).json({ error: 'Name and start time are required' });
    }

    // デフォルトのserver_idを1とする
    const defaultServerId = 1;

    const result = await db.query(`
      INSERT INTO events (server_id, name, description, start_time, end_time, location, max_participants, organizer_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [defaultServerId, name, description, start_time, end_time, location, max_participants, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ====================
// 予算関連のAPI
// ====================

// 予算一覧取得
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, u.username as approved_by_name
      FROM budgets b
      LEFT JOIN users u ON b.approved_by = u.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// 予算作成
app.post('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const { name, description, amount, type, category, date } = req.body;
    
    if (!name || !amount || !type) {
      return res.status(400).json({ error: 'Name, amount and type are required' });
    }

    // デフォルトのserver_idを1とする
    const defaultServerId = 1;

    const result = await db.query(`
      INSERT INTO budgets (server_id, name, description, amount, type, category, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [defaultServerId, name, description, amount, type, category || 'general', date || new Date().toISOString().split('T')[0]]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

// ====================
// 機材関連のAPI
// ====================

// 機材一覧取得
app.get('/api/equipments', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, u.username as responsible_user_name
      FROM equipments e
      LEFT JOIN users u ON e.responsible_user_id = u.id
      ORDER BY e.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get equipments error:', error);
    res.status(500).json({ error: 'Failed to fetch equipments' });
  }
});

// 機材作成
app.post('/api/equipments', authenticateToken, async (req, res) => {
  try {
    const { name, description, quantity, location, condition } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // デフォルトのserver_idを1とする
    const defaultServerId = 1;

    const result = await db.query(`
      INSERT INTO equipments (server_id, name, description, quantity, location, condition, responsible_user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [defaultServerId, name, description, quantity || 1, location, condition || 'good', req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// ====================
// 投稿関連のAPI
// ====================

// 投稿一覧取得
app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.username as author_name, u.avatar_url as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// 投稿作成
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, type, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // デフォルトのserver_idを1とする
    const defaultServerId = 1;

    const result = await db.query(`
      INSERT INTO posts (server_id, title, content, type, author_id, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [defaultServerId, title, content, type || 'diary', req.user.id, tags || []]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 投稿詳細取得
app.get('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.username as author_name, u.avatar_url as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// 投稿更新
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, type, tags } = req.body;
    
    const result = await db.query(`
      UPDATE posts
      SET title = $1, content = $2, type = $3, tags = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND author_id = $6
      RETURNING *
    `, [title, content, type, tags, req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or access denied' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// 投稿削除
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM posts
      WHERE id = $1 AND author_id = $2
      RETURNING id
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or access denied' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// サーバー起動
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
