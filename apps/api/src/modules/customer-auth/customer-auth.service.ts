import bcrypt from "bcryptjs";
import { db } from "../../lib/db.js";
import { signAccessToken } from "../../lib/jwt.js";
import type { CustomerLoginInput } from "./customer-auth.schemas.js";

const customerAccountSelect = {
  id: true,
  customerId: true,
  username: true,
  passwordHash: true,
  isActive: true,
  mustChangePassword: true,
  customer: {
    select: {
      id: true,
      customerCode: true,
      fullName: true,
      phone: true,
      status: true,
    },
  },
} as const;

export async function authenticateCustomerUser(input: CustomerLoginInput) {
  const account = await db.customerUser.findUnique({
    where: { username: input.username },
    select: customerAccountSelect,
  });

  if (!account || !account.isActive || account.customer.status === "terminated") {
    return null;
  }

  const passwordValid = await bcrypt.compare(input.password, account.passwordHash);

  if (!passwordValid) {
    return null;
  }

  await db.customerUser.update({
    where: { id: account.id },
    data: {
      lastLoginAt: new Date(),
    },
  });

  const token = signAccessToken({
    sub: account.id,
    username: account.username,
    accountType: "customer",
  });

  return {
    token,
    customer: {
      id: account.id,
      customerId: account.customerId,
      username: account.username,
      mustChangePassword: account.mustChangePassword,
      customer: account.customer,
    },
  };
}

export async function getCurrentCustomer(customerUserId: string) {
  const account = await db.customerUser.findUnique({
    where: { id: customerUserId },
    select: customerAccountSelect,
  });

  if (!account || !account.isActive || account.customer.status === "terminated") {
    return null;
  }

  return {
    id: account.id,
    customerId: account.customerId,
    username: account.username,
    mustChangePassword: account.mustChangePassword,
    customer: account.customer,
  };
}

export async function changeCustomerPassword(input: {
  customerUserId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const account = await db.customerUser.findUnique({
    where: { id: input.customerUserId },
  });

  if (!account || !account.isActive) {
    throw new Error("Customer account not found or inactive");
  }

  const passwordValid = await bcrypt.compare(input.currentPassword, account.passwordHash);

  if (!passwordValid) {
    throw new Error("Current password is invalid");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);

  const updated = await db.customerUser.update({
    where: { id: input.customerUserId },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });

  return {
    id: updated.id,
    customerId: updated.customerId,
    username: updated.username,
    mustChangePassword: updated.mustChangePassword,
  };
}
