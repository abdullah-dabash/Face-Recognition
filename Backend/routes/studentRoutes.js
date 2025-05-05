const express = require('express');
const { addStudent, getStudentsByLecture, getStudent } = require('../controllers/studentController');
const upload = require('../middlewares/uploadMiddleware'); // Multer middleware
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, upload.single('faceImage'), addStudent); // Add a student (with face image)
router.get('/:lectureId', protect, getStudentsByLecture); // Get students by lecture
router.get('/student/:id', protect, getStudent); // Get a single student by ID

module.exports = router;
