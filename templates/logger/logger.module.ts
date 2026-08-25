import { Global, Module } from '@nestjs/common'
import { CustomLoggerService } from './custom-logger.service'
import { Logger } from '@/core/interfaces/logger'
import { EnvModule } from '@/infra/env/env.module'

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: Logger,
      useClass: CustomLoggerService,
    },
  ],
  exports: [Logger],
})
export class LoggerModule {}
