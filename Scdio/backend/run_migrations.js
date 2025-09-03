const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const sqlPath = path.join(__dirname, 'db.sql');

async function run() {
  if (!fs.existsSync(sqlPath)) {
    console.error('db.sql not found at', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'scdio',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
  });

  let client;
  try {
    client = await pool.connect();
    console.log('Connected to DB, running migrations...');
    // Execute whole file. pg supports multiple statements in a single query when not using simple-queries in libpq.
    await client.query(sql);
    console.log('Migrations applied successfully.');
  } catch (err) {
    console.error('Migration error:', err.message || err);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

run();
