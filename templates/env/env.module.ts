import { Global, Module } from '@nestjs/common'
import { EnvService } from './env.service'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env'

// Global so EnvService is injectable anywhere without re-importing this module.
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => envSchema.parse(config),
      isGlobal: true,
    }),
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
