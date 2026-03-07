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
import { CreateInternetPackageDto } from './dto/create-internet-package.dto';
import { ListInternetPackagesDto } from './dto/list-internet-packages.dto';
import { UpdateInternetPackageDto } from './dto/update-internet-package.dto';
import { InternetPackageService } from './internet-package.service';

@Controller('packages')
@UseGuards(AccessTokenGuard)
export class InternetPackageController {
  constructor(private readonly internetPackageService: InternetPackageService) {}

  @Get()
  listPackages(@Query() query: ListInternetPackagesDto) {
    return this.internetPackageService.listPackages(query);
  }

  @Get(':id')
  getPackageById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.internetPackageService.getPackageById(id);
  }

  @Post()
  createPackage(@Body() payload: CreateInternetPackageDto) {
    return this.internetPackageService.createPackage(payload);
  }

  @Patch(':id')
  updatePackage(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() payload: UpdateInternetPackageDto,
  ) {
    return this.internetPackageService.updatePackage(id, payload);
  }
}
