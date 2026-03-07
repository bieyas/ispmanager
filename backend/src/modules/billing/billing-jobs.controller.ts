import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth_access/guards/access-token.guard';
import { BillingService } from './billing.service';
import { RunMonthlyGenerationDto } from './dto/run-monthly-generation.dto';

@Controller('billing/jobs')
@UseGuards(AccessTokenGuard)
export class BillingJobsController {
  constructor(private readonly billingService: BillingService) {}

  @Post('run-overdue')
  runOverdueJob() {
    return this.billingService.runDailyOverdueJob();
  }

  @Post('run-monthly')
  runMonthlyGeneration(@Body() payload: RunMonthlyGenerationDto) {
    const now = new Date();
    const year = payload.year ?? now.getUTCFullYear();
    const month = payload.month ?? now.getUTCMonth() + 1;
    return this.billingService.runMonthlyGenerationJob(year, month);
  }
}
