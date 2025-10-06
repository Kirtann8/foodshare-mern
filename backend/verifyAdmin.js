// Script to verify admin email
// Run this from backend directory: node verifyAdmin.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/FoodShare', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const verifyAdmin = async () => {
  try {
    const admin = await User.findOneAndUpdate(
      { email: 'admin@foodshare.com' },
      { isEmailVerified: true },
      { new: true }
    );

    if (admin) {
      console.log('✅ Admin user email verified successfully!');
      console.log('');
      console.log('=================================');
      console.log('   ADMIN CREDENTIALS');
      console.log('=================================');
      console.log('Email:    admin@foodshare.com');
      console.log('Password: admin123456');
      console.log('Status:   Email Verified ✓');
      console.log('=================================');
      console.log('');
      console.log('You can now login at: http://localhost:3000/login');
    } else {
      console.log('❌ Admin user not found. Run createAdmin.js first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying admin user:', error.message);
    process.exit(1);
  }
};

verifyAdmin();