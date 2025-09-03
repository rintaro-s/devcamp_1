const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 8050;
const saltRounds = 10;
require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET; // TODO: move to environment variable

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/stamps');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post('/api/users/register', async (req, res) => {
  const { username, password, email, enrollment_year, is_teacher } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password, and email are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      'INSERT INTO users (username, password, email, enrollment_year, is_teacher) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, hashedPassword, email, enrollment_year, is_teacher]
    );
    const user = result.rows[0];

    const token = jwt.sign({ id: user.id, is_teacher: user.is_teacher }, jwtSecret, { expiresIn: '1h' });

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, is_teacher: user.is_teacher }, jwtSecret, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, email, enrollment_year, is_teacher FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const authorizeTeacher = (req, res, next) => {
  if (!req.user.is_teacher) {
    return res.sendStatus(403);
  }
  next();
};

app.post('/api/roles', authenticateToken, authorizeTeacher, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  try {
    const result = await db.query('INSERT INTO roles (name) VALUES ($1) RETURNING *', [name]);
    const role = result.rows[0];
    res.status(201).json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles');
    const roles = result.rows;
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/roles/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  try {
    const result = await db.query('UPDATE roles SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    const role = result.rows[0];

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/roles/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
    const role = result.rows[0];

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users/:userId/roles', authenticateToken, authorizeTeacher, async (req, res) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: 'roleId is required' });
  }

  try {
    await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);
    res.sendStatus(201);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:userId/roles/:roleId', authenticateToken, authorizeTeacher, async (req, res) => {
  const { userId, roleId } = req.params;

  try {
    await db.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, roleId]);
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/equipments', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM equipments');
    const equipments = result.rows;
    res.json(equipments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/equipments', authenticateToken, authorizeTeacher, async (req, res) => {
  const { name, description, quantity } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Equipment name is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO equipments (name, description, quantity) VALUES ($1, $2, $3) RETURNING *',
      [name, description, quantity]
    );
    const equipment = result.rows[0];
    res.status(201).json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/equipments/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;
  const { name, description, quantity } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Equipment name is required' });
  }

  try {
    const result = await db.query(
      'UPDATE equipments SET name = $1, description = $2, quantity = $3 WHERE id = $4 RETURNING *',
      [name, description, quantity, id]
    );
    const equipment = result.rows[0];

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/equipments/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM equipments WHERE id = $1 RETURNING *', [id]);
    const equipment = result.rows[0];

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM budgets');
    const budgets = result.rows;
    res.json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/budgets', authenticateToken, authorizeTeacher, async (req, res) => {
  const { name, description, amount, type } = req.body;

  if (!name || !amount || !type) {
    return res.status(400).json({ error: 'Name, amount, and type are required' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Type must be either income or expense' });
  }

  try {
    const result = await db.query(
      'INSERT INTO budgets (name, description, amount, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, amount, type]
    );
    const budget = result.rows[0];
    res.status(201).json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/budgets/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;
  const { name, description, amount, type } = req.body;

  if (!name || !amount || !type) {
    return res.status(400).json({ error: 'Name, amount, and type are required' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Type must be either income or expense' });
  }

  try {
    const result = await db.query(
      'UPDATE budgets SET name = $1, description = $2, amount = $3, type = $4 WHERE id = $5 RETURNING *',
      [name, description, amount, type, id]
    );
    const budget = result.rows[0];

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/budgets/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM budgets WHERE id = $1 RETURNING *', [id]);
    const budget = result.rows[0];

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events');
    const events = result.rows;
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', authenticateToken, authorizeTeacher, async (req, res) => {
  const { name, description, start_time, end_time } = req.body;

  if (!name || !start_time || !end_time) {
    return res.status(400).json({ error: 'Name, start_time, and end_time are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO events (name, description, start_time, end_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, start_time, end_time]
    );
    const event = result.rows[0];
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/events/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;
  const { name, description, start_time, end_time } = req.body;

  if (!name || !start_time || !end_time) {
    return res.status(400).json({ error: 'Name, start_time, and end_time are required' });
  }

  try {
    const result = await db.query(
      'UPDATE events SET name = $1, description = $2, start_time = $3, end_time = $4 WHERE id = $5 RETURNING *',
      [name, description, start_time, end_time, id]
    );
    const event = result.rows[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/events/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    const event = result.rows[0];

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  const { user_id } = req.query;
  let query = 'SELECT * FROM tasks';
  const params = [];

  if (user_id) {
    query += ' WHERE user_id = $1';
    params.push(user_id);
  }

  try {
    const result = await db.query(query, params);
    const tasks = result.rows;
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description, due_date, user_id } = req.body;
  const assign_user_id = user_id || req.user.id;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO tasks (title, description, due_date, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, due_date, assign_user_id]
    );
    const task = result.rows[0];
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, completed, user_id } = req.body;

  try {
    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = taskResult.rows[0];

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user_id !== req.user.id && !req.user.is_teacher) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db.query(
      'UPDATE tasks SET title = $1, description = $2, due_date = $3, completed = $4, user_id = $5 WHERE id = $6 RETURNING *',
      [title, description, due_date, completed, user_id, id]
    );
    const updatedTask = result.rows[0];

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    const task = taskResult.rows[0];

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.user_id !== req.user.id && !req.user.is_teacher) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/wiki', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, slug, title, created_at, updated_at FROM wiki_pages');
    const wikiPages = result.rows;
    res.json(wikiPages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/wiki/:slug', authenticateToken, async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await db.query('SELECT * FROM wiki_pages WHERE slug = $1', [slug]);
    const wikiPage = result.rows[0];

    if (!wikiPage) {
      return res.status(404).json({ error: 'Wiki page not found' });
    }

    res.json(wikiPage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/wiki', authenticateToken, async (req, res) => {
  const { slug, title, content } = req.body;

  if (!slug || !title || !content) {
    return res.status(400).json({ error: 'Slug, title, and content are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO wiki_pages (slug, title, content, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [slug, title, content, req.user.id]
    );
    const wikiPage = result.rows[0];
    res.status(201).json(wikiPage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/wiki/:slug', authenticateToken, async (req, res) => {
  const { slug } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const wikiPageResult = await db.query('SELECT * FROM wiki_pages WHERE slug = $1', [slug]);
    const wikiPage = wikiPageResult.rows[0];

    if (!wikiPage) {
      return res.status(404).json({ error: 'Wiki page not found' });
    }

    if (wikiPage.author_id !== req.user.id && !req.user.is_teacher) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db.query(
      'UPDATE wiki_pages SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE slug = $3 RETURNING *',
      [title, content, slug]
    );
    const updatedWikiPage = result.rows[0];

    res.json(updatedWikiPage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/wiki/:slug', authenticateToken, async (req, res) => {
  const { slug } = req.params;

  try {
    const wikiPageResult = await db.query('SELECT * FROM wiki_pages WHERE slug = $1', [slug]);
    const wikiPage = wikiPageResult.rows[0];

    if (!wikiPage) {
      return res.status(404).json({ error: 'Wiki page not found' });
    }

    if (wikiPage.author_id !== req.user.id && !req.user.is_teacher) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('DELETE FROM wiki_pages WHERE slug = $1', [slug]);

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/posts', authenticateToken, async (req, res) => {
  const { type } = req.query;
  let query = 'SELECT id, title, type, author_id, created_at, updated_at FROM posts';
  const params = [];

  if (type) {
    query += ' WHERE type = $1';
    params.push(type);
  }

  try {
    const result = await db.query(query, params);
    const posts = result.rows;
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  const { title, content, type } = req.body;

  if (!title || !content || !type) {
    return res.status(400).json({ error: 'Title, content, and type are required' });
  }

  if (type !== 'diary' && type !== 'album') {
    return res.status(400).json({ error: 'Type must be either diary or album' });
  }

  try {
    const result = await db.query(
      'INSERT INTO posts (title, content, type, author_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, content, type, req.user.id]
    );
    const post = result.rows[0];
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = result.rows[0];

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, type } = req.body;

  if (!title || !content || !type) {
    return res.status(400).json({ error: 'Title, content, and type are required' });
  }

  if (type !== 'diary' && type !== 'album') {
    return res.status(400).json({ error: 'Type must be either diary or album' });
  }

  try {
    const postResult = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = postResult.rows[0];

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author_id !== req.user.id && !req.user.is_teacher) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db.query(
      'UPDATE posts SET title = $1, content = $2, type = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, content, type, id]
    );
    const updatedPost = result.rows[0];

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const postResult = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = postResult.rows[0];

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author_id !== req.user.id && !req.user.is_teacher) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [id]);

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/whiteboards/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('SELECT * FROM whiteboards WHERE id = $1', [id]);
    const whiteboard = result.rows[0];

    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    res.json(whiteboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/whiteboards/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, data } = req.body;

  if (!name || !data) {
    return res.status(400).json({ error: 'Name and data are required' });
  }

  try {
    const whiteboardResult = await db.query('SELECT * FROM whiteboards WHERE id = $1', [id]);
    const whiteboard = whiteboardResult.rows[0];

    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    if (whiteboard.owner_id !== req.user.id && !req.user.is_teacher) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await db.query(
      'UPDATE whiteboards SET name = $1, data = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, data, id]
    );
    const updatedWhiteboard = result.rows[0];

    // Emit whiteboard update to all connected clients
    // io.emit('whiteboard-update', updatedWhiteboard); // TODO: move after io definition

    res.json(updatedWhiteboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stamps', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, image_url FROM stamps');
    const stamps = result.rows;
    res.json(stamps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/stamps', authenticateToken, authorizeTeacher, upload.single('image'), async (req, res) => {
  const { name } = req.body;
  const image_url = `/uploads/stamps/${req.file.filename}`;

  if (!name || !req.file) {
    return res.status(400).json({ error: 'Name and image are required' });
  }

  try {
    const result = await db.query(
      'INSERT INTO stamps (name, image_url, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, image_url, req.user.id]
    );
    const stamp = result.rows[0];
    res.status(201).json(stamp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/stamps/:id', authenticateToken, authorizeTeacher, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM stamps WHERE id = $1 RETURNING *', [id]);
    const stamp = result.rows[0];

    if (!stamp) {
      return res.status(404).json({ error: 'Stamp not found' });
    }

    // Optionally, delete the image file from the server
    // fs.unlinkSync(path.join(__dirname, stamp.image_url));

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard Statistics APIs
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const [tasksResult, eventsResult, usersResult, budgetsResult] = await Promise.all([
      db.query('SELECT COUNT(*) as total, COUNT(CASE WHEN completed = true THEN 1 END) as completed FROM tasks'),
      db.query('SELECT COUNT(*) as total FROM events WHERE start_time > NOW()'),
      db.query('SELECT COUNT(*) as total FROM users'),
      db.query('SELECT SUM(CASE WHEN type = \'income\' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = \'expense\' THEN amount ELSE 0 END) as expenses FROM budgets')
    ]);

    const stats = {
      totalTasks: parseInt(tasksResult.rows[0].total),
      completedTasks: parseInt(tasksResult.rows[0].completed),
      upcomingEvents: parseInt(eventsResult.rows[0].total),
      totalMembers: parseInt(usersResult.rows[0].total),
      activeBudget: parseInt(budgetsResult.rows[0].income || 0),
      monthlyExpenses: parseInt(budgetsResult.rows[0].expenses || 0)
    };

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/activities', authenticateToken, async (req, res) => {
  try {
    // Fetch recent activities from multiple tables
    const activitiesQuery = `
      (SELECT 'task' as type, title as description, created_at as timestamp, user_id FROM tasks ORDER BY created_at DESC LIMIT 3)
      UNION ALL
      (SELECT 'event' as type, name as description, created_at as timestamp, NULL as user_id FROM events ORDER BY created_at DESC LIMIT 3)
      UNION ALL
      (SELECT 'wiki' as type, title as description, created_at as timestamp, author_id as user_id FROM wiki_pages ORDER BY created_at DESC LIMIT 3)
      ORDER BY timestamp DESC LIMIT 10
    `;

    const result = await db.query(activitiesQuery);
    const activities = result.rows;

    // Fetch user information for activities
    for (let activity of activities) {
      if (activity.user_id) {
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [activity.user_id]);
        activity.user = userResult.rows[0] || { username: 'Unknown' };
      }
    }

    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/task-progress', authenticateToken, async (req, res) => {
  try {
    // Mock data for task progress by category
    const taskProgress = [
      { name: '学習', completed: 12, total: 18, color: '#8B5CF6' },
      { name: 'イベント', completed: 8, total: 10, color: '#06D6A0' },
      { name: '予算', completed: 5, total: 7, color: '#FFD60A' },
      { name: '設備', completed: 3, total: 5, color: '#FF6B6B' }
    ];

    res.json(taskProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/budget-chart', authenticateToken, async (req, res) => {
  try {
    // Mock budget data for charts
    const budgetData = [
      { month: '4月', budget: 400000, spent: 320000 },
      { month: '5月', budget: 450000, spent: 380000 },
      { month: '6月', budget: 420000, spent: 290000 },
      { month: '7月', budget: 480000, spent: 410000 }
    ];

    res.json(budgetData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat and messaging APIs for real-time communication
app.get('/api/messages/:channelId', authenticateToken, async (req, res) => {
  const { channelId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await db.query(`
      SELECT m.*, u.username, u.id as user_id 
      FROM messages m 
      JOIN users u ON m.author_id = u.id 
      WHERE m.channel_id = $1 
      ORDER BY m.created_at DESC 
      LIMIT $2 OFFSET $3
    `, [channelId, limit, offset]);

    const messages = result.rows.reverse(); // Show oldest first
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  const { content, channel_id, parent_id = null, message_type = 'text' } = req.body;

  if (!content || !channel_id) {
    return res.status(400).json({ error: 'Content and channel_id are required' });
  }

  try {
    const result = await db.query(`
      INSERT INTO messages (content, author_id, channel_id, parent_id, message_type) 
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [content, req.user.id, channel_id, parent_id, message_type]);

    const message = result.rows[0];

    // Get user information
    const userResult = await db.query('SELECT username FROM users WHERE id = $1', [req.user.id]);
    message.username = userResult.rows[0].username;
    message.user_id = req.user.id;

    // Broadcast to all clients in the channel
    io.to(`channel-${channel_id}`).emit('new-message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/channels', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, s.name as server_name 
      FROM channels c 
      LEFT JOIN servers s ON c.server_id = s.id 
      ORDER BY c.position, c.name
    `);

    const channels = result.rows;
    res.json(channels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/channels', authenticateToken, authorizeTeacher, async (req, res) => {
  const { name, description, channel_type = 'text', server_id = null } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Channel name is required' });
  }

  try {
    const result = await db.query(`
      INSERT INTO channels (name, description, channel_type, server_id) 
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, description, channel_type, server_id]);

    const channel = result.rows[0];
    res.status(201).json(channel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Server management APIs
app.get('/api/servers', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, sm.joined_at, u.username as owner_name
      FROM servers s
      LEFT JOIN server_members sm ON s.id = sm.server_id AND sm.user_id = $1
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE sm.user_id = $1 OR s.id IN (
        SELECT server_id FROM server_members WHERE user_id = $1
      )
      ORDER BY s.name
    `, [req.user.id]);

    const servers = result.rows;
    res.json(servers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/servers', authenticateToken, async (req, res) => {
  const { name, description, server_type = 'school', template_type } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Server name is required' });
  }

  try {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = await db.query(`
      INSERT INTO servers (name, description, owner_id, server_type, template_type, invite_code) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [name, description, req.user.id, server_type, template_type, inviteCode]);

    const server = result.rows[0];

    // Add creator as member
    await db.query(`
      INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)
    `, [server.id, req.user.id]);

    // Create default channels
    const defaultChannels = [
      { name: '一般', description: '一般的な会話', type: 'text' },
      { name: 'お知らせ', description: '重要なお知らせ', type: 'announcement' },
      { name: '雑談', description: '自由な雑談', type: 'text' },
    ];

    for (const channel of defaultChannels) {
      await db.query(`
        INSERT INTO channels (server_id, name, description, type) 
        VALUES ($1, $2, $3, $4)
      `, [server.id, channel.name, channel.description, channel.type]);
    }

    res.status(201).json(server);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/servers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user is member of the server
    const memberCheck = await db.query(`
      SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2
    `, [id, req.user.id]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT s.*, u.username as owner_name
      FROM servers s
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = $1
    `, [id]);

    const server = result.rows[0];

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(server);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/servers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, server_type, template_type } = req.body;

  try {
    // Check if user is owner of the server
    const serverCheck = await db.query(`
      SELECT * FROM servers WHERE id = $1 AND owner_id = $2
    `, [id, req.user.id]);

    if (serverCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only server owner can edit server' });
    }

    const result = await db.query(`
      UPDATE servers 
      SET name = $1, description = $2, server_type = $3, template_type = $4
      WHERE id = $5 
      RETURNING *
    `, [name, description, server_type, template_type, id]);

    const server = result.rows[0];
    res.json(server);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/servers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user is owner of the server
    const serverCheck = await db.query(`
      SELECT * FROM servers WHERE id = $1 AND owner_id = $2
    `, [id, req.user.id]);

    if (serverCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only server owner can delete server' });
    }

    await db.query('DELETE FROM servers WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/servers/join/:inviteCode', authenticateToken, async (req, res) => {
  const { inviteCode } = req.params;

  try {
    const serverResult = await db.query(`
      SELECT * FROM servers WHERE invite_code = $1
    `, [inviteCode]);

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const server = serverResult.rows[0];

    // Check if already a member
    const memberCheck = await db.query(`
      SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2
    `, [server.id, req.user.id]);

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already a member of this server' });
    }

    // Add user to server
    await db.query(`
      INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)
    `, [server.id, req.user.id]);

    res.json({ message: 'Successfully joined server', server });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/servers/:id/members', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user is member of the server
    const memberCheck = await db.query(`
      SELECT 1 FROM server_members WHERE server_id = $1 AND user_id = $2
    `, [id, req.user.id]);

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.is_teacher, u.status, u.last_seen, sm.joined_at,
             s.owner_id = u.id as is_owner
      FROM users u
      JOIN server_members sm ON u.id = sm.user_id
      JOIN servers s ON s.id = sm.server_id
      WHERE sm.server_id = $1
      ORDER BY is_owner DESC, sm.joined_at ASC
    `, [id]);

    const members = result.rows;
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/servers/:id/members/:userId/promote', authenticateToken, async (req, res) => {
  const { id, userId } = req.params;

  try {
    // Check if user is owner of the server
    const serverCheck = await db.query(`
      SELECT * FROM servers WHERE id = $1 AND owner_id = $2
    `, [id, req.user.id]);

    if (serverCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only server owner can promote users' });
    }

    // Make user a teacher (admin) in the system
    await db.query(`
      UPDATE users SET is_teacher = true WHERE id = $1
    `, [userId]);

    res.json({ message: 'User promoted to teacher/admin' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/servers/:id/members/:userId', authenticateToken, async (req, res) => {
  const { id, userId } = req.params;

  try {
    // Check if user is owner of the server or removing themselves
    const serverCheck = await db.query(`
      SELECT * FROM servers WHERE id = $1 AND owner_id = $2
    `, [id, req.user.id]);

    if (serverCheck.rows.length === 0 && userId !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove user from server
    await db.query(`
      DELETE FROM server_members WHERE server_id = $1 AND user_id = $2
    `, [id, userId]);

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User presence and online status
app.get('/api/users/online', authenticateToken, async (req, res) => {
  try {
    // Get list of online users (mock implementation)
    const result = await db.query(`
      SELECT id, username, is_teacher, status, last_seen 
      FROM users 
      WHERE last_seen > NOW() - INTERVAL '10 minutes' 
      ORDER BY last_seen DESC
    `);

    const onlineUsers = result.rows;
    res.json(onlineUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/status', authenticateToken, async (req, res) => {
  const { status = 'online' } = req.body;

  try {
    const result = await db.query(`
      UPDATE users 
      SET status = $1, last_seen = NOW() 
      WHERE id = $2 
      RETURNING id, username, status, last_seen
    `, [status, req.user.id]);

    const user = result.rows[0];
    
    // Broadcast status change to all clients
    // io.emit('user-status-change', user); // TODO: move after io definition

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Enhanced Socket.io implementation for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join channel rooms for targeted messaging
  socket.on('join-channel', (channelId) => {
    socket.join(`channel-${channelId}`);
    console.log(`User ${socket.id} joined channel ${channelId}`);
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(`channel-${channelId}`);
    console.log(`User ${socket.id} left channel ${channelId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', ({ channelId, username }) => {
    socket.to(`channel-${channelId}`).emit('user-typing', { username, isTyping: true });
  });

  socket.on('typing-stop', ({ channelId, username }) => {
    socket.to(`channel-${channelId}`).emit('user-typing', { username, isTyping: false });
  });

  // Handle message reactions
  socket.on('message-reaction', ({ messageId, reaction, channelId }) => {
    io.to(`channel-${channelId}`).emit('reaction-added', { messageId, reaction });
  });

  // Real-time dashboard updates
  socket.on('dashboard-subscribe', () => {
    socket.join('dashboard-updates');
  });

  // User presence
  socket.on('user-online', (userId) => {
    socket.userId = userId;
    socket.broadcast.emit('user-presence', { userId, status: 'online' });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      socket.broadcast.emit('user-presence', { userId: socket.userId, status: 'offline' });
    }
    console.log('User disconnected:', socket.id);
  });

  // Legacy chat message handler (keeping for compatibility)
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    io.emit('chat message', msg); // Broadcast to all connected clients
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
