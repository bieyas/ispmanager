import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceSource, InvoiceStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

type InvoicePayload = {
  id: string;
  invoiceCode: string;
  invoiceIdBusiness: string;
  customerId: string;
  billingYear: number;
  billingMonth: number;
  source: InvoiceSource;
  amountDue: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate: Date;
  issuedAt: Date;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    customerCode: string;
    customerIdBusiness: string;
    fullName: string;
  };
  payments: {
    id: string;
    amount: number;
    paidAt: Date;
    paymentMethod: string | null;
    referenceNumber: string | null;
    notes: string | null;
    createdAt: Date;
  }[];
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyOverdueCron(): Promise<void> {
    try {
      const result = await this.runDailyOverdueJob();
      this.logger.log(`Daily overdue job completed: ${result.updated} invoice(s) marked OVERDUE`);
    } catch (error) {
      this.logger.error('Daily overdue job failed', error instanceof Error ? error.stack : undefined);
    }
  }

  @Cron('0 2 1 * *')
  async handleMonthlyGenerationCron(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.runMonthlyGenerationJob(now.getUTCFullYear(), now.getUTCMonth() + 1);
      this.logger.log(
        `Monthly generation job completed (${result.year}-${result.month}): created ${result.created}, skipped ${result.skipped}`,
      );
    } catch (error) {
      this.logger.error(
        'Monthly generation job failed',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async listInvoices(query: ListInvoicesDto): Promise<{
    data: InvoicePayload[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const where: Prisma.InvoiceWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { invoiceCode: { contains: keyword, mode: 'insensitive' } },
        { notes: { contains: keyword, mode: 'insensitive' } },
        { customer: { customerCode: { contains: keyword, mode: 'insensitive' } } },
        { customer: { fullName: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [total, rows] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: query.pageSize,
        include: {
          customer: {
            select: {
              id: true,
              customerCode: true,
              fullName: true,
            },
          },
          payments: {
            orderBy: { paidAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: rows.map((item) => this.mapInvoice(item)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getInvoiceById(id: string): Promise<InvoicePayload> {
    const row = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
      },
    });
    if (!row) {
      throw new NotFoundException('Invoice not found');
    }
    return this.mapInvoice(row);
  }

  async createInvoice(payload: CreateInvoiceDto): Promise<InvoicePayload> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.customerId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const dueDate = new Date(payload.dueDate);
    const billingYear = dueDate.getUTCFullYear();
    const billingMonth = dueDate.getUTCMonth() + 1;
    const code = await this.generateInvoiceCode();
    const created = await this.prisma.invoice.create({
      data: {
        invoiceCode: code,
        customerId: payload.customerId,
        billingYear,
        billingMonth,
        source: 'MANUAL',
        amountDue: payload.amountDue,
        amountPaid: 0,
        status: payload.status ?? 'ISSUED',
        dueDate,
        notes: payload.notes?.trim() ?? null,
      },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            fullName: true,
          },
        },
        payments: true,
      },
    });

    return this.mapInvoice(created);
  }

  async recordPayment(invoiceId: string, payload: RecordPaymentDto): Promise<InvoicePayload> {
    await this.ensureInvoiceExists(invoiceId);

    await this.prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: payload.amount,
          paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
          paymentMethod: payload.paymentMethod?.trim() ?? null,
          referenceNumber: payload.referenceNumber?.trim() ?? null,
          notes: payload.notes?.trim() ?? null,
        },
      });

      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        select: { amountDue: true, amountPaid: true },
      });
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      const nextPaid = invoice.amountPaid + payload.amount;
      const nextStatus: InvoiceStatus = nextPaid >= invoice.amountDue ? 'PAID' : 'ISSUED';
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: nextPaid,
          status: nextStatus,
          paidAt: nextStatus === 'PAID' ? new Date() : null,
        },
      });
    });

    return this.getInvoiceById(invoiceId);
  }

  async runDailyOverdueJob(referenceDate = new Date()): Promise<{
    checkedAt: string;
    updated: number;
  }> {
    const result = await this.prisma.invoice.updateMany({
      where: {
        status: {
          in: ['ISSUED'],
        },
        dueDate: {
          lt: referenceDate,
        },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return {
      checkedAt: referenceDate.toISOString(),
      updated: result.count,
    };
  }

  async runMonthlyGenerationJob(year: number, month: number): Promise<{
    year: number;
    month: number;
    created: number;
    skipped: number;
  }> {
    const customers = await this.prisma.customer.findMany({
      where: {
        isActive: true,
        currentPackageId: { not: null },
        currentPackage: {
          isActive: true,
        },
      },
      include: {
        currentPackage: {
          select: {
            id: true,
            packageCode: true,
            monthlyPrice: true,
          },
        },
      },
    });

    let created = 0;
    let skipped = 0;

    for (const customer of customers) {
      if (!customer.currentPackage) {
        skipped += 1;
        continue;
      }

      const autoCode = `INV-${year}${String(month).padStart(2, '0')}-AUTO-${customer.customerCode}`;
      const dueDate = new Date(Date.UTC(year, month - 1, 10, 0, 0, 0));

      await this.prisma.invoice
        .create({
          data: {
            invoiceCode: autoCode,
            customerId: customer.id,
            billingYear: year,
            billingMonth: month,
            source: 'AUTO',
            amountDue: customer.currentPackage.monthlyPrice,
            amountPaid: 0,
            status: 'ISSUED',
            dueDate,
            notes: `AUTO-GENERATED for ${year}-${String(month).padStart(2, '0')}`,
          },
        })
        .then(() => {
          created += 1;
        })
        .catch((error: unknown) => {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            skipped += 1;
            return;
          }
          throw error;
        });
    }

    return { year, month, created, skipped };
  }

  private async ensureInvoiceExists(id: string): Promise<void> {
    const exists = await this.prisma.invoice.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Invoice not found');
    }
  }

  private async generateInvoiceCode(): Promise<string> {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const prefix = `INV-${y}${m}`;

    const latest = await this.prisma.invoice.findFirst({
      where: {
        invoiceCode: {
          startsWith: `${prefix}-`,
        },
      },
      orderBy: {
        invoiceCode: 'desc',
      },
      select: { invoiceCode: true },
    });

    const last = latest?.invoiceCode.split('-').pop();
    const next = Number(last ?? '0') + 1;
    return `${prefix}-${String(next).padStart(4, '0')}`;
  }

  private mapInvoice(
    item: Prisma.InvoiceGetPayload<{
      include: {
        customer: {
          select: {
            id: true;
            customerCode: true;
            fullName: true;
          };
        };
        payments: true;
      };
    }>,
  ): InvoicePayload {
    return {
      ...item,
      invoiceIdBusiness: item.invoiceCode,
      customer: {
        ...item.customer,
        customerIdBusiness: item.customer.customerCode,
      },
    };
  }
}
