import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { Gateway } from '@/domain/application/gateways/gateway'
import { ExampleGateway, ExampleGatewayResponse } from '@/domain/application/gateways/example/example-gateway'
import { EnvService } from '@/infra/env/env.service'

// Concrete per-system gateway: injects the generic Gateway and translates its
// raw response into this system's domain shape. Never reimplements HTTP calls.
@Injectable()
export class HttpExampleGateway implements ExampleGateway {
  constructor(
    private readonly gateway: Gateway,
    private readonly envService: EnvService,
  ) {}

  async doSomething(input: string): Promise<Either<Error, ExampleGatewayResponse>> {
    const baseUrl = this.envService.get('EXAMPLE_SYSTEM_BASE_URL')

    const result = await this.gateway.get<ExampleGatewayResponse>({
      url: `${baseUrl}/example/${input}`,
    })

    if (result.isLeft()) return left(result.value)

    return right(result.value)
  }
}
