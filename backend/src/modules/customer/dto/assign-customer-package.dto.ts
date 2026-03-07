import { ValidateIf, IsUUID } from 'class-validator';

export class AssignCustomerPackageDto {
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4')
  packageId?: string | null;
}
