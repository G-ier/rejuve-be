// Third party imports
require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');

// Local imports
const EnvironmentVariablesManager = require('../src/shared/services/EnvironmentVariablesManager');

// Initialize API
const initializeAPI = async () => {

  // Retrieve environment variables
  console.log('Retrieving environment variables...');
  await EnvironmentVariablesManager.init();
  console.log('Environment variables retrieved.');

  // Initialize server
  const server = express();
  
  // Import routes
  const authRoutes = require('../src/modules/auth/routes/authRoutes');
  // Programs module is missing - commented out until implemented
  // const programsRoutes = require('../src/modules/programs/routes/programsRouts');
  const logicRoutes = require('../src/modules/logic/routes/logicRoutes');
  const errorHandler = require('../middleware/error');

  server.get('/', (req, res) => {
    res.send(
      '<h1 style="color: red; text-align: center; font-size: 40px;">Launcher BE Server Running!</h1>',
    );
  });

  const { configureMiddleware } = require('../middleware');
  const { ServerLogger } = require('../src/shared/lib/WinstonLogger');

  // Configuring global middleware
  configureMiddleware(server);
  
  // JSON parsing middleware
  server.use(express.json());
  
  // API routes
  server.use('/api/auth', authRoutes);
  // Programs routes commented out until module is implemented
  // server.use('/api/programs', programsRoutes);
  server.use('/api/logic', logicRoutes);
  
  // Error handling middleware
  server.use(errorHandler);

  ServerLogger.info('Server initialized');

  // Start server
  const port = EnvironmentVariablesManager.getEnvVariable('PORT') || 5044;

  server.listen(port, async () => {
    console.log(`🔥 ---------- Server started ------------ 🔥`);

    // Slack notification
    const DISABLE_SLACK_NOTIFICATION = EnvironmentVariablesManager.getEnvVariable('DISABLE_SLACK_NOTIFICATION',);
    const disableSlackNotification = DISABLE_SLACK_NOTIFICATION === 'true' || DISABLE_SLACK_NOTIFICATION !== 'false';

    // Logging
    const loggingEnvironment = EnvironmentVariablesManager.getEnvVariable('LOGGING_ENVIRONMENT') || 'development';
    const logLevel = EnvironmentVariablesManager.getEnvVariable('LOG_LEVEL') || 'info';

    // Database urls
    const databaseEnvironment = EnvironmentVariablesManager.getEnvVariable('DATABASE_ENVIRONMENT') || 'development';
    const productionDatabaseUrl = EnvironmentVariablesManager.getEnvVariable('DATABASE_URL');
    const stagingDatabaseUrl =  EnvironmentVariablesManager.getEnvVariable('DATABASE_URL_STAGING');

    // In use database url
    const databaseUrl =
      databaseEnvironment === 'production'
        ? productionDatabaseUrl
        : databaseEnvironment === 'staging'
        ? stagingDatabaseUrl
        : process.env.DATABASE_URL_LOCAL;


    console.log(`
      Server Info:
        Port: ${port}
        Slack Notifications: ${disableSlackNotification ? 'Disabled' : 'Enabled'}
        Environment Location: ${
          process.env.ENVIRONMENT_LOCATION === 'local' ? 'Local' : 'AWS Cloud'
        }

      Logging:
        Environment: ${loggingEnvironment || 'development'}
        Log Level: ${logLevel || 'info'}

      Database:
        Environment: ${databaseEnvironment || 'development'}
        URL: ${databaseUrl}
    `);
  });
  
  return serverless(server);
};

module.exports = { initializeAPI };
