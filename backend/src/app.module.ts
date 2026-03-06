import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthController } from './health.controller';
import { AuthAccessModule } from './modules/auth_access/auth-access.module';
import { CustomerModule } from './modules/customer/customer.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthAccessModule, CustomerModule],
  controllers: [HealthController],
})
export class AppModule {}
