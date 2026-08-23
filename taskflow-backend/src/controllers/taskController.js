const Task = require("../models/Task");
const { io } = require("../server");

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const emitTaskUpdate = (userId, payload) => {
  if (!userId) return;
  io.to(String(userId)).emit("task-updated", payload);
};

const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sort || "newest";
    const searchTerm = (req.query.search || "").trim();

    // Filter
    const filter = {
      user: req.user.id,
      isArchived: false, // ← only show active tasks
    };

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    // Optional: allow viewing archived tasks
    if (req.query.archived === "true") {
      filter.isArchived = true;
    }

    // Sorting logic
    let sortOption = {};
    switch (sortBy) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "dueDate":
        sortOption = { dueDate: 1 };
        break;
      case "priority":
        sortOption = { priority: -1 };
        break;
      case "title":
        sortOption = { title: 1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
    }

    const totalTasks = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      tasks,
      currentPage: page,
      totalPages: Math.ceil(totalTasks / limit),
      totalTasks,
      hasNextPage: page * limit < totalTasks,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const createTask = async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user.id });
  emitTaskUpdate(req.user.id, { type: "created", task });
  res.status(201).json(task);
};

const updateTask = async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true },
  );
  if (!task) return res.status(404).json({ message: "Task not found" });
  emitTaskUpdate(req.user.id, { type: "updated", task });
  res.json(task);
};

// Archive a task
const archiveTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.isArchived = true;
    await task.save();

    res.json({ success: true, message: "Task archived successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Restore a task
const restoreTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.isArchived = false;
    await task.save();

    res.json({ success: true, message: "Task restored successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Permanent Delete
const permanentDeleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ success: true, message: "Task permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  archiveTask,
  restoreTask,
  permanentDeleteTask,
  asyncHandler,
};
