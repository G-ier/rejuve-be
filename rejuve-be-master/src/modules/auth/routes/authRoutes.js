const express = require('express');
const router = express.Router();

// Import the authController
const authController = require('../controllers/authController');

// The authMiddleware is now applied globally in the server configuration

// Define routes for login and register
//router.post('/login', authController.login);
//router.post('/register', authController.register);
//router.post('/reset-password', authController.resetPassword);
//router.get('/me', authController.getMe);
//router.put('/update/:id', authController.updateUser);
// Register with social connection
//router.get('/register/:provider', authController.registerWithSocial);
//router.get('/callback', authController.handleSocialCallback);

// Define a protected route (requires authentication)
//router.get('/profile', authController.getProfile);

module.exports = router;
