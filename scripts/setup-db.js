const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const path = require('path');

// Simple ID generator
function generateId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `${timestamp}${randomPart}`;
}

// Parse DATABASE_URL or use individual env vars
function getConnectionConfig() {
  // Prioritize individual env vars (easier to configure)
  if (process.env.DB_HOST || process.env.DB_USER || process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bpi_lab',
    };
  }

  // Fallback to DATABASE_URL if individual vars not set
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.startsWith('mysql://')) {
    // Parse mysql://user:password@host:port/database
    const url = new URL(databaseUrl.replace('mysql://', 'http://'));
    return {
      host: url.hostname,
      port: parseInt(url.port || '3306'),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
    };
  }

  // Default fallback
  return {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bpi_lab',
  };
}

async function setupDatabase() {
  const config = getConnectionConfig();
  const { database, ...connectionConfig } = config;

  try {
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection(connectionConfig);

    // Create database if not exists
    console.log(`Creating database ${database} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await connection.query(`USE \`${database}\``);

    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    // Remove comments and empty lines, filter out CREATE DATABASE and USE statements
    const statements = schema
      .split(';')
      .map((s) => {
        // Remove single-line comments
        const lines = s.split('\n').map((line) => {
          const commentIndex = line.indexOf('--');
          return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        });
        return lines.join('\n').trim();
      })
      .filter((s) => s.length > 0 && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE'));

    console.log('Creating tables...');
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log(`[OK] Executed: ${statement.substring(0, 60).replace(/\n/g, ' ')}...`);
        } catch (error) {
          // Ignore "table already exists" errors
          if (error.message.includes('already exists')) {
            console.log(`[WARN] Table already exists, skipping...`);
          } else {
            console.error(`[ERROR] Error executing statement:`);
            console.error(statement.substring(0, 200));
            console.error(`Error: ${error.message}`);
            throw error;
          }
        }
      }
    }

    console.log('Tables created successfully!');

    // Seed users
    console.log('Seeding users...');
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Check if admin exists
    const [adminRows] = await connection.query('SELECT * FROM User WHERE username = ?', ['admin']);
    if (!adminRows || adminRows.length === 0) {
      const adminId = generateId();
      await connection.query('INSERT INTO User (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)', [adminId, 'admin', hashedPassword, 'ADMIN', 'Administrator']);
      console.log('[OK] Admin user created');
    } else {
      console.log('[OK] Admin user already exists');
    }

    // Check if guru exists
    const [guruRows] = await connection.query('SELECT * FROM User WHERE username = ?', ['guru1']);
    if (!guruRows || guruRows.length === 0) {
      const guruId = generateId();
      await connection.query('INSERT INTO User (id, username, password, role, name) VALUES (?, ?, ?, ?, ?)', [guruId, 'guru1', hashedPassword, 'GURU', 'Guru IPA 1']);
      console.log('[OK] Guru user created');
    } else {
      console.log('[OK] Guru user already exists');
    }

    await connection.end();
    console.log('\n[SUCCESS] Database setup completed successfully!');
    console.log('\nDefault credentials:');
    console.log('  Admin: username=admin, password=12345678');
    console.log('  Guru:  username=guru1, password=12345678');
  } catch (error) {
    console.error('\n[ERROR] Error setting up database:');
    console.error(error.message);
    console.error('\nPlease make sure:');
    console.error('1. MySQL server is running');
    console.error('2. DATABASE_URL in .env is correct');
    console.error('3. Database user has permission to create database and tables');
    process.exit(1);
  }
}

// Load .env file
require('dotenv').config();

setupDatabase();
