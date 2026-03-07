import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateInternetPackageDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  packageCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  packageName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  downloadKbps?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  uploadKbps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsUUID('4')
  pppProfileId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
