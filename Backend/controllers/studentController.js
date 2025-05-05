const Student = require('../models/Student');
const Lecture = require('../models/Lecture');
const upload = require('../middlewares/uploadMiddleware'); // Multer middleware for image upload
const path = require('path');
const fs = require('fs');

// @desc    Add a student to a lecture (with face image and descriptor)
const addStudent = async (req, res) => {
  try {
    const { name, lectureId, faceDescriptor } = req.body;

    // Check if lecture exists
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

    // Handle image upload via multer
    const studentImage = req.file ? req.file.path : '';
    
    // Create new student with face descriptor (if provided)
    const student = await Student.create({ 
      name, 
      lecture: lectureId, 
      faceImage: studentImage,
      faceDescriptor: faceDescriptor // Save descriptor as JSON string
    });
    
    res.status(201).json(student);
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// @desc    Get all students in a specific lecture
const getStudentsByLecture = async (req, res) => {
  const { lectureId } = req.params;

  try {
    const students = await Student.find({ lecture: lectureId });
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single student by ID
const getStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a student's face descriptor
const updateFaceDescriptor = async (req, res) => {
  const { id } = req.params;
  const { faceDescriptor } = req.body;

  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Update face descriptor
    student.faceDescriptor = faceDescriptor;
    await student.save();

    res.json(student);
  } catch (err) {
    console.error('Error updating face descriptor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a student
const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Remove face image if exists
    if (student.faceImage && fs.existsSync(student.faceImage)) {
      fs.unlinkSync(student.faceImage);
    }

    await student.remove();
    res.json({ message: 'Student removed' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addStudent,
  getStudentsByLecture,
  getStudent,
  updateFaceDescriptor,
  deleteStudent
};