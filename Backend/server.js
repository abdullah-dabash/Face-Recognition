const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
const app = express();

// Database connection
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads')); // serve images

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174','http://localhost:5176'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/admin', adminRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));