import { Either, right } from '@/core/either'
import { Logger } from '@/core/interfaces/logger'
import { Injectable } from '@nestjs/common'
import { UseCaseResponse } from './interfaces/use-case-response'
// import the gateway(s) this screen needs to call, e.g.:
// import { ExampleGateway } from '../gateways/example/example-gateway'

interface HandleScreenExampleRequest {
  // fields coming from decryptedBody.data for this screen
}

type HandleScreenExampleResponse = Either<never, UseCaseResponse<Record<string, unknown>>>

// One use case per screen. It talks to gateway(s) for external systems — most
// Flows APIs are pure intermediaries and never touch a database directly.
// If this one does need a DB, that's a deliberate exception, not the default.
@Injectable()
export class HandleScreenExampleUseCase {
  constructor(
    // private readonly exampleGateway: ExampleGateway,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  async execute(request: HandleScreenExampleRequest): Promise<HandleScreenExampleResponse> {
    // const result = await this.exampleGateway.doSomething(request)
    // if (result.isLeft()) {
    //   this.logger.verbose(`Gateway call failed. ${JSON.stringify({ error: result.value }, null, 2)}`)
    //   return right({ data: { /* fallback fields */ }, nextScreen: 'SCREEN_ONE' })
    // }

    return right({
      data: {},
      nextScreen: 'SCREEN_TWO',
    })
  }
}
