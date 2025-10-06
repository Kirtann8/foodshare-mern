import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load env vars
dotenv.config();

/**
 * Migration script to mark all existing users as email verified
 * Run this ONLY ONCE after deploying the new email verification feature
 * 
 * Usage: node migrations/verifyExistingUsers.js
 */

const verifyExistingUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Find all users without the isEmailVerified field or where it's false
    const usersToUpdate = await User.find({
      $or: [
        { isEmailVerified: { $exists: false } },
        { isEmailVerified: false, createdAt: { $lt: new Date('2025-10-05') } } // Update created before this deployment
      ]
    });

    console.log(`\n📊 Found ${usersToUpdate.length} users to mark as verified\n`);

    if (usersToUpdate.length === 0) {
      console.log('✨ No users need updating. All done!');
      process.exit(0);
    }

    // Ask for confirmation
    console.log('⚠️  This will mark all existing users as email verified.');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update all existing users
    const result = await User.updateMany(
      {
        $or: [
          { isEmailVerified: { $exists: false } },
          { isEmailVerified: false, createdAt: { $lt: new Date('2025-10-05') } }
        ]
      },
      {
        $set: { isEmailVerified: true }
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} users`);
    console.log(`\nDetails:`);
    console.log(`  - Matched: ${result.matchedCount}`);
    console.log(`  - Modified: ${result.modifiedCount}`);
    console.log(`  - Acknowledged: ${result.acknowledged}`);

    // Show sample of updated users
    if (result.modifiedCount > 0) {
      const updatedUsers = await User.find({ isEmailVerified: true })
        .select('name email isEmailVerified createdAt')
        .limit(5);
      
      console.log(`\n📋 Sample of verified users:`);
      updatedUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
      });
    }

    console.log(`\n✨ Migration completed successfully!\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run migration
console.log('\n🚀 Starting user verification migration...\n');
verifyExistingUsers();
