const mysql2 = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool for better performance and reliability
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'github_analyzer',
  waitForConnections: true,
  connectionLimit: 10,       // Max simultaneous connections in pool
  queueLimit: 0,             // Unlimited queued requests
  timezone: '+00:00',        // Store dates in UTC
};

// Automatically enable SSL for Aiven or other cloud providers
if (dbConfig.host && dbConfig.host.includes('.aivencloud.com') || process.env.NODE_ENV === 'production') {
  dbConfig.ssl = {
    rejectUnauthorized: false // Required for many managed DBs like Aiven if CA cert isn't provided
  };
}

// Create a connection pool for better performance and reliability
const pool = mysql2.createPool(dbConfig);

/**
 * Initializes the database: creates the DB if missing, creates the table if missing.
 * Called once on server startup.
 */
const initializeDatabase = async () => {
  // First connect WITHOUT specifying a database to create it if needed
  const initConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    timezone: '+00:00',
  };

  if (initConfig.host.includes('.aivencloud.com') || process.env.NODE_ENV === 'production') {
    initConfig.ssl = { rejectUnauthorized: false };
  }

  const initConnection = await mysql2.createConnection(initConfig);

  try {
    // Some managed DBs (like Aiven) do not allow users to CREATE DATABASE.
    // We wrap this in a try-catch so it doesn't crash the server if it fails.
    await initConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'github_analyzer'}\``
    );
  } catch (error) {
    console.log(`⚠️ Skipping CREATE DATABASE: ${error.message} (This is normal for cloud databases like Aiven)`);
  } finally {
    await initConnection.end();
  }

  // Now create the main table inside that database
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS github_profiles (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      username        VARCHAR(255) UNIQUE NOT NULL,
      name            VARCHAR(255),
      bio             TEXT,
      location        VARCHAR(255),
      blog            VARCHAR(500),
      company         VARCHAR(255),
      email           VARCHAR(255),
      avatar_url      VARCHAR(500),
      followers       INT DEFAULT 0,
      following       INT DEFAULT 0,
      public_repos    INT DEFAULT 0,
      total_stars     INT DEFAULT 0,
      total_forks     INT DEFAULT 0,
      most_starred_repo VARCHAR(255),
      top_language    VARCHAR(50),
      developer_score INT DEFAULT 0,
      rank_level      VARCHAR(50),
      account_created DATE,
      analyzed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_developer_score (developer_score DESC),
      INDEX idx_rank_level (rank_level)
    )
  `);

  console.log('✅ Database and table initialized successfully');
};

/**
 * Test DB connectivity — called at startup so we fail fast if misconfigured.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected successfully to host: ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed to host:', process.env.DB_HOST || 'localhost');
    console.error('Error Details:', error);
    throw error;
  }
};

module.exports = { pool, initializeDatabase, testConnection };
