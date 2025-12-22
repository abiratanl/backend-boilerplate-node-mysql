const path = require('path');
// This ensures the .env is read from the project root regardless of where the test starts
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

const getPort = () => {
    // 1. If we are in TEST mode, prioritize the external port.
    if (process.env.NODE_ENV === 'test') {
        return process.env.DB_PORT_EXTERNAL ? parseInt(process.env.DB_PORT_EXTERNAL) : 3307;
    }

    // 2. If the host is 'db' (Docker), ALWAYS use 3306.
    // This prevents rule 3 (below) from being activated inside the container.
    if (process.env.DB_HOST === 'db') {
        return 3306;
    }

    // 3. If the host is local, use the external port (useful for scripts outside of Docker).
    if (process.env.DB_HOST === '127.0.0.1' && process.env.DB_PORT_EXTERNAL) {
        return parseInt(process.env.DB_PORT_EXTERNAL);
    }

    return process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
};

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.NODE_ENV === 'test' 
        ? (process.env.DB_NAME_TEST || 'test_db') 
        : process.env.DB_NAME,
    port: getPort(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;