const mongoose = require('mongoose');

// Lecture Schema based on your provided model with added time and days fields
const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  time: { type: String, required: true }, // e.g. "14:00 - 16:00"
  days: [{ type: String, required: true }], // e.g. ["Monday", "Wednesday"]
}, { timestamps: true });

module.exports = mongoose.model('Lecture', lectureSchema);