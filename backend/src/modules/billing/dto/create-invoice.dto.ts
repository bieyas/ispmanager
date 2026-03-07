import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID('4')
  customerId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  amountDue!: number;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ISSUED'])
  status?: 'DRAFT' | 'ISSUED';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}
