// Import required modules
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());                    // Allow requests from frontend
app.use(express.json());            // Parse JSON bodies

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow Backend is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

  // Routes
app.use('/api/auth', authRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong on the server',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});