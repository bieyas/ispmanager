const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_ROLES = ['Super Admin', 'NOC', 'Finance', 'CS', 'Teknisi'];

async function main() {
  for (const roleName of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Default role ${roleName}`,
      },
    });
  }

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found after seed');
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@ispmanager.local').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin12345!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'Super Admin',
      isActive: true,
      roleId: superAdminRole.id,
    },
    create: {
      fullName: 'Super Admin',
      email: adminEmail,
      passwordHash,
      isActive: true,
      roleId: superAdminRole.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seed completed. Admin email: ${adminEmail}`);
}

main()
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
