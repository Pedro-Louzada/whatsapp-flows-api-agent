import { Controller, Get } from '@nestjs/common'

// Plain REST probe for infra/uptime checks — separate from Meta's encrypted
// 'ping' action, which the orchestrator handles inside the screens endpoint.
// Always scaffold both.
@Controller('health-check')
export class HealthCheckController {
  @Get()
  async handle() {
    return {
      status: 'UP',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }
}
