import * as crypto from 'crypto'
import { Injectable } from '@nestjs/common'

import { Decrypter, DecrypterResponse } from '@/core/interfaces/decrypter'
import { EncryptedBodyRequest } from '@/domain/application/navigation/encrypted-body'
import { DecryptionError } from '@/domain/application/errors/decryption-error'
import { Either, left, right } from '@/core/either'
import { Logger } from '@/core/interfaces/logger'

type MetaDecrypterResponse = Either<DecryptionError, DecrypterResponse>

// Implements Meta's published WhatsApp Flows encryption spec.
// This algorithm is fixed by Meta, not by us — copy verbatim, don't "improve" it.
@Injectable()
export class MetaDecrypter implements Decrypter {
  constructor(private readonly logger: Logger) {
    this.logger.setContext(this.constructor.name)
  }

  decrypt(bodyRequest: EncryptedBodyRequest, privatePem: string): MetaDecrypterResponse {
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = bodyRequest
    let decryptedAesKey: Buffer<ArrayBufferLike>

    try {
      decryptedAesKey = crypto.privateDecrypt(
        {
          key: crypto.createPrivateKey({ key: privatePem }),
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(encrypted_aes_key, 'base64'),
      )
    } catch (error) {
      this.logger.log('Decryption error: ' + (error as Error).message)
      this.logger.error('Failed to decrypt the request. Please verify your private key.')
      return left(new DecryptionError())
    }

    const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64')
    const initialVectorBuffer = Buffer.from(initial_vector, 'base64')
    const TAG_LENGTH = 16
    const encryptedFlowDataBody = flowDataBuffer.subarray(0, -TAG_LENGTH)
    const encryptedFlowDataTag = flowDataBuffer.subarray(-TAG_LENGTH)

    const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVectorBuffer)
    decipher.setAuthTag(encryptedFlowDataTag)

    const decryptedJSONString = Buffer.concat([
      decipher.update(encryptedFlowDataBody),
      decipher.final(),
    ]).toString('utf-8')

    this.logger.log('Successfully decrypted payload sent by WhatsApp Flows')

    return right({
      decryptedBody: JSON.parse(decryptedJSONString),
      aesKeyBuffer: decryptedAesKey,
      initialVectorBuffer,
    })
  }
}
