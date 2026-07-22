const express = require('express');
const { getTasks, createTask, updateTask, deleteTask, asyncHandler } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all task routes

router.get('/', asyncHandler(getTasks));
router.post('/', asyncHandler(createTask));
router.put('/:id', asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

module.exports = router;