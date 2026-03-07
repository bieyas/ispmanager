import { Module } from '@nestjs/common';

import { AuthAccessModule } from '../auth_access/auth-access.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  imports: [AuthAccessModule],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
