import { Injectable } from '@nestjs/common'
import { Encrypter } from '@/core/interfaces/encrypter'
import { Either } from '@/core/either'
import { Logger } from '@/core/interfaces/logger'

interface HandleHealthCheckUseCaseRequest {
  version: string
  aesKeyBuffer: Buffer<ArrayBufferLike>
  initialVectorBuffer: Buffer<ArrayBuffer>
}

type HandleHealthCheckUseCaseResponse = Either<never, string>

// Meta pings this Flow periodically with { action: 'ping' } to check it's alive.
// The orchestrator intercepts pings before screen dispatch — copy as-is.
@Injectable()
export class HandleHealthCheckUseCase {
  constructor(
    private readonly encrypter: Encrypter,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  execute({ version, aesKeyBuffer, initialVectorBuffer }: HandleHealthCheckUseCaseRequest): HandleHealthCheckUseCaseResponse {
    const pingResponse = {
      version,
      data: { status: 'active' },
    }

    return this.encrypter.encrypt(pingResponse, aesKeyBuffer, initialVectorBuffer)
  }
}
