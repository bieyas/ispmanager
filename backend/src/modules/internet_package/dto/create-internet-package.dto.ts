import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateInternetPackageDto {
  @IsString()
  @MaxLength(40)
  packageCode!: string;

  @IsString()
  @MaxLength(120)
  packageName!: string;

  @IsInt()
  @Min(1)
  downloadKbps!: number;

  @IsInt()
  @Min(1)
  uploadKbps!: number;

  @IsInt()
  @Min(0)
  monthlyPrice!: number;

  @IsUUID('4')
  pppProfileId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
