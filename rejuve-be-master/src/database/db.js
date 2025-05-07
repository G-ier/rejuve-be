const DatabaseConnection = require('../shared/services/DatabaseConnection');

// Export the database connection directly
module.exports = DatabaseConnection.getConnection(); 