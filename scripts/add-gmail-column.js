// Script to add gmail column to User table
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function addGmailColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bpi_lab',
    });

    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'User' 
      AND COLUMN_NAME = 'gmail'
    `,
      [process.env.DB_NAME || 'bpi_lab']
    );

    if (columns.length > 0) {
      console.log('Column gmail already exists');
      return;
    }

    // Add gmail column
    await connection.query(`
      ALTER TABLE User 
      ADD COLUMN gmail VARCHAR(255) NULL 
      AFTER name
    `);

    console.log('✅ Successfully added gmail column to User table');
  } catch (error) {
    console.error('❌ Error adding gmail column:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addGmailColumn()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
