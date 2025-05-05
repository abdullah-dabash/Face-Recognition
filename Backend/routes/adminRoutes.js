const express = require('express');
const { getAllDoctors, createDoctor, deleteDoctor } = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/doctors', protect, isAdmin, getAllDoctors);
router.post('/doctors', protect, isAdmin, createDoctor);
router.delete('/doctors/:id', protect, isAdmin, deleteDoctor);

module.exports = router;
