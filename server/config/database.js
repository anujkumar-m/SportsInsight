const mysql = require('mysql2/promise');
require('dotenv').config();

const isCloudHost =
  process.env.DB_HOST &&
  (process.env.DB_HOST.includes('tidbcloud.com') ||
    (!process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1')));

const useSSL =
  process.env.DB_SSL === 'true' ||
  process.env.DB_SSL === '1' ||
  (process.env.DB_SSL !== 'false' && process.env.DB_SSL !== '0' && isCloudHost);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'sports_academy',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  ...(useSSL
    ? {
        ssl: {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
        },
      }
    : {}),
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
  }
};

module.exports = { pool, testConnection };
