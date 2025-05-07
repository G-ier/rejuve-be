// Temporary solution since UserService is missing
// const UserService = require('../src/modules/auth/services/UserService');
const _ = require('lodash');

module.exports = async (req, res, next) => {
  // Create a dummy auth object for now
  req.auth = req.auth || {};
  req.auth.isAdmin = true; // Allow admin access for development
  req.auth.permissions = req.auth.permissions || ['admin'];
  req.auth.sub = req.auth.sub || 'auth0|12345';
  req.auth.providerId = req.auth.sub.split('|')[1];

  // Create a dummy user with admin role
  const dummyUser = {
    id: 'dev-user-id',
    roles: ['admin'],
    permissions: ['admin'],
    name: 'Development User',
    email: 'dev@example.com'
  };

  req.user = { ...req.auth, ...dummyUser };
  console.log('Using dev user for authentication');
  next();
};
