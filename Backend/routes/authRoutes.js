const express = require('express');
const { login, logout, registerDoctor } = require('../controllers/authController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Login route
router.post('/login', login);

// Register doctor route (only accessible by admin)
router.post('/register', isAdmin, registerDoctor);

// Logout route
router.post('/logout', protect, logout);

module.exports = router;
