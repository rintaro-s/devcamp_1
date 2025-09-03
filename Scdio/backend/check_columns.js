const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scdio',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
});

(async () => {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users'");
    console.log(res.rows);
  } catch (err) {
    console.error('Error querying columns:', err.message || err);
  } finally {
    await pool.end();
  }
})();
