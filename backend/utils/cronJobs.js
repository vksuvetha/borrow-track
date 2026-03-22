import cron from 'node-cron';
import BorrowRecord from '../models/borrowRecordModel.js';
import sendEmail from './sendEmail.js';

// Run every day at midnight (0 0 * * *)
// For testing purposes, uncomment to run every minute (* * * * *)
cron.schedule('0 0 * * *', async () => {
  console.log('Running Overdue Check Cron Job...');
  try {
    const currentDate = new Date();
    
    // Find all borrowed records where expected return date has passed
    const overdueRecords = await BorrowRecord.find({
      status: 'Borrowed',
      expectedReturnDate: { $lt: currentDate },
    }).populate('user', 'name email').populate('item', 'name');

    if (overdueRecords.length > 0) {
      console.log(`Found ${overdueRecords.length} newly overdue items.`);
      
      for (const record of overdueRecords) {
        // Update database explicitly marking it as Overdue
        record.status = 'Overdue';
        await record.save();

        console.log('--- SYSTEM REMINDER ---');
        console.log(`To: ${record.user.email} (${record.user.name})`);
        console.log(`Subject: Overdue Notice - ${record.item.name}`);
        console.log(`Message: Please return the item "${record.item.name}". It was due on ${record.expectedReturnDate.toDateString()}.`);
        console.log('-----------------------');

        try {
          await sendEmail({
            email: record.user.email,
            subject: `Overdue Notice: ${record.item.name}`,
            message: `Hi ${record.user.name},\n\nPlease return the item "${record.item.name}". It was due on ${record.expectedReturnDate.toDateString()}.\n\nBest regards,\nBorrowTrack Team`,
          });
        } catch (emailError) {
          console.error(`Failed to send overdue email to ${record.user.email}:`, emailError.message);
        }
      }
    }
    
    // Find items due TODAY
    const todayStart = new Date(currentDate);
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23,59,59,999);

    const dueTodayRecords = await BorrowRecord.find({
      status: 'Borrowed',
      expectedReturnDate: { $gte: todayStart, $lt: todayEnd },
    }).populate('user', 'name email').populate('item', 'name');

    if (dueTodayRecords.length > 0) {
      console.log(`Found ${dueTodayRecords.length} items due TODAY. Sending urgent reminders...`);
      for (const record of dueTodayRecords) {
        try {
          await sendEmail({
            email: record.user.email,
            subject: `URGENT: Return ${record.item.name} Today`,
            message: `Hi ${record.user.name},\n\nJust a reminder that your item "${record.item.name}" is due today (${record.expectedReturnDate.toDateString()}). Please return it to avoid any late fees.\n\nBest regards,\nBorrowTrack Team`,
          });
        } catch (emailError) {
          console.error(`Failed to send due-today reminder to ${record.user.email}:`, emailError.message);
        }
      }
    }

    // Find items due TOMORROW
    const tomorrowStart = new Date(currentDate);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0,0,0,0);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23,59,59,999);

    const upcomingRecords = await BorrowRecord.find({
      status: 'Borrowed',
      expectedReturnDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
    }).populate('user', 'name email').populate('item', 'name');

    if (upcomingRecords.length > 0) {
      console.log(`Found ${upcomingRecords.length} items due tomorrow. Sending reminders...`);
      for (const record of upcomingRecords) {
        console.log('--- SYSTEM REMINDER ---');
        console.log(`To: ${record.user.email} (${record.user.name})`);
        console.log(`Subject: Upcoming Due Date - ${record.item.name}`);
        console.log(`Message: Friendly reminder! Your item "${record.item.name}" is due tomorrow (${record.expectedReturnDate.toDateString()}). Please return it to avoid overdue fines.`);
        console.log('-----------------------');

        try {
          await sendEmail({
            email: record.user.email,
            subject: `Upcoming Due Date: ${record.item.name}`,
            message: `Hi ${record.user.name},\n\nFriendly reminder! Your item "${record.item.name}" is due tomorrow (${record.expectedReturnDate.toDateString()}). Please return it to avoid overdue fines.\n\nBest regards,\nBorrowTrack Team`,
          });
        } catch (emailError) {
          console.error(`Failed to send upcoming reminder to ${record.user.email}:`, emailError.message);
        }
      }
    }

  } catch (error) {
    console.error('Error in Overdue Check Cron Job:', error);
  }
});
