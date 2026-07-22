const express = require('express');
const { register, asyncHandler } = require('../controllers/authController');

const router = express.Router();

router.post('/register', asyncHandler(register));

module.exports = router;