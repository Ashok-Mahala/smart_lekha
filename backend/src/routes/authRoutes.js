const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
// router.get('/me', protect, getMe);
// router.put('/profile', protect, updateProfile);
// router.put('/change-password', protect, changePassword);

module.exports = router; 