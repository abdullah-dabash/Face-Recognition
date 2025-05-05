const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Lecture = require('../models/Lecture');
const path = require('path');

// @desc    Mark attendance manually
const markManualAttendance = async (req, res) => {
  const { studentId, lectureId, status } = req.body;

  // Check if student exists
  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Check if lecture exists
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

  try {
    // Check if attendance already exists for this student in this lecture
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      lecture: lectureId
    });

    let attendance;

    if (existingAttendance) {
      // Update existing attendance record
      existingAttendance.status = status || 'present';
      existingAttendance.method = 'manual';
      existingAttendance.updatedAt = Date.now();
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        student: studentId,
        lecture: lectureId,
        status: status || 'present',
        method: 'manual'
      });
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error('Error marking manual attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark attendance using face recognition (auto)
const markAutoAttendance = async (req, res) => {
  const { studentId, lectureId } = req.body;

  // Check if student exists
  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Check if lecture exists
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

  try {
    // Check if attendance already exists for this student in this lecture
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      lecture: lectureId
    });

    let attendance;

    if (existingAttendance) {
      // Update existing attendance record
      existingAttendance.status = 'present';
      existingAttendance.method = 'face';
      existingAttendance.updatedAt = Date.now();
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance record
      attendance = await Attendance.create({
        student: studentId,
        lecture: lectureId,
        status: 'present',
        method: 'face'
      });
    }

    res.status(200).json(attendance);
  } catch (err) {
    console.error('Error marking auto attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get attendance report for a specific lecture
const getAttendanceReport = async (req, res) => {
  const { lectureId } = req.params;

  try {
    const attendance = await Attendance.find({ lecture: lectureId }).populate('student', 'name');

    // Calculate statistics
    const report = attendance.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    // Add total count
    report.total = attendance.length;

    res.json(report);
  } catch (err) {
    console.error('Error getting attendance report:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get attendance for a specific lecture
const getLectureAttendance = async (req, res) => {
  const { lectureId } = req.params;

  try {
    // Find all attendance records for this lecture
    const attendanceRecords = await Attendance.find({ lecture: lectureId })
      .populate('student', 'name faceImage')
      .sort({ createdAt: -1 });

    res.json(attendanceRecords);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  markManualAttendance,
  markAutoAttendance,
  getAttendanceReport,
  getLectureAttendance
};