import { Either, left, right } from '@/core/either'
import { faker } from '@faker-js/faker'
// import { ExampleGateway, ExampleGatewayResponse } from '@/domain/DOMAIN_NAME/application/gateways/example/example-gateway'

// One Faker<System>Gateway per gateway abstract, generating realistic data
// with @faker-js/faker instead of hardcoded literals. Use these in use-case
// and orchestrator unit tests instead of hitting the real HTTP client.
export class FakerExampleGateway /* implements ExampleGateway */ {
  public shouldFail: boolean = false
  public shouldReturnEmpty: boolean = false
  public override: Record<string, unknown> = {}

  async doSomething(input: string): Promise<Either<Error, unknown>> {
    if (this.shouldFail) return left(new Error())

    return right({
      id: !this.shouldReturnEmpty ? faker.string.uuid() : '',
      name: !this.shouldReturnEmpty ? faker.person.fullName() : '',
      ...this.override,
    })
  }
}
