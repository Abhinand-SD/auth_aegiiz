const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// logout: can logout with refresh token or via access-token (authenticated)
router.post('/logout', authenticate, authController.logout);

module.exports = router;
