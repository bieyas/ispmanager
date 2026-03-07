import { Module } from '@nestjs/common';

import { AuthAccessModule } from '../auth_access/auth-access.module';
import { BillingJobsController } from './billing-jobs.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

@Module({
  imports: [AuthAccessModule],
  controllers: [BillingController, BillingJobsController],
  providers: [BillingService],
})
export class BillingModule {}
