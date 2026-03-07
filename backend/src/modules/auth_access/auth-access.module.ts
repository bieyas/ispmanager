import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthAccessController } from './auth-access.controller';
import { AuthAccessService } from './auth-access.service';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthAccessController],
  providers: [AuthAccessService, AccessTokenGuard],
  exports: [JwtModule, AccessTokenGuard],
})
export class AuthAccessModule {}
