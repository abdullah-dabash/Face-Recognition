const express = require('express');
const { createLecture, getLectures, getAllLectures, getLectureById } = require('../controllers/lectureController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, createLecture); // Create a lecture (doctor only)
router.get('/', protect, getLectures); // Get all lectures for a specific doctor
router.get('/all', isAdmin, getAllLectures); // Get all lectures (admin only)

// Add the route to fetch a specific lecture by ID
router.get('/:id', protect, getLectureById); // Get a lecture by ID (doctor only)

module.exports = router;
