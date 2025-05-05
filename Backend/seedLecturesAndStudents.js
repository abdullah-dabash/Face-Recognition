// seedLecturesAndStudents.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Lecture = require('./models/Lecture');
const Student = require('./models/Student');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

(async () => {
  try {
    const doctor = await User.findOne({ username: 'dr_smith' });
    if (!doctor) throw new Error('Doctor not found');

    // Create 2 lectures
    const lectureNames = ['Lecture A', 'Lecture B'];
    const lectures = [];

    for (const name of lectureNames) {
      const lecture = new Lecture({ name, doctor: doctor._id });
      await lecture.save();
      lectures.push(lecture);
    }

    // Add 4 students per lecture
    for (const lecture of lectures) {
      const students = [];

      for (let i = 1; i <= 4; i++) {
        const student = new Student({
          name: `Student ${i} (${lecture.name})`,
          lecture: lecture._id,
        });
        await student.save();
        students.push(student._id);
      }

      // Link students to lecture
      lecture.students = students;
      await lecture.save();
    }

    console.log('Seeding complete ✅');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
})();
