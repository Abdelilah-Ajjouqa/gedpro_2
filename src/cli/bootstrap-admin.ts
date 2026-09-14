import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../database/data-source';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME?.trim() || 'GEDPro';
  const lastName = process.env.ADMIN_LAST_NAME?.trim() || 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters');
  }

  await dataSource.initialize();
  try {
    const repository = dataSource.getRepository(User);
    const existing = await repository.findOne({ where: { email } });
    if (existing) {
      console.log(`Admin already exists: ${email}`);
      return;
    }

    const admin = repository.create({
      email,
      password: await bcrypt.hash(password, 12),
      firstName,
      lastName,
      role: Role.ADMIN,
      isActive: true,
    });
    await repository.save(admin);
    console.log(`Admin created: ${email}`);
  } finally {
    await dataSource.destroy();
  }
}

bootstrapAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Admin bootstrap failed: ${message}`);
  process.exitCode = 1;
});
