// seedDoctor.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // adjust path as needed

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const exists = await User.findOne({ username: 'dr_smith' });
    if (exists) {
      console.log('User already exists.');
    } else {
      const user = new User({
        username: 'dr_smith',
        password: '123456', // plain, will be hashed
        role: 'doctor',
      });

      await user.save(); // triggers pre-save hashing
      console.log('Doctor created:', user.username);
    }
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
