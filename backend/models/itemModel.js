import mongoose from 'mongoose';

const itemSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    qrCodeId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Borrowed'],
      default: 'Available',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model('Item', itemSchema);

export default Item;
