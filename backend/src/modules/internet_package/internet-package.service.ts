import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateInternetPackageDto } from './dto/create-internet-package.dto';
import { ListInternetPackagesDto } from './dto/list-internet-packages.dto';
import { UpdateInternetPackageDto } from './dto/update-internet-package.dto';

type PppProfileSummary = {
  id: string;
  profileCode: string;
  profileIdBusiness: string;
  profileName: string;
  localAddress: string;
  remotePoolName: string;
  dnsServers: string | null;
  onlyOne: boolean;
  routerName: string | null;
  isActive: boolean;
};

type InternetPackagePayload = {
  id: string;
  packageCode: string;
  packageIdBusiness: string;
  packageName: string;
  downloadKbps: number;
  uploadKbps: number;
  monthlyPrice: number;
  pppProfileId: string;
  pppProfile: PppProfileSummary;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class InternetPackageService {
  constructor(private readonly prisma: PrismaService) {}

  async listPackages(query: ListInternetPackagesDto): Promise<{
    data: InternetPackagePayload[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const where: Prisma.InternetPackageWhereInput = {};
    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { packageCode: { contains: keyword, mode: 'insensitive' } },
        { packageName: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [total, packages] = await Promise.all([
      this.prisma.internetPackage.count({ where }),
      this.prisma.internetPackage.findMany({
        where,
        skip,
        take: query.pageSize,
        include: { pppProfile: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: packages.map((item) => this.mapPackage(item)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getPackageById(id: string): Promise<InternetPackagePayload> {
    const item = await this.prisma.internetPackage.findUnique({
      where: { id },
      include: { pppProfile: true },
    });
    if (!item) {
      throw new NotFoundException('Package not found');
    }
    return this.mapPackage(item);
  }

  async createPackage(payload: CreateInternetPackageDto): Promise<InternetPackagePayload> {
    await this.ensureProfileExists(payload.pppProfileId);

    const created = await this.prisma.internetPackage.create({
      data: {
        packageCode: payload.packageCode.trim().toUpperCase(),
        packageName: payload.packageName.trim(),
        downloadKbps: payload.downloadKbps,
        uploadKbps: payload.uploadKbps,
        monthlyPrice: payload.monthlyPrice,
        pppProfileId: payload.pppProfileId,
        isActive: payload.isActive ?? true,
      },
      include: { pppProfile: true },
    });
    return this.mapPackage(created);
  }

  async updatePackage(id: string, payload: UpdateInternetPackageDto): Promise<InternetPackagePayload> {
    await this.ensurePackageExists(id);
    if (payload.pppProfileId) {
      await this.ensureProfileExists(payload.pppProfileId);
    }

    const updated = await this.prisma.internetPackage.update({
      where: { id },
      data: {
        packageCode: payload.packageCode?.trim().toUpperCase(),
        packageName: payload.packageName?.trim(),
        downloadKbps: payload.downloadKbps,
        uploadKbps: payload.uploadKbps,
        monthlyPrice: payload.monthlyPrice,
        pppProfileId: payload.pppProfileId,
        isActive: payload.isActive,
      },
      include: { pppProfile: true },
    });
    return this.mapPackage(updated);
  }

  async ensurePackageExists(id: string): Promise<void> {
    const exists = await this.prisma.internetPackage.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Package not found');
    }
  }

  private async ensureProfileExists(id: string): Promise<void> {
    const exists = await this.prisma.pppProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('PPP profile not found');
    }
  }

  private mapPackage(
    item: Prisma.InternetPackageGetPayload<{
      include: { pppProfile: true };
    }>,
  ): InternetPackagePayload {
    return {
      ...item,
      packageIdBusiness: item.packageCode,
      pppProfile: {
        ...item.pppProfile,
        profileIdBusiness: item.pppProfile.profileCode,
      },
    };
  }
}
