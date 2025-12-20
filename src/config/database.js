const path = require('path');
// This ensures the .env is read from the project root regardless of where the test starts
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

const getPort = () => {
    // If we are in test mode, we prioritize the external port from .env
    if (process.env.NODE_ENV === 'test') {
        // Fallback to 3307 if the variable is missing, but try to use the one from .env first
        return process.env.DB_PORT_EXTERNAL ? parseInt(process.env.DB_PORT_EXTERNAL) : 3307;
    }
    // Inside Docker, use the standard internal port
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