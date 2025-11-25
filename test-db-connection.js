const mysql = require('mysql2');
const conn = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'root',
    database: process.env.DB_NAME || 'society_db',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
});
conn.connect(err => {
    if (err) {
        console.error('Connection error:', err.code, err.sqlMessage || err.message);
        process.exit(1);
    }
    console.log('Connected successfully');
    conn.end();
});