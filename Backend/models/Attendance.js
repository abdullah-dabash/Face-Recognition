const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    default: 'absent'
  },
  method: {
    type: String,
    enum: ['manual', 'face'],
    default: 'manual'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Remove the unique compound index
// Create a non-unique index for better query performance
attendanceSchema.index({ student: 1, lecture: 1, createdAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);