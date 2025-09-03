const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scdio',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
});

// Simple connection test on startup to produce clear logs when DB is misconfigured
(async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('DB connection OK');
  } catch (err) {
    console.error('DB connection error during startup:', err.message || err);
  }
})();

module.exports = {
  query: async (text, params) => {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('DB query error:', err.message || err);
      throw err;
    }
  },
  pool,
};
