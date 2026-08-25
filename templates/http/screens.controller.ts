import { Logger } from '@/core/interfaces/logger'
import { FlowsScreensOrchestratorService } from '@/domain/DOMAIN_NAME/application/navigation/flows-screens-orchestrator'
import { DecryptionError } from '@/domain/DOMAIN_NAME/application/errors/decryption-error'
import { InvalidScreenNameError } from '@/domain/DOMAIN_NAME/application/errors/invalid-screen-name-error'
import { EnvService } from '@/infra/env/env.service'
import {
  Controller,
  Post,
  HttpCode,
  Body,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '../pipe/zod-validation-pipe'

export const screensBodySchema = z
  .object({
    encrypted_aes_key: z.string(),
    encrypted_flow_data: z.string(),
    initial_vector: z.string(),
  })
  .required()

export type ScreensBodySchema = z.infer<typeof screensBodySchema>

const bodyValidationPipe = new ZodValidationPipe(screensBodySchema)

// One endpoint for every screen in the Flow. WhatsApp Flows always POSTs to a
// single URL — the orchestrator (not this controller) decides what happens next.
@Controller()
export class ScreensController {
  constructor(
    private readonly logger: Logger,
    private readonly flowsScreensOrchestratorService: FlowsScreensOrchestratorService,
    private readonly envService: EnvService,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  @Post()
  @HttpCode(200)
  async handle(@Body(bodyValidationPipe) bodyRequest: ScreensBodySchema) {
    this.logger.verbose(`Screen data request:\n${JSON.stringify(bodyRequest, null, 2)}`)

    const privatePem = this.envService.get('PRIVATE_PEM')
    const version = this.envService.get('VERSION_FLOWS_API')

    const result = await this.flowsScreensOrchestratorService.execute({ bodyRequest, privatePem, version })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        // Meta requires a 421 for a decrypt failure so it re-fetches the public key.
        case DecryptionError:
          throw new HttpException(error.message, 421)
        case InvalidScreenNameError:
          throw new BadRequestException(error.message)
        default:
          throw new InternalServerErrorException(error.message)
      }
    }

    return result.value
  }
}
