const express = require('express');
const { getTasks, createTask, updateTask, archiveTask, restoreTask, permanentDeleteTask, asyncHandler } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const sendDueReminders = require('../utils/sendDueReminders');

const router = express.Router();

router.use(protect); // Protect all task routes

router.get('/', asyncHandler(getTasks));
router.post('/', asyncHandler(createTask));
router.put('/:id', asyncHandler(updateTask));
router.get('/test-reminders', async (req, res) => {
  const result = await sendDueReminders();
  res.json(result);
});
router.put('/:id/archive', protect, asyncHandler(archiveTask));
router.put('/:id/restore', protect, asyncHandler(restoreTask));
router.delete('/:id/permanent', protect, asyncHandler(permanentDeleteTask));

module.exports = router;