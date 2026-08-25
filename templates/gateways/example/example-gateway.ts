import { Either } from '@/core/either'

// One abstract class per external system this Flow talks to. The use case
// depends on this, never on Gateway or GatewayService directly.
export interface ExampleGatewayResponse {
  // fields this system returns, shaped for domain use
}

export abstract class ExampleGateway {
  abstract doSomething(input: string): Promise<Either<Error, ExampleGatewayResponse>>
}
