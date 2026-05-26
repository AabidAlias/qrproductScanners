import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

async function seed() {
  const missing = ['adminName', 'adminEmail', 'adminPassword'].filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing admin seed env values: ${missing.join(', ')}`);
  }

  await connectDb();

  const existing = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (existing) {
    console.log(`Admin already exists: ${env.adminEmail}`);
    process.exit(0);
  }

  await User.create({
    name: env.adminName,
    email: env.adminEmail,
    password: env.adminPassword,
    role: 'admin'
  });

  console.log(`Admin created: ${env.adminEmail}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
