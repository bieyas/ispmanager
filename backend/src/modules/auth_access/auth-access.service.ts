import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type AdminUser, type Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthUser } from './types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  findRoles(): Promise<Role[]> {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async login(payload: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: ReturnType<AuthAccessService['sanitizeUser']>;
  }> {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: payload.email.toLowerCase().trim() },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(payload: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret-change-me';

    let tokenPayload: AuthUser;
    try {
      tokenPayload = await this.jwtService.verifyAsync<AuthUser>(payload.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.adminUser.findUnique({
      where: { id: tokenPayload.sub },
      include: { role: true },
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshValid = await bcrypt.compare(payload.refreshToken, user.refreshTokenHash);
    if (!refreshValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.issueTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async me(userId: string): Promise<ReturnType<AuthAccessService['sanitizeUser']>> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: AdminUser & { role: Role }): {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    role: { id: string; name: string };
  } {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };
  }

  private async issueTokens(user: AdminUser & { role: Role }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const jwtPayload: AuthUser = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret-change-me';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret-change-me';
    const accessExpiresIn = Number(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS') ?? 900,
    );
    const refreshExpiresIn = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_SECONDS') ?? 604800,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    const refreshTtlDays = Number(this.configService.get<string>('JWT_REFRESH_TTL_DAYS') ?? 7);
    const expiresAt = new Date(Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000);

    await this.prisma.adminUser.update({
      where: { id: userId },
      data: {
        refreshTokenHash: hashed,
        refreshTokenExpiresAt: expiresAt,
      },
    });
  }
}
