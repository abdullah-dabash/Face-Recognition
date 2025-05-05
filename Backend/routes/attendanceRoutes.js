const express = require('express');
const { 
  markManualAttendance, 
  markAutoAttendance, 
  getAttendanceReport,
  getLectureAttendance // Make sure to import this
} = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/manual', protect, markManualAttendance); // Mark attendance manually
router.post('/auto', protect, markAutoAttendance); // Mark attendance via face recognition
router.get('/report/:lectureId', protect, getAttendanceReport); // Get attendance report for a lecture
router.get('/:lectureId', protect, getLectureAttendance); // Get all attendance records for a lecture

module.exports = router;