import mysql from 'mysql2/promise';

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

// Create connection pool with optimized settings
const pool = mysql.createPool({
  ...getConnectionConfig(),
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Helper function to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  try {
    const [results] = await pool.execute(sql, params);
    return results as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
