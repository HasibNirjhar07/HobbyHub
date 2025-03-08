const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/auth');

// Login page - GET
router.get('/login', forwardAuthenticated, authController.getLoginPage);

// Register page - GET
router.get('/register', forwardAuthenticated, authController.getRegisterPage);

// Register - POST
router.post('/register', authController.registerUser);

// Login - POST
router.post('/login', authController.loginUser);

// Logout - GET
router.get('/logout', authController.logoutUser);

// Google OAuth routes
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleCallback);

// Home page route
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/feed');
  }
  res.redirect('/login');
});

module.exports = router;