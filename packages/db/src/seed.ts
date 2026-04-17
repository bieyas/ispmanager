import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/client/index.js";
import { cashCategories, permissions, rolePermissions, roles } from "./seed-data.js";

const prisma = new PrismaClient();
const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "ChangeMeBeforeProduction!";

async function seedRoles() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
      },
    });
  }
}

async function seedPermissions() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        description: permission.description,
      },
      create: {
        key: permission.key,
        module: permission.module,
        description: permission.description,
      },
    });
  }
}

async function seedRolePermissions() {
  const dbRoles = await prisma.role.findMany({
    select: { id: true, code: true },
  });
  const dbPermissions = await prisma.permission.findMany({
    select: { id: true, key: true },
  });

  const roleIdByCode = new Map(dbRoles.map((role) => [role.code, role.id]));
  const permissionIdByKey = new Map(dbPermissions.map((permission) => [permission.key, permission.id]));

  for (const [roleCode, permissionKeys] of Object.entries(rolePermissions)) {
    const roleId = roleIdByCode.get(roleCode);

    if (!roleId) {
      throw new Error(`Role not found while seeding role permissions: ${roleCode}`);
    }

    for (const permissionKey of permissionKeys) {
      const permissionId = permissionIdByKey.get(permissionKey);

      if (!permissionId) {
        throw new Error(`Permission not found while seeding role permissions: ${permissionKey}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
  }
}

async function seedCashCategories() {
  for (const category of cashCategories) {
    await prisma.cashCategory.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        type: category.type,
        description: category.description,
        defaultKeteranganTemplate: category.defaultKeteranganTemplate,
        isActive: true,
      },
      create: {
        code: category.code,
        name: category.name,
        type: category.type,
        description: category.description,
        defaultKeteranganTemplate: category.defaultKeteranganTemplate,
        isActive: true,
      },
    });
  }
}

async function seedAdminUser() {
  const adminRole = await prisma.role.findUnique({
    where: { code: "admin" },
    select: { id: true },
  });

  if (!adminRole) {
    throw new Error("Admin role not found while seeding default admin user");
  }

  const existingAdminUser = await prisma.user.findUnique({
    where: { username: "admin" },
    select: { id: true },
  });

  if (existingAdminUser) {
    return;
  }

  const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);

  await prisma.user.create({
    data: {
      roleId: adminRole.id,
      username: "admin",
      passwordHash,
      fullName: "System Administrator",
      email: "admin@localhost",
      isActive: true,
    },
  });
}

async function main() {
  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  await seedCashCategories();
  await seedAdminUser();

  console.log("Database seed completed: roles, permissions, role_permissions, cash_categories, admin_user");
}

main()
  .catch((error) => {
    console.error("Database seed failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
