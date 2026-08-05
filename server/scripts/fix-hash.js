const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../../database/schema.sql');
let content = fs.readFileSync(schemaPath, 'utf8');

const oldHash1 = '$2a$12$WAHvu0lo62lqPHs4PURlju2fKVIvvwdnpZJlJhFZzWJCDDGSCiYuG';
const oldHash2 = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXqHVVS6EkTOA.';
const newHash = '$2a$12$RF1NBErlmKGEyAj/FFIwveuUsIPWJhTTrZCLZdF336ecW85eGj35u';

content = content.replaceAll(oldHash1, newHash);
content = content.replaceAll(oldHash2, newHash);

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('✅ Hashes updated in schema.sql');

const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function updateDB() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'sports_acadmey',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query('UPDATE users SET password_hash = ?', [newHash]);
    console.log('✅ All user passwords in database updated to Admin@123');
    await connection.end();
  } catch (err) {
    console.error('❌ Failed to update DB:', err.message);
  }
}

updateDB();
