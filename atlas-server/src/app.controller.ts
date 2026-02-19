import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './modules/auth';

@ApiTags('health')
@Controller()
@Public() // Health endpoints don't require authentication
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'Returns API info' })
  getRoot(): { name: string; version: string; status: string } {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Returns health status' })
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}

