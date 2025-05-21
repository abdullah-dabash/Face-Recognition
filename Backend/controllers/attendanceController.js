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
    // ALWAYS create a new attendance record with current timestamp
    const now = new Date();
    
    const attendance = await Attendance.create({
      student: studentId,
      lecture: lectureId,
      status: status || 'present',
      method: 'manual',
      createdAt: now,
      updatedAt: now
    });

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
    // ALWAYS create a new attendance record with current timestamp
    const now = new Date();
    
    const attendance = await Attendance.create({
      student: studentId,
      lecture: lectureId,
      status: 'present',
      method: 'face',
      createdAt: now,
      updatedAt: now
    });

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
    // For the report, we'll want to count each student only once
    // Using the most recent attendance record for each student
    
    // First, get all attendance records for this lecture
    const allAttendance = await Attendance.find({ lecture: lectureId })
      .populate('student', 'name')
      .sort({ createdAt: -1 }); // Sort by date, newest first
    
    // Create a map to store the most recent record for each student
    const studentMap = new Map();
    
    // For each record, if we haven't seen this student yet, add them to the map
    allAttendance.forEach(record => {
      const studentId = record.student._id.toString();
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, record);
      }
    });
    
    // Convert the map to an array of the most recent records
    const latestAttendance = Array.from(studentMap.values());
    
    // Calculate statistics based on the most recent status for each student
    const report = latestAttendance.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});
    
    // Add total count
    report.total = latestAttendance.length;

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
    // For the lecture view, we want to show the most recent attendance status for each student
    
    // First, get all attendance records for this lecture
    const allAttendanceRecords = await Attendance.find({ lecture: lectureId })
      .populate('student', 'name faceImage')
      .sort({ createdAt: -1 }); // Sort by date, newest first
    
    // Create a map to store the most recent record for each student
    const studentMap = new Map();
    
    // For each record, if we haven't seen this student yet, add them to the map
    allAttendanceRecords.forEach(record => {
      const studentId = record.student._id.toString();
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, record);
      }
    });
    
    // Convert the map to an array of the most recent records
    const attendanceRecords = Array.from(studentMap.values());
    
    res.json(attendanceRecords);
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get attendance history for a specific student
const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Find ALL attendance records for this student, populate lecture info
    const attendanceRecords = await Attendance.find({ student: studentId })
      .sort({ createdAt: -1 }) // Sort by date, newest first
      .populate({
        path: 'lecture',
        select: 'title' // Include lecture title
      });
    
    // Format the response data with lecture information
    const formattedRecords = attendanceRecords.map(record => ({
      _id: record._id,
      date: record.createdAt,
      status: record.status,
      method: record.method || 'Manual', // Default to manual if not specified
      lectureName: record.lecture ? record.lecture.title : 'Unknown Lecture',
      lectureId: record.lecture ? record.lecture._id : null
    }));
    
    res.status(200).json(formattedRecords);
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ message: 'Failed to fetch attendance history' });
  }
};

module.exports = {
  markManualAttendance,
  markAutoAttendance,
  getAttendanceReport,
  getLectureAttendance,
  getStudentAttendanceHistory
};