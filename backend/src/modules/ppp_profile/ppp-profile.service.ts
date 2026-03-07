import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePppProfileDto } from './dto/create-ppp-profile.dto';
import { ListPppProfilesDto } from './dto/list-ppp-profiles.dto';
import { UpdatePppProfileDto } from './dto/update-ppp-profile.dto';

type PppProfilePayload = {
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
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PppProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async listProfiles(query: ListPppProfilesDto): Promise<{
    data: PppProfilePayload[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const where: Prisma.PppProfileWhereInput = {};
    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { profileCode: { contains: keyword, mode: 'insensitive' } },
        { profileName: { contains: keyword, mode: 'insensitive' } },
        { remotePoolName: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [total, data] = await Promise.all([
      this.prisma.pppProfile.count({ where }),
      this.prisma.pppProfile.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: data.map((item) => this.mapProfile(item)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getProfileById(id: string): Promise<PppProfilePayload> {
    const profile = await this.prisma.pppProfile.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException('PPP profile not found');
    }
    return this.mapProfile(profile);
  }

  async createProfile(payload: CreatePppProfileDto): Promise<PppProfilePayload> {
    const created = await this.prisma.pppProfile.create({
      data: {
        profileCode: payload.profileCode.trim().toUpperCase(),
        profileName: payload.profileName.trim(),
        localAddress: payload.localAddress.trim(),
        remotePoolName: payload.remotePoolName.trim(),
        dnsServers: payload.dnsServers?.trim() ?? null,
        onlyOne: payload.onlyOne ?? true,
        routerName: payload.routerName?.trim() ?? null,
        isActive: payload.isActive ?? true,
      },
    });
    return this.mapProfile(created);
  }

  async updateProfile(id: string, payload: UpdatePppProfileDto): Promise<PppProfilePayload> {
    await this.ensureProfileExists(id);

    const updated = await this.prisma.pppProfile.update({
      where: { id },
      data: {
        profileCode: payload.profileCode?.trim().toUpperCase(),
        profileName: payload.profileName?.trim(),
        localAddress: payload.localAddress?.trim(),
        remotePoolName: payload.remotePoolName?.trim(),
        dnsServers:
          payload.dnsServers === null
            ? null
            : payload.dnsServers === undefined
              ? undefined
              : payload.dnsServers.trim(),
        onlyOne: payload.onlyOne,
        routerName:
          payload.routerName === null
            ? null
            : payload.routerName === undefined
              ? undefined
              : payload.routerName.trim(),
        isActive: payload.isActive,
      },
    });
    return this.mapProfile(updated);
  }

  async ensureProfileExists(id: string): Promise<void> {
    const exists = await this.prisma.pppProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('PPP profile not found');
    }
  }

  private mapProfile(
    profile: Prisma.PppProfileGetPayload<Record<string, never>>,
  ): PppProfilePayload {
    return {
      ...profile,
      profileIdBusiness: profile.profileCode,
    };
  }
}
