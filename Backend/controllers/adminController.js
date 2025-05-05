const User = require('../models/User');

// Get all doctors
const getAllDoctors = async (req, res) => {
  const doctors = await User.find({ role: 'doctor' }).select('-password');
  res.json(doctors);
};

// Create a new doctor
const createDoctor = async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: 'Doctor already exists' });

  const doctor = await User.create({ username, password, role: 'doctor' });
  res.status(201).json({ id: doctor._id, username: doctor.username });
};

// Delete a doctor
const deleteDoctor = async (req, res) => {
  const doctor = await User.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  await doctor.deleteOne();
  res.json({ message: 'Doctor deleted' });
};

module.exports = {
  getAllDoctors,
  createDoctor,
  deleteDoctor,
};
