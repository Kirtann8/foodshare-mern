// Script to create an admin user
// Run this from backend directory: node createAdmin.js

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/FoodShare', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@foodshare.com' });
    
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('Email: admin@foodshare.com');
      console.log('If you forgot the password, delete this user and run the script again.');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@foodshare.com',
      password: 'admin123456',  // Change this to a strong password
      role: 'admin',
      phone: '0000000000',
      address: {
        street: 'Admin Office',
        city: 'Admin City',
        state: 'Admin State',
        postalCode: '00000'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('=================================');
    console.log('   ADMIN CREDENTIALS');
    console.log('=================================');
    console.log('Email:    admin@foodshare.com');
    console.log('Password: admin123456');
    console.log('=================================');
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password after first login!');
    console.log('');
    console.log('Login at: http://localhost:3000/login');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdmin();
