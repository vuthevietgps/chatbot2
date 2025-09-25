import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  async healthCheck() {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: 'disconnected',
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      },
      cpu: process.cpuUsage(),
    };

    // Check database connection
    try {
      if (this.connection.readyState === 1) {
        healthStatus.database = 'connected';
      } else {
        healthStatus.database = 'connecting';
      }
    } catch (error) {
      healthStatus.database = 'error';
      healthStatus.status = 'degraded';
    }

    return healthStatus;
  }

  @Get('ready')
  async readinessCheck() {
    // Check if all critical services are ready
    const checks = {
      database: this.connection.readyState === 1,
      openai: !!process.env.OPENAI_API_KEY,
      facebook: !!process.env.FACEBOOK_VERIFY_TOKEN,
    };

    const isReady = Object.values(checks).every(Boolean);

    return {
      status: isReady ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  async livenessCheck() {
    // Simple liveness check
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}