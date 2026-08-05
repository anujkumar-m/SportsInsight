const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSqlFile(connection, filePath) {
  console.log(`⏳ Running ${path.basename(filePath)}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await connection.query(sql);
  console.log(`✅ ${path.basename(filePath)} executed successfully`);
}

async function initDB() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  };

  const databaseDir = path.join(__dirname, '../../database');
  const schemaPath = path.join(databaseDir, 'schema.sql');
  const seedPath = path.join(databaseDir, 'seed.sql');

  try {
    console.log('⏳ Connecting to MySQL server...');
    const connection = await mysql.createConnection(dbConfig);

    await runSqlFile(connection, schemaPath);
    await runSqlFile(connection, seedPath);

    console.log('\n✅ Database initialized successfully!');
    console.log(`   Database: ${process.env.DB_NAME || 'sports_acadmey'}`);
    console.log('   Default login: admin / Admin@123\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  }
}

initDB();
