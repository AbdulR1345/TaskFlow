const express = require("express");
const {
  generateSubtasks,
  summarizeTasks,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/generate-subtasks", protect, generateSubtasks);
router.post("/summarize", protect, summarizeTasks);

module.exports = router;
