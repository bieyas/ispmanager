import { IsBoolean, IsIP, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePppProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  profileCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  profileName?: string;

  @IsOptional()
  @IsIP()
  localAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  remotePoolName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  dnsServers?: string | null;

  @IsOptional()
  @IsBoolean()
  onlyOne?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  routerName?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
