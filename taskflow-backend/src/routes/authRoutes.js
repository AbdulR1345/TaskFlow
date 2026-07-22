const express = require('express');
const { register, login, asyncHandler } = require('../controllers/authController');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));

module.exports = router;