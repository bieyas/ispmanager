import { PrismaClient } from "../packages/db/generated/client/index.js";
import { createPayment, verifyPaymentAndApplyEffects } from "../apps/api/dist/modules/payments/payment.service.js";

const prisma = new PrismaClient();

function dateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function main() {
  const admin = await prisma.user.findUnique({
    where: { username: "admin" },
    select: { id: true },
  });

  if (!admin) {
    throw new Error("Admin user not found");
  }

  const stamp = `${Date.now()}`;
  const today = dateOnly(new Date());
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  const nextMonth = new Date(today);
  nextMonth.setUTCMonth(today.getUTCMonth() + 1);
  const periodEnd = new Date(nextMonth);
  periodEnd.setUTCDate(nextMonth.getUTCDate() - 1);

  const servicePlan = await prisma.servicePlan.create({
    data: {
      code: `TEST-${stamp}`,
      name: `Test Plan ${stamp}`,
      description: "Temporary plan for payment-cash integration test",
      downloadMbps: 20,
      uploadMbps: 10,
      priceMonthly: 150000,
      isActive: true,
    },
  });

  const prospect = await prisma.prospect.create({
    data: {
      fullName: `Customer Test ${stamp}`,
      phone: `08123${stamp.slice(-7)}`,
      status: "installed",
      servicePlanId: servicePlan.id,
      installationDate: today,
      addressLine: "Jl. Test Payment Cash Flow",
      inputSource: "test",
      createdByUserId: admin.id,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      customerCode: `TST${stamp.slice(-9)}`,
      activatedFromProspectId: prospect.id,
      fullName: prospect.fullName,
      phone: prospect.phone,
      status: "active",
      activatedAt: new Date(),
      createdByUserId: admin.id,
    },
  });

  const address = await prisma.customerAddress.create({
    data: {
      customerId: customer.id,
      label: "Alamat Test",
      addressLine: prospect.addressLine,
      isPrimary: true,
    },
  });

  const subscription = await prisma.subscription.create({
    data: {
      customerId: customer.id,
      servicePlanId: servicePlan.id,
      installationAddressId: address.id,
      subscriptionNo: `SUBTEST-${stamp}`,
      status: "active",
      startDate: today,
      installationDate: today,
      activationDate: today,
      billingAnchorDay: today.getUTCDate(),
      currentPeriodStart: today,
      currentPeriodEnd: periodEnd,
      billingCycleDay: today.getUTCDate(),
      activatedAt: new Date(),
    },
  });

  const subscriptionInvoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNo: `INV-SUB-${stamp}`,
      periodStart: today,
      periodEnd,
      issueDate: today,
      dueDate: tomorrow,
      billingAnchorDate: tomorrow,
      isProrated: false,
      generatedAutomatically: false,
      subtotal: 150000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 150000,
      status: "issued",
      invoiceItems: {
        create: [
          {
            itemType: "subscription_monthly",
            description: "Test subscription invoice",
            qty: 1,
            unitPrice: 150000,
            lineTotal: 150000,
          },
        ],
      },
    },
  });

  const installationInvoice = await prisma.invoice.create({
    data: {
      subscriptionId: subscription.id,
      invoiceNo: `INV-INS-${stamp}`,
      periodStart: today,
      periodEnd: today,
      issueDate: today,
      dueDate: tomorrow,
      billingAnchorDate: tomorrow,
      isProrated: false,
      generatedAutomatically: false,
      subtotal: 250000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 250000,
      status: "issued",
      invoiceItems: {
        create: [
          {
            itemType: "installation_fee",
            description: "Test installation invoice",
            qty: 1,
            unitPrice: 250000,
            lineTotal: 250000,
          },
        ],
      },
    },
  });

  const transferPayment = await createPayment({
    invoiceId: subscriptionInvoice.id,
    paymentDate: today.toISOString().slice(0, 10),
    method: "bank_transfer",
    channel: "bca",
    referenceNo: `TRX-${stamp}`,
    sourceType: "transfer",
    createdByUserId: admin.id,
  });

  const verifiedTransfer = await verifyPaymentAndApplyEffects({
    paymentId: transferPayment.payment.id,
    confirmedByUserId: admin.id,
    notes: "verified by integration test",
  });

  const fieldPayment = await createPayment({
    invoiceId: installationInvoice.id,
    paymentDate: today.toISOString().slice(0, 10),
    method: "cash",
    amount: 250000,
    sourceType: "field_collection",
    collectionNotes: "Collected on site",
    createdByUserId: admin.id,
  });

  const verifiedField = await verifyPaymentAndApplyEffects({
    paymentId: fieldPayment.payment.id,
    confirmedByUserId: admin.id,
    notes: "verified by integration test",
  });

  const cashTransactions = await prisma.cashTransaction.findMany({
    where: {
      paymentId: {
        in: [transferPayment.payment.id, fieldPayment.payment.id],
      },
    },
    include: {
      cashCategory: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(
    JSON.stringify(
      {
        transferPayment: {
          paymentNo: transferPayment.payment.paymentNo,
          invoiceNo: transferPayment.linkedInvoice.invoiceNo,
          invoiceStatusAfterVerify: verifiedTransfer.invoice.status,
          cashTransactionCode: verifiedTransfer.cashTransaction?.transactionNo ?? null,
          cashCategory: cashTransactions.find((item) => item.paymentId === transferPayment.payment.id)?.cashCategory.code,
        },
        fieldCollectionPayment: {
          paymentNo: fieldPayment.payment.paymentNo,
          invoiceNo: fieldPayment.linkedInvoice.invoiceNo,
          invoiceStatusAfterVerify: verifiedField.invoice.status,
          cashTransactionCode: verifiedField.cashTransaction?.transactionNo ?? null,
          cashCategory: cashTransactions.find((item) => item.paymentId === fieldPayment.payment.id)?.cashCategory.code,
        },
        cashTransactions: cashTransactions.map((item) => ({
          transactionNo: item.transactionNo,
          paymentId: item.paymentId,
          category: item.cashCategory.code,
          amount: item.amount.toString(),
          status: item.status,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
