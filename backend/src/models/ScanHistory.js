import mongoose from 'mongoose';

const scanHistorySchema = new mongoose.Schema(
  {
    qrCode: { type: String, required: true, trim: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productSnapshot: {
      name: String,
      sku: String,
      category: String,
      price: Number
    },
    matched: { type: Boolean, default: false },
    source: { type: String, default: 'camera-stream', trim: true },
    cameraUrl: { type: String, default: '', trim: true },
    scannedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
