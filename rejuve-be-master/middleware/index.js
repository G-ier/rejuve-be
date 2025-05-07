// Utility middleware
const json = require('express').json({ limit: '50mb' });
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

// Custom middleware for authentication
const jwtCheck = require('./jwtCheck');
const ErrorHandler = require('./error');
const AuthUser = require('./authUser');
const isBot = require('./isBot');

//const crossroadRouter = express.Router();
//crossroadRouter.use(crossroadsRoutes);
const EnvironmentVariablesManager = require('../src/shared/services/EnvironmentVariablesManager');

const logic = require('../src/modules/logic/routes/logicRoutes');

// Routes Logger
const routesLogger = require('./routeLoggers');

var livereload = require('livereload');
var connectLiveReload = require('connect-livereload');

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

// Tracking requests from postback servers are allowed without authentication.
// The other routes are meant to be accessed from the dashboard with authenticated users and they
// basically populate the dashboard with data.
function configureMiddleware(server) {
  // Routes Logger
  server.use(routesLogger);

  // Utility middleware
  server.use(connectLiveReload());
  server.use(helmet());
  server.use(cors());
  server.use(json);

  // Postback route
  //server.use('/trk', isBot, postback);

  server.use(morgan('dev'));

  // Authentication routes
  if (EnvironmentVariablesManager.getEnvVariable('DISABLE_AUTH_DEADLOCK') !== 'true') {
    server.use(jwtCheck);
    server.use(AuthUser);
  }

  // Normal usage routes
  server.use('/api/logic', logic);
  server.use(ErrorHandler);
}

module.exports = {
  configureMiddleware,
};
