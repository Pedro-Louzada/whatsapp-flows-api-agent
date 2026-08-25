import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { Gateway } from '@/domain/application/gateways/gateway'
import { GatewayService } from './gateway.service'
import { ExampleGateway } from '@/domain/application/gateways/example/example-gateway'
import { HttpExampleGateway } from './example/http-example-gateway'

// Binds the single generic Gateway, plus one binding per external system's
// abstract gateway to its concrete implementation (which reuses Gateway).
@Module({
  imports: [HttpModule],
  providers: [
    { provide: Gateway, useClass: GatewayService },
    { provide: ExampleGateway, useClass: HttpExampleGateway },
  ],
  exports: [Gateway, ExampleGateway],
})
export class GatewaysModule {}
