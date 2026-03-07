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
import { CreatePppProfileDto } from './dto/create-ppp-profile.dto';
import { ListPppProfilesDto } from './dto/list-ppp-profiles.dto';
import { UpdatePppProfileDto } from './dto/update-ppp-profile.dto';
import { PppProfileService } from './ppp-profile.service';

@Controller('ppp-profiles')
@UseGuards(AccessTokenGuard)
export class PppProfileController {
  constructor(private readonly pppProfileService: PppProfileService) {}

  @Get()
  listProfiles(@Query() query: ListPppProfilesDto) {
    return this.pppProfileService.listProfiles(query);
  }

  @Get(':id')
  getProfileById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.pppProfileService.getProfileById(id);
  }

  @Post()
  createProfile(@Body() payload: CreatePppProfileDto) {
    return this.pppProfileService.createProfile(payload);
  }

  @Patch(':id')
  updateProfile(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() payload: UpdatePppProfileDto,
  ) {
    return this.pppProfileService.updateProfile(id, payload);
  }
}
