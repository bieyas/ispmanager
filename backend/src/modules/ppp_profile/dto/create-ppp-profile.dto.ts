import { IsBoolean, IsIP, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePppProfileDto {
  @IsString()
  @MaxLength(40)
  profileCode!: string;

  @IsString()
  @MaxLength(120)
  profileName!: string;

  @IsIP()
  localAddress!: string;

  @IsString()
  @MaxLength(120)
  remotePoolName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  dnsServers?: string;

  @IsOptional()
  @IsBoolean()
  onlyOne?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  routerName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
