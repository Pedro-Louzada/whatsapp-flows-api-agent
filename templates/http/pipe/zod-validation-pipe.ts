import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import type { ZodSchema } from 'zod'
import { ZodError } from 'zod'
import { fromZodError } from 'zod-validation-error'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value)
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: error.message,
          statusCode: 400,
          errors: fromZodError(error),
        })
      }

      throw new BadRequestException('Validation failed')
    }
  }
}
