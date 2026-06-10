require('dotenv').config();
const app = require('./src/app');
const { testConnection, initializeDatabase } = require('./src/config/db');

console.log('--- RENDER ENVIRONMENT DIAGNOSTICS ---');
console.log('Available ENV Keys:', Object.keys(process.env).filter(k => k.startsWith('DB_')));
console.log('DB_HOST is currently:', process.env.DB_HOST || 'UNDEFINED! (Falling back to localhost)');
console.log('----------------------------------------');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Verify DB connection
    await testConnection();

    // 2. Ensure DB and table exist (idempotent — safe to run on every start)
    await initializeDatabase();

    // 3. Start HTTP server
    app.listen(PORT, () => {
      console.log('\n================================================');
      console.log(`🚀 GitHub Profile Analyzer API is running`);
      console.log(`   URL:  http://localhost:${PORT}`);
      console.log(`   ENV:  ${process.env.NODE_ENV || 'development'}`);
      console.log('================================================');
      console.log('\nAvailable endpoints:');
      console.log(`  POST   http://localhost:${PORT}/api/github/analyze/:username`);
      console.log(`  GET    http://localhost:${PORT}/api/github/profiles`);
      console.log(`  GET    http://localhost:${PORT}/api/github/profiles/:username`);
      console.log(`  GET    http://localhost:${PORT}/api/github/profiles/search?username=query`);
      console.log(`  DELETE http://localhost:${PORT}/api/github/profiles/:username`);
      console.log('================================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('\nCheck your .env file and make sure MySQL is running.');
    process.exit(1);
  }
};

startServer();
