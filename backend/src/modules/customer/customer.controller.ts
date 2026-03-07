import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth_access/guards/access-token.guard';
import { AssignCustomerPackageDto } from './dto/assign-customer-package.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerService } from './customer.service';

@Controller('customers')
@UseGuards(AccessTokenGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  listCustomers(@Query() query: ListCustomersDto) {
    return this.customerService.listCustomers(query);
  }

  @Get(':id')
  getCustomerById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.customerService.getCustomerById(id);
  }

  @Post()
  createCustomer(@Body() payload: CreateCustomerDto) {
    return this.customerService.createCustomer(payload);
  }

  @Patch(':id')
  updateCustomer(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() payload: UpdateCustomerDto,
  ) {
    return this.customerService.updateCustomer(id, payload);
  }

  @Patch(':id/package-assignment')
  assignPackage(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() payload: AssignCustomerPackageDto,
  ) {
    return this.customerService.assignPackage(id, payload);
  }
}
