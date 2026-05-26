import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(data.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ token: signToken(user), user: safeUser });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
