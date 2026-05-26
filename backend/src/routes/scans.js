import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireScannerKey } from '../middleware/auth.js';
import { Product } from '../models/Product.js';
import { ScanHistory } from '../models/ScanHistory.js';

const router = Router();

const ingestSchema = z.object({
  qrCode: z.string().min(1).max(255),
  source: z.string().max(120).optional().default('camera-stream'),
  cameraUrl: z.string().max(500).optional().default('')
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const items = await ScanHistory.find()
      .populate('product')
      .sort({ scannedAt: -1 })
      .limit(limit);

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const [total, matched, unmatched, recent] = await Promise.all([
      ScanHistory.countDocuments(),
      ScanHistory.countDocuments({ matched: true }),
      ScanHistory.countDocuments({ matched: false }),
      ScanHistory.find().sort({ scannedAt: -1 }).limit(1)
    ]);

    res.json({ total, matched, unmatched, lastScan: recent[0] || null });
  } catch (error) {
    next(error);
  }
});

router.post('/ingest', requireScannerKey, async (req, res, next) => {
  try {
    const data = ingestSchema.parse(req.body);
    const product = await Product.findOne({ qrCode: data.qrCode, isActive: true });

    const scan = await ScanHistory.create({
      qrCode: data.qrCode,
      product: product?._id || null,
      matched: Boolean(product),
      source: data.source,
      cameraUrl: data.cameraUrl,
      productSnapshot: product
        ? {
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: product.price
          }
        : undefined
    });

    res.status(201).json({ scan, product });
  } catch (error) {
    next(error);
  }
});

export default router;
