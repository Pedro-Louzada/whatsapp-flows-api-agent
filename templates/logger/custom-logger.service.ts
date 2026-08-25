import { Logger } from '@/core/interfaces/logger'
import { ConsoleLogger, Injectable, LogLevel, Scope } from '@nestjs/common'
import { EnvService } from '@/infra/env/env.service'

// TRANSIENT: each injection point gets its own instance, so setContext() below
// doesn't leak between the classes that inject Logger.
@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger implements Logger {
  private levels: LogLevel[]

  constructor(private readonly envService: EnvService) {
    super()

    switch (this.envService.get('NODE_ENV')) {
      case 'production':
      case 'staging':
        this.levels = ['log', 'error', 'warn']
        break
      default:
        this.levels = ['log', 'error', 'warn', 'debug', 'verbose']
    }

    this.setLogLevels(this.levels)
  }
}
