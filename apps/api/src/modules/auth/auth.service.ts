import bcrypt from "bcryptjs";
import { db } from "../../lib/db.js";
import { signAccessToken } from "../../lib/jwt.js";
import type { LoginInput } from "./auth.schemas.js";

export async function authenticateUser(input: LoginInput) {
  const user = await db.user.findUnique({
    where: { username: input.username },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      fullName: true,
      isActive: true,
      role: {
        select: {
          id: true,
          code: true,
          name: true,
          rolePermissions: {
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordValid) {
    return null;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const permissions = user.role.rolePermissions.map((item) => item.permission.key);

  const token = signAccessToken({
    sub: user.id,
    username: user.username,
    accountType: "user",
    roleCode: user.role.code,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
      },
      permissions,
    },
  };
}

export async function getCurrentUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      isActive: true,
      role: {
        select: {
          id: true,
          code: true,
          name: true,
          rolePermissions: {
            select: {
              permission: {
                select: {
                  key: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: {
      id: user.role.id,
      code: user.role.code,
      name: user.role.name,
    },
    permissions: user.role.rolePermissions.map((item) => item.permission.key),
  };
}
