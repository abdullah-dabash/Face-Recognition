const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  faceImage: { 
    type: String // image URL or Multer path
  },
  faceDescriptor: { 
    type: String, // Store as JSON string for flexibility
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) && parsed.length === 128; // Face descriptors are 128-dimensional
        } catch (e) {
          return false; // Invalid JSON
        }
      },
      message: props => `Face descriptor must be a valid JSON string representing a 128-dimensional array!`
    }
  },
  lecture: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lecture', 
    required: true 
  },
  attendanceRecords: [{
    date: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: ['present', 'absent'], 
      default: 'absent' 
    },
    method: { 
      type: String, 
      enum: ['face', 'manual'], 
      default: 'manual' 
    },
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for attendance status
studentSchema.virtual('isPresent').get(function() {
  if (!this.attendanceRecords || this.attendanceRecords.length === 0) {
    return false;
  }
  
  // Sort by date descending and take most recent
  const sortedRecords = [...this.attendanceRecords].sort((a, b) => 
    b.date - a.date
  );
  
  return sortedRecords[0].status === 'present';
});

module.exports = mongoose.model('Student', studentSchema);