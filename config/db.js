// config/db.js
// Expose a promise-compatible pool so callers can use await/promise syntax
// If other parts of the code need the callback-style pool, import .pool from this module.
const mysql = require('mysql2');

const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || 'root';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: dbPassword,
  database: process.env.DB_NAME || 'society_db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  queueLimit: 0
});

// Promise wrapper for async/await and .then/.catch usage
const promisePool = pool.promise();

async function testConnection() {
  const conn = await promisePool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

// Export the promise-compatible pool as the default export so existing callers
// that do `const db = require('./config/db')` and then `db.query(...).then()`
// continue to work. Also attach `pool` and `testConnection` for code that
// destructures or needs the callback-style pool.
const exportObj = promisePool;
exportObj.pool = pool;
exportObj.testConnection = testConnection;

module.exports = exportObj;
