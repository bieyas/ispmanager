import bcrypt from "bcryptjs";
import { Prisma, ProspectStatus } from "@ispmanager/db";
import { createInvoiceWithSingleItem, calculateProratedSubscriptionAmount } from "../../lib/billing.js";
import { db } from "../../lib/db.js";
import { calculateFirstPeriod, formatDateYYMMDD, parseDateInput } from "../../lib/date.js";
import { generateTemporaryPassword } from "../../lib/random.js";

type ActivateProspectInput = {
  prospectId: string;
  activatedByUserId: string;
  activationDate: string;
  prorateEnabled: boolean;
  firstDueDateOverride?: string | null;
};

async function generateCustomerCode(tx: Prisma.TransactionClient, installationDate: Date) {
  const datePrefix = formatDateYYMMDD(installationDate);

  const sameDayCount = await tx.customer.count({
    where: {
      activatedFromProspect: {
        installationDate,
      },
    },
  });

  return `${datePrefix}${String(sameDayCount + 1).padStart(3, "0")}`;
}

async function generateSubscriptionNo(tx: Prisma.TransactionClient, customerCode: string) {
  const existingCount = await tx.subscription.count();
  return `SUB-${customerCode}-${String(existingCount + 1).padStart(3, "0")}`;
}

export async function activateProspect(input: ActivateProspectInput) {
  const activationDate = parseDateInput(input.activationDate);
  const firstDueDateOverride = input.firstDueDateOverride ? parseDateInput(input.firstDueDateOverride) : null;

  return db.$transaction(async (tx) => {
    const prospect = await tx.prospect.findFirst({
      where: {
        id: input.prospectId,
        deletedAt: null,
      },
      include: {
        servicePlan: true,
        activatedCustomer: true,
      },
    });

    if (!prospect) {
      throw new Error("Prospect not found");
    }

    if (prospect.status !== ProspectStatus.installed) {
      throw new Error("Only installed prospects can be activated");
    }

    if (prospect.activatedCustomer) {
      throw new Error("Prospect has already been activated");
    }

    if (!prospect.installationDate) {
      throw new Error("Prospect installation date is required for activation");
    }

    const customerCode = await generateCustomerCode(tx, prospect.installationDate);
    const billingAnchorDay = activationDate.getUTCDate();
    const period = calculateFirstPeriod(
      activationDate,
      billingAnchorDay,
      input.prorateEnabled,
      firstDueDateOverride,
    );

    const customer = await tx.customer.create({
      data: {
        customerCode,
        activatedFromProspectId: prospect.id,
        fullName: prospect.fullName,
        identityNo: prospect.identityNo,
        email: prospect.email,
        phone: prospect.phone,
        status: "active",
        activatedAt: new Date(),
        createdByUserId: input.activatedByUserId,
        notes: prospect.notes,
      },
    });

    const address = await tx.customerAddress.create({
      data: {
        customerId: customer.id,
        label: "Alamat Pemasangan",
        addressLine: prospect.addressLine,
        village: prospect.village,
        district: prospect.district,
        city: prospect.city,
        province: prospect.province,
        postalCode: prospect.postalCode,
        latitude: prospect.latitude,
        longitude: prospect.longitude,
        mapPickSource: prospect.mapPickSource,
        isPrimary: true,
      },
    });

    const subscriptionNo = await generateSubscriptionNo(tx, customerCode);

    const subscription = await tx.subscription.create({
      data: {
        customerId: customer.id,
        servicePlanId: prospect.servicePlanId,
        installationAddressId: address.id,
        subscriptionNo,
        status: "active",
        startDate: activationDate,
        installationDate: prospect.installationDate,
        activationDate,
        billingAnchorDay,
        prorateEnabled: input.prorateEnabled,
        firstDueDateOverride,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        billingCycleDay: billingAnchorDay,
        pppoeUsername: prospect.pppoeUsername,
        pppoePassword: prospect.pppoePassword,
        activatedAt: new Date(),
        notes: prospect.notes,
      },
    });

    const temporaryPassword = generateTemporaryPassword(10);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const customerUser = await tx.customerUser.create({
      data: {
        customerId: customer.id,
        username: customerCode,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
    });

    const firstInvoiceAmount = period.isProrated
      ? calculateProratedSubscriptionAmount(
          prospect.servicePlan.priceMonthly,
          period.currentPeriodStart,
          period.currentPeriodEnd,
        )
      : new Prisma.Decimal(prospect.servicePlan.priceMonthly).toDecimalPlaces(2);

    const invoice = await createInvoiceWithSingleItem(tx, {
      subscriptionId: subscription.id,
      customerId: customer.id,
      customerPhone: customer.phone,
      servicePlanName: prospect.servicePlan.name,
      periodStart: period.currentPeriodStart,
      periodEnd: period.currentPeriodEnd,
      issueDate: activationDate,
      dueDate: period.dueDate,
      billingAnchorDate: period.billingAnchorDate,
      amount: firstInvoiceAmount,
      isProrated: period.isProrated,
      generatedAutomatically: true,
      notes: `Invoice awal aktivasi ${subscription.subscriptionNo}`,
    });

    await tx.prospect.update({
      where: { id: prospect.id },
      data: {
        status: "activated",
      },
    });

    return {
      prospect,
      customer,
      address,
      subscription,
      invoice,
      customerUser: {
        id: customerUser.id,
        username: customerUser.username,
        temporaryPassword,
      },
      billing: {
        activationDate,
        billingAnchorDay,
        currentPeriodStart: period.currentPeriodStart,
        currentPeriodEnd: period.currentPeriodEnd,
        dueDate: period.dueDate,
        billingAnchorDate: period.billingAnchorDate,
        isProrated: period.isProrated,
      },
    };
  });
}
