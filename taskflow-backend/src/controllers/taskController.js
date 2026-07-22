const Task = require('../models/Task');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });
  res.json(tasks);
};

const createTask = async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user.id });
  res.status(201).json(task);
};

const updateTask = async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true }
  );
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
};

const deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
};

module.exports = { getTasks, createTask, updateTask, deleteTask, asyncHandler };