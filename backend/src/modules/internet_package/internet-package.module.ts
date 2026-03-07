import { Module } from '@nestjs/common';

import { AuthAccessModule } from '../auth_access/auth-access.module';
import { InternetPackageController } from './internet-package.controller';
import { InternetPackageService } from './internet-package.service';

@Module({
  imports: [AuthAccessModule],
  controllers: [InternetPackageController],
  providers: [InternetPackageService],
  exports: [InternetPackageService],
})
export class InternetPackageModule {}
