import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { ApiMetadataResponse } from './app.service';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Service metadata' })
  @ApiOkResponse({
    description: 'Basic service metadata and useful endpoint paths.',
  })
  getMetadata(): ApiMetadataResponse {
    return this.appService.getApiMetadata();
  }
}
