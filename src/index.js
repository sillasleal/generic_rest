// Export the server classes and functions for library usage
const { GenericRestServer, startServer } = require('./server');

// For backward compatibility - start server if this file is run directly
if (require.main === module) {
  const path = require('path');
  
  let DB_PATH;
  const PORT = process.env.PORT || 3000;

  const dbPathArgIndex = process.argv.findIndex(arg => arg === '--db-path');
  if (dbPathArgIndex !== -1 && process.argv[dbPathArgIndex + 1]) {
    DB_PATH = path.resolve(process.argv[dbPathArgIndex + 1]);
  } else if (process.env.DB_PATH) {
    DB_PATH = path.resolve(process.env.DB_PATH);
  } else {
    DB_PATH = path.join(__dirname, '..', 'db');
  }

  startServer({ port: PORT, dbPath: DB_PATH });
}

module.exports = {
  GenericRestServer,
  startServer
};
