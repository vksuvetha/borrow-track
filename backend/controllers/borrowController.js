import BorrowRecord from '../models/borrowRecordModel.js';
import Item from '../models/itemModel.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Borrow an item
// @route   POST /api/borrow/:qrCodeId
// @access  Private
const borrowItem = async (req, res) => {
  const { expectedReturnDate } = req.body;
  
  // Find an AVAILABLE item with this QR code
  const item = await Item.findOne({ qrCodeId: req.params.qrCodeId, status: 'Available' });

  if (!item) {
    const existingAny = await Item.findOne({ qrCodeId: req.params.qrCodeId });
    if (existingAny) {
      return res.status(400).json({ message: 'All copies of this item are currently borrowed' });
    }
    return res.status(404).json({ message: 'Item not found' });
  }

  // Validate expectedReturnDate (max 7 days)
  const today = new Date();
  today.setHours(0,0,0,0);
  const maxReturnDate = new Date(today);
  maxReturnDate.setDate(today.getDate() + 7);
  maxReturnDate.setHours(23,59,59,999);

  const selectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate) : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (selectedReturnDate > maxReturnDate) {
    return res.status(400).json({ message: 'Maximum borrow period is 1 week (7 days)' });
  }
  if (selectedReturnDate < today) {
    return res.status(400).json({ message: 'Expected return date cannot be in the past' });
  }

  const borrowRecord = new BorrowRecord({
    item: item._id,
    user: req.user._id,
    expectedReturnDate: selectedReturnDate,
    status: 'Borrowed',
  });

  const createdRecord = await borrowRecord.save();
  
  item.status = 'Borrowed';
  await item.save();

  res.status(201).json(createdRecord);
};

// @desc    Return an item
// @route   PUT /api/borrow/return/:qrCodeId
// @access  Private (ADMIN ONLY)
const returnItem = async (req, res) => {
  // SECURITY CHECK: Only Admins can process returns
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Only administrators can process returns.' });
  }

  const itemsWithQr = await Item.find({ qrCodeId: req.params.qrCodeId });

  if (itemsWithQr.length === 0) {
    res.status(404).json({ message: 'Item not found in system' });
    return;
  }

  const itemIds = itemsWithQr.map(i => i._id);

  // Find ANY active borrow record for ANY user for THESE items
  const record = await BorrowRecord.findOne({
    item: { $in: itemIds },
    status: { $in: ['Borrowed', 'Overdue'] },
  });

  if (!record) {
    res.status(400).json({ message: 'No active borrow record found for this item.' });
    return;
  }

  record.actualReturnDate = new Date();
  record.status = 'Returned';
  await record.save();

  const realItem = await Item.findById(record.item);
  realItem.status = 'Available';
  await realItem.save();

  res.json({ message: 'Item returned successfully by Admin', record });
};


// @desc    Get all borrow records (Active and Past)
// @route   GET /api/borrow
// @access  Private/Admin
const getBorrowRecords = async (req, res) => {
  const records = await BorrowRecord.find({})
    .populate('user', 'id name email')
    .populate('item', 'id name qrCodeId status');
  res.json(records);
};

// @desc    Get user's borrow history
// @route   GET /api/borrow/mybhistory
// @access  Private
const getMyBorrowHistory = async (req, res) => {
  const records = await BorrowRecord.find({ user: req.user._id })
    .populate('item', 'id name qrCodeId status');
  res.json(records);
};

// @desc    Get overdue items
// @route   GET /api/borrow/overdue
// @access  Private/Admin
const getOverdueItems = async (req, res) => {
  const currentDate = new Date();
  const records = await BorrowRecord.find({
    $or: [
      { status: 'Overdue' },
      { status: 'Borrowed', expectedReturnDate: { $lt: currentDate } }
    ],
  })
    .populate('user', 'id name email')
    .populate('item', 'id name qrCodeId')
    .sort({ expectedReturnDate: 1 });
  
  res.json(records);
};

// @desc    Send manual reminder email
// @route   POST /api/borrow/reminder/:id
// @access  Private/Admin
const sendManualReminder = async (req, res) => {
  try {
    const record = await BorrowRecord.findById(req.params.id)
      .populate('user', 'name email')
      .populate('item', 'name');

    if (!record) {
      console.log('Record not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Record not found' });
    }

    console.log(`Attempting to send manual reminder to: ${record.user.email} for item: ${record.item.name}`);

    await sendEmail({
      email: record.user.email,
      subject: `Overdue Notice: ${record.item.name}`,
      message: `Hi ${record.user.name},\n\nFriendly reminder! You have an overdue item: "${record.item.name}". Please return it as soon as possible to avoid further fines.\n\nBest regards,\nBorrowTrack Team`,
    });

    console.log('Email sent successfully!');

    res.json({ message: 'Reminder email sent successfully' });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ message: 'Failed to send email. Check backend logs.' });
  }
};

// @desc    Force trigger the overdue/due-today check (for testing)
// @route   GET /api/borrow/test-cron
// @access  Private/Admin
const testCron = async (req, res) => {
    try {
        const currentDate = new Date();
        
        // 1. OVERDUE
        const overdueRecords = await BorrowRecord.find({
            status: 'Borrowed',
            expectedReturnDate: { $lt: currentDate },
        }).populate('user', 'name email').populate('item', 'name');

        // 2. DUE TODAY
        const todayStart = new Date(currentDate);
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date(todayStart);
        todayEnd.setHours(23,59,59,999);
        const dueTodayRecords = await BorrowRecord.find({
            status: 'Borrowed',
            expectedReturnDate: { $gte: todayStart, $lt: todayEnd },
        }).populate('user', 'name email').populate('item', 'name');

        res.json({
            message: 'Cron logic executed successfully',
            summary: {
                totalOverdueFound: overdueRecords.length,
                totalDueTodayFound: dueTodayRecords.length
            },
            notes: 'Emails are being sent if records were found. Check backend terminal for full logs.'
        });
    } catch (error) {
        console.error('Cron Test Error:', error);
        res.status(500).json({ message: 'Cron test failed' });
    }
};

export {
  borrowItem,
  returnItem,
  getBorrowRecords,
  getMyBorrowHistory,
  getOverdueItems,
  sendManualReminder,
  testCron
};
