import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { Product } from '../models/Product.js';

const router = Router();

const productSchema = z.object({
  name: z.string().min(2).max(120),
  sku: z.string().min(2).max(60),
  qrCode: z.string().min(1).max(255),
  category: z.string().min(2).max(80),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  description: z.string().max(1000).optional().default(''),
  imageUrl: z.string().url().optional().or(z.literal('')).default(''),
  isActive: z.boolean().optional().default(true)
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const query = search
      ? { $text: { $search: search } }
      : {};

    const [items, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),
      Product.countDocuments(query)
    ]);

    res.json({ items, total, page: pageNumber, pages: Math.ceil(total / limitNumber) || 1 });
  } catch (error) {
    next(error);
  }
});

router.get('/qr/:qrCode', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findOne({ qrCode: req.params.qrCode });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await Product.create({ ...data, sku: data.sku.toUpperCase() });
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    if (data.sku) data.sku = data.sku.toUpperCase();
    const product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
