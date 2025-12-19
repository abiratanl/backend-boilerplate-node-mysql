const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Here it retrieves the test database name from the .env file or uses a fallback.
    database: process.env.NODE_ENV === 'test' 
        ? (process.env.DB_NAME_TEST || 'test_db') 
        : process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
});

module.exports = pool;