import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { type Role } from '@prisma/client';

import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { AuthUser } from './types/auth-user.type';
import { AuthAccessService } from './auth-access.service';

@Controller('auth')
export class AuthAccessController {
  constructor(private readonly authAccessService: AuthAccessService) {}

  @Post('login')
  login(@Body() payload: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      isActive: boolean;
      role: { id: string; name: string };
    };
  }> {
    return this.authAccessService.login(payload);
  }

  @Post('refresh')
  refresh(@Body() payload: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authAccessService.refresh(payload);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<{
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    role: { id: string; name: string };
  }> {
    return this.authAccessService.me(user.sub);
  }

  @Get('roles')
  getRoles(): Promise<Role[]> {
    return this.authAccessService.findRoles();
  }
}
