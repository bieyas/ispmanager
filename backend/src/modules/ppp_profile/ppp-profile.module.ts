import { Module } from '@nestjs/common';

import { AuthAccessModule } from '../auth_access/auth-access.module';
import { PppProfileController } from './ppp-profile.controller';
import { PppProfileService } from './ppp-profile.service';

@Module({
  imports: [AuthAccessModule],
  controllers: [PppProfileController],
  providers: [PppProfileService],
  exports: [PppProfileService],
})
export class PppProfileModule {}
