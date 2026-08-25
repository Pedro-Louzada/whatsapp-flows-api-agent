import { Either, left } from '@/core/either'
import { EncryptedBodyRequest } from './encrypted-body'
import { DecryptionError } from '../errors/decryption-error'
import { InvalidScreenNameError } from '../errors/invalid-screen-name-error'
import { Injectable } from '@nestjs/common'
import { ScreenDataResponse } from './screen-data'
import { Decrypter } from '@/core/interfaces/decrypter'
import { Encrypter } from '@/core/interfaces/encrypter'
import { HandleHealthCheckUseCase } from '../use-cases/handle-health-check'
// import each screen's use case here, e.g.:
// import { HandleScreenOneUseCase } from '../use-cases/handle-screen-one'
import { Logger } from '@/core/interfaces/logger'

interface FlowsScreensOrchestratorRequest {
  bodyRequest: EncryptedBodyRequest
  privatePem: string
  version: string
}

type FlowsScreensOrchestratorResponse = Either<InvalidScreenNameError | DecryptionError, string>

// This is the screen navigation control: one place that knows which screen
// maps to which use case. Never let a controller or use case make this decision.
@Injectable()
export class FlowsScreensOrchestratorService {
  constructor(
    private readonly decrypter: Decrypter,
    private readonly encrypter: Encrypter,
    private readonly handleHealthCheck: HandleHealthCheckUseCase,
    // inject each screen's use case here
    private readonly logger: Logger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  async execute({ bodyRequest, privatePem, version }: FlowsScreensOrchestratorRequest): Promise<FlowsScreensOrchestratorResponse> {
    const decryptionResult = this.decrypter.decrypt(bodyRequest, privatePem)

    // Returned via left() because decryptionResult's right side differs from
    // this method's right side — left() lets TS infer the left type and keeps
    // the right type automatic.
    if (decryptionResult.isLeft()) return left(decryptionResult.value)

    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } = decryptionResult.value

    const isPingRequest = decryptedBody?.action === 'ping'

    if (isPingRequest) {
      this.logger.log("Responding to Meta's ping request")
      return this.handleHealthCheck.execute({ version, aesKeyBuffer, initialVectorBuffer })
    }

    let screenResult: Either<Error, any>

    switch (decryptedBody.screen) {
      // case 'SCREEN_ONE':
      //   screenResult = await this.handleScreenOne.execute(decryptedBody.data)
      //   break
      default:
        this.logger.error(`Value '${decryptedBody.screen}' is not a valid screen name`)
        return left(new InvalidScreenNameError(decryptedBody.screen))
    }

    if (screenResult.isLeft()) {
      this.logger.error(`Failed to process logic coming from screen ${decryptedBody.screen}`)
      return screenResult
    }

    this.logger.log('Responding with next screen data')

    const { data, nextScreen } = screenResult.value

    const response: ScreenDataResponse = {
      version: decryptedBody.version,
      data,
      screen: nextScreen,
    }

    this.logger.verbose(JSON.stringify(response.data, null, 2))

    return this.encrypter.encrypt(response, aesKeyBuffer, initialVectorBuffer)
  }
}
