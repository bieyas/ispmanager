import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { HealthController } from './health.controller';
import { AuthAccessModule } from './modules/auth_access/auth-access.module';
import { BillingModule } from './modules/billing/billing.module';
import { CustomerModule } from './modules/customer/customer.module';
import { InternetPackageModule } from './modules/internet_package/internet-package.module';
import { PppProfileModule } from './modules/ppp_profile/ppp-profile.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthAccessModule,
    BillingModule,
    CustomerModule,
    InternetPackageModule,
    PppProfileModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
