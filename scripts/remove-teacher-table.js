// Script to remove Teacher table from database
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function removeTeacherTable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bpi_lab',
    });

    console.log('Connected to database');

    // Check if table exists
    const [tables] = await connection.query(
      `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'Teacher'
    `,
      [process.env.DB_NAME || 'bpi_lab']
    );

    if (tables.length === 0) {
      console.log('Table Teacher does not exist, nothing to remove');
      return;
    }

    // Drop Teacher table
    await connection.query('DROP TABLE IF EXISTS Teacher');

    console.log('✅ Successfully removed Teacher table from database');
  } catch (error) {
    console.error('❌ Error removing Teacher table:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

removeTeacherTable()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
