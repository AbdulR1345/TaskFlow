const express = require('express');
const passport = require('passport');
const {
  register,
  login,
  googleCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateAvatar,
  updateProfile,
  changePassword,
  deleteAccount,
  asyncHandler
} = require('../controllers/authController');
const { protect: auth } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', auth, asyncHandler(getMe));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password/:token', asyncHandler(resetPassword));
router.get('/verify-email/:token', asyncHandler(verifyEmail));
router.post('/resend-verification', asyncHandler(resendVerification));
router.put('/avatar', auth, upload.single('avatar'), asyncHandler(updateAvatar));
router.delete('/avatar', auth, asyncHandler(require('../controllers/authController').removeAvatar));
router.put('/profile', auth, asyncHandler(updateProfile));
router.put('/password', auth, asyncHandler(changePassword));
router.delete('/account', auth, asyncHandler(deleteAccount));

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  googleCallback
);

module.exports = router;