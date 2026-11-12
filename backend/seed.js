require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test_sys',
  multipleStatements: true,
  charset: 'utf8mb4'
};

async function seedDatabase() {
  console.log('====================================================');
  console.log(`[Seed Tool] Connecting to MySQL database: ${DB_CONFIG.database}...`);
  console.log('====================================================');

  let connection;
  try {
    // 1. First ensure database exists
    const rootConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    // 2. Connect to the database with multiple statements enabled
    connection = await mysql.createConnection(DB_CONFIG);

    const sqlFilePath = path.join(__dirname, 'database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('[Seed Tool] Executing database schema and realistic seed data...');
    await connection.query(sqlContent);

    // 3. Verify counts
    const [users] = await connection.query('SELECT COUNT(*) AS total FROM users');
    const [personnel] = await connection.query('SELECT COUNT(*) AS total FROM personnel');
    const [assets] = await connection.query('SELECT COUNT(*) AS total FROM assets');
    const [inspections] = await connection.query('SELECT COUNT(*) AS total FROM inspection_history');
    const [requisitions] = await connection.query('SELECT COUNT(*) AS total FROM requisitions');

    console.log('====================================================');
    console.log('✅ [Seed Tool] MySQL database seeded successfully!');
    console.log(`   - Users (ผู้ใช้งานระบบ):        ${users[0].total} บัญชี`);
    console.log(`   - Personnel (บุคลากรสถาบันฯ):  ${personnel[0].total} ท่าน`);
    console.log(`   - Assets (ครุภัณฑ์คอมพิวเตอร์): ${assets[0].total} รายการ`);
    console.log(`   - Inspection History (ประวัติ): ${inspections[0].total} รายการ`);
    console.log(`   - Requisitions (ประวัติเบิกจ่าย): ${requisitions[0].total} รายการ`);
    console.log('====================================================');

    await connection.end();
    return true;
  } catch (err) {
    console.error('❌ [Seed Tool] Error seeding database:', err.message);
    if (connection) {
      try { await connection.end(); } catch (e) {}
    }
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
