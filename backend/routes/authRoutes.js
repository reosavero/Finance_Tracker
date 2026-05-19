const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, uploadProfilePhoto, changePassword, verifyPassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadProfilePhoto: uploadProfilePhotoMiddleware } = require('../middleware/uploadMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/profile/photo', authMiddleware, uploadProfilePhotoMiddleware, uploadProfilePhoto);
router.put('/change-password', authMiddleware, changePassword);
router.post('/verify-password', authMiddleware, verifyPassword);

module.exports = router;
