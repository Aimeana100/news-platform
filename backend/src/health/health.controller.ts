import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service';
import type { LivenessResponse, ReadinessResponse } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({
    description: 'Service process is running.',
  })
  getLiveness(): LivenessResponse {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (checks dependencies)' })
  @ApiOkResponse({
    description: 'All dependencies are available.',
  })
  @ApiServiceUnavailableResponse({
    description: 'One or more dependencies are unavailable.',
  })
  async getReadiness(): Promise<ReadinessResponse> {
    const response = await this.healthService.getReadiness();
    if (response.status === 'error') {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }
}
