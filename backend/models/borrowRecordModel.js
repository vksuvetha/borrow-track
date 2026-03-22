import mongoose from 'mongoose';

const borrowRecordSchema = mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Item',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    borrowDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Borrowed', 'Returned', 'Overdue'],
      default: 'Borrowed',
    },
  },
  {
    timestamps: true,
  }
);

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);

export default BorrowRecord;
