import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth_access/guards/access-token.guard';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Controller('billing/invoices')
@UseGuards(AccessTokenGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  listInvoices(@Query() query: ListInvoicesDto) {
    return this.billingService.listInvoices(query);
  }

  @Get(':id')
  getInvoiceById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Post()
  createInvoice(@Body() payload: CreateInvoiceDto) {
    return this.billingService.createInvoice(payload);
  }

  @Post(':id/payments')
  recordPayment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() payload: RecordPaymentDto,
  ) {
    return this.billingService.recordPayment(id, payload);
  }
}
