import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo(): { name: string; version: string; status: string } {
    return {
      name: 'App Atlas API',
      version: '1.0.0',
      status: 'running',
    };
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
