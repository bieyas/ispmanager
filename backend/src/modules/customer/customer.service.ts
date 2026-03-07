import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AssignCustomerPackageDto } from './dto/assign-customer-package.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

type CurrentPackageSummary = {
  id: string;
  packageCode: string;
  packageIdBusiness: string;
  packageName: string;
  downloadKbps: number;
  uploadKbps: number;
  monthlyPrice: number;
  pppProfileId: string;
  isActive: boolean;
};

type CustomerPayload = {
  id: string;
  customerCode: string;
  customerIdBusiness: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  currentPackage: CurrentPackageSummary | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(query: ListCustomersDto): Promise<{
    data: CustomerPayload[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const where: Prisma.CustomerWhereInput = {};
    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { customerCode: { contains: keyword, mode: 'insensitive' } },
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: query.pageSize,
        include: {
          currentPackage: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: customers.map((item) => this.mapCustomer(item)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getCustomerById(id: string): Promise<CustomerPayload> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { currentPackage: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return this.mapCustomer(customer);
  }

  createCustomer(payload: CreateCustomerDto): Promise<CustomerPayload> {
    return this.prisma.customer
      .create({
        data: {
          customerCode: payload.customerCode.trim(),
          fullName: payload.fullName.trim(),
          email: payload.email?.trim().toLowerCase() ?? null,
          phone: payload.phone?.trim() ?? null,
          isActive: payload.isActive ?? true,
        },
        include: { currentPackage: true },
      })
      .then((item) => this.mapCustomer(item));
  }

  async updateCustomer(id: string, payload: UpdateCustomerDto): Promise<CustomerPayload> {
    await this.ensureCustomerExists(id);

    const updated = await this.prisma.customer.update({
      data: {
        customerCode: payload.customerCode?.trim(),
        fullName: payload.fullName?.trim(),
        email:
          payload.email === null
            ? null
            : payload.email === undefined
              ? undefined
              : payload.email.trim().toLowerCase(),
        phone:
          payload.phone === null
            ? null
            : payload.phone === undefined
              ? undefined
              : payload.phone.trim(),
        isActive: payload.isActive,
      },
      where: { id },
      include: { currentPackage: true },
    });
    return this.mapCustomer(updated);
  }

  async assignPackage(customerId: string, payload: AssignCustomerPackageDto): Promise<CustomerPayload> {
    await this.ensureCustomerExists(customerId);

    if (payload.packageId) {
      const packageExists = await this.prisma.internetPackage.findUnique({
        where: { id: payload.packageId },
        select: { id: true },
      });
      if (!packageExists) {
        throw new NotFoundException('Package not found');
      }
    }

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        currentPackageId: payload.packageId ?? null,
      },
      include: { currentPackage: true },
    });
    return this.mapCustomer(updated);
  }

  private async ensureCustomerExists(id: string): Promise<void> {
    const exists = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      throw new NotFoundException('Customer not found');
    }
  }

  async findCustomers(limit = 20): Promise<CustomerPayload[]> {
    const rows = await this.prisma.customer.findMany({
      take: limit,
      include: { currentPackage: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((item) => this.mapCustomer(item));
  }

  private mapCustomer(
    customer: Prisma.CustomerGetPayload<{
      include: { currentPackage: true };
    }>,
  ): CustomerPayload {
    return {
      ...customer,
      customerIdBusiness: customer.customerCode,
      currentPackage: customer.currentPackage
        ? {
            ...customer.currentPackage,
            packageIdBusiness: customer.currentPackage.packageCode,
          }
        : null,
    };
  }
}
