const Lecture = require('../models/Lecture');
const User = require('../models/User');

// @desc    Create a new lecture for a doctor
const createLecture = async (req, res) => {
    const { title, time, days } = req.body;
    const doctorId = req.user.id;
  
    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Lecture title is required' });
    }
    if (!time) {
      return res.status(400).json({ message: 'Lecture time is required' });
    }
    if (!days || !Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ message: 'At least one day must be selected' });
    }
  
    try {
      const lecture = await Lecture.create({ 
        title, 
        time, 
        days, 
        doctor: doctorId 
      });
      res.status(201).json(lecture);
    } catch (err) {
      console.error('Error creating lecture:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  // @desc    Get all lectures for a specific doctor
  const getLectures = async (req, res) => {
    const doctorId = req.user.id;
  
    try {
      const lectures = await Lecture.find({ doctor: doctorId });
      res.json(lectures);
    } catch (err) {
      console.error('Error fetching lectures:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
// @desc    Get all lectures (admin view)
const getAllLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find().populate('doctor', 'username');
    res.json(lectures);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a specific lecture by ID
const getLectureById = async (req, res) => {
  const { id } = req.params;

  try {
    const lecture = await Lecture.findById(id).populate('doctor', 'username');
    
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    res.json(lecture);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createLecture,
  getLectures,
  getAllLectures,
  getLectureById, // Add this function
};
