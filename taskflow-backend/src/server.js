// Import required modules
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const passport = require("./config/passport");
const startReminderJob = require("./jobs/reminderJob");
const paymentRoutes = require("./routes/paymentRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://task-flow-six-inky.vercel.app"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(passport.initialize());

io.on("connection", (socket) => {
  socket.on("join-user-room", (userId) => {
    if (!userId) return;
    socket.join(String(userId));
  });

  socket.on("leave-user-room", (userId) => {
    if (!userId) return;
    socket.leave(String(userId));
  });
});

module.exports = { io };

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "TaskFlow Backend is running!" });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start the reminder job
startReminderJob();

// Routes
app.use("/api/auth", authRoutes);

const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);
app.use("/api/payment", paymentRoutes);
// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong on the server",
    error: err.message,
  });
});

app.use("/api/ai", aiRoutes);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
