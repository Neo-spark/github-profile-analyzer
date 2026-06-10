const mysql2 = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool for better performance and reliability
const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'github_analyzer',
  waitForConnections: true,
  connectionLimit: 10,       // Max simultaneous connections in pool
  queueLimit: 0,             // Unlimited queued requests
  timezone: '+00:00',        // Store dates in UTC
});

/**
 * Initializes the database: creates the DB if missing, creates the table if missing.
 * Called once on server startup.
 */
const initializeDatabase = async () => {
  // First connect WITHOUT specifying a database to create it if needed
  const initConnection = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    timezone: '+00:00',
  });

  await initConnection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'github_analyzer'}\``
  );
  await initConnection.end();

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
    console.log('✅ MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    throw error;
  }
};

module.exports = { pool, initializeDatabase, testConnection };
