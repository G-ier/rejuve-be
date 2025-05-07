// Third party imports
require('dotenv');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Local imports
const EnvironmentVariablesManager = require('../src/shared/services/EnvironmentVariablesManager');

// Create a dummy middleware that skips JWT verification
const dummyJwtCheck = (req, res, next) => {
  console.log('Bypassing JWT verification in development mode');
  req.auth = {
    sub: 'auth0|12345',
    permissions: ['admin']
  };
  next();
};

// Check if we're in development mode or JWT should be disabled
const disableAuth = EnvironmentVariablesManager.getEnvVariable('DISABLE_AUTH_DEADLOCK') === 'true';

// Export the appropriate middleware based on environment
module.exports = disableAuth ? dummyJwtCheck : jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/.well-known/jwks.json`,
  }),
  // Validate the audience and the issuer.
  audience: EnvironmentVariablesManager.getEnvVariable('AUTH0_AUDIENCE'),
  issuer: `https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/`,
  algorithms: ['RS256'],
});
