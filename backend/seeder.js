import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import User from './models/userModel.js';
import Item from './models/itemModel.js';
import BorrowRecord from './models/borrowRecordModel.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    await BorrowRecord.deleteMany();
    await Item.deleteMany();
    await User.deleteMany();

    // Creating one by one triggers the pre('save') hash
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'admin123',
      isAdmin: true,
    });

    await User.create({
      name: 'Regular Student',
      email: 'user@example.com',
      password: 'user123',
      isAdmin: false,
    });

    console.log('✅ Users Imported!');

    const sampleBooks = [
      {
        name: 'Clean Code',
        description: 'A Handbook of Agile Software Craftsmanship.',
        addedBy: adminUser._id,
        status: 'Available'
      },
      {
        name: 'The Pragmatic Programmer',
        description: 'Your journey to mastery.',
        addedBy: adminUser._id,
        status: 'Available'
      },
      {
        name: 'Design Patterns',
        description: 'Elements of Reusable Object-Oriented Software.',
        addedBy: adminUser._id,
        status: 'Available'
      },
      {
        name: 'Introduction to Algorithms',
        description: 'Comprehensive guide to algorithms.',
        addedBy: adminUser._id,
        status: 'Available'
      },
      {
        name: 'Cracking the Coding Interview',
        description: '189 programming questions and solutions.',
        addedBy: adminUser._id,
        status: 'Available'
      }
    ];

    const itemsToCreate = [];
    for (const book of sampleBooks) {
      const qrId = crypto.randomUUID();
      const copiesCount = Math.floor(Math.random() * 5) + 1; // 1-5 copies
      for (let i = 0; i < copiesCount; i++) {
        itemsToCreate.push({ ...book, qrCodeId: qrId });
      }
    }

    await Item.insertMany(itemsToCreate);

    console.log('✅ Books Imported with random copies!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await BorrowRecord.deleteMany();
    await Item.deleteMany();
    await User.deleteMany();
    console.log('🗑️ Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
