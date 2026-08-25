import * as crypto from 'crypto'
import { Injectable } from '@nestjs/common'

import { Encrypter } from '@/core/interfaces/encrypter'
import { Either, right } from '@/core/either'
import { ScreenDataResponse } from '@/domain/application/navigation/screen-data'
import { Logger } from '@/core/interfaces/logger'

@Injectable()
export class MetaEncrypter implements Encrypter {
  constructor(private readonly logger: Logger) {
    this.logger.setContext(this.constructor.name)
  }

  encrypt(response: ScreenDataResponse, aesKeyBuffer: Buffer, initialVectorBuffer: Buffer): Either<never, string> {
    // Meta requires the response IV to be the request IV with every bit flipped.
    const flippedIv: Array<number> = []

    for (const pair of initialVectorBuffer.entries()) {
      flippedIv.push(~pair[1])
    }

    const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, Buffer.from(flippedIv))

    this.logger.log('Successfully encrypted payload to send to WhatsApp Flows')

    const result = Buffer.concat([
      cipher.update(JSON.stringify(response), 'utf-8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64')

    return right(result)
  }
}
