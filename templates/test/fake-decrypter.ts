import { Either, left, right } from '@/core/either'
import { Decrypter, DecrypterResponse } from '@/core/interfaces/decrypter'
import { DecryptionError } from '@/domain/application/errors/decryption-error'
import { ScreenAllowed } from '@/domain/application/navigation/decrypted-body'
import { EncryptedBodyRequest } from '@/domain/application/navigation/encrypted-body'

export class FakeDecrypter implements Decrypter {
  public shouldFail: boolean = false
  public isPingRequest: boolean = false
  public screen: ScreenAllowed = 'SCREEN_ONE'
  public data: any = {}

  decrypt(bodyRequest: EncryptedBodyRequest, privatePem: string): Either<DecryptionError, DecrypterResponse> {
    if (this.shouldFail) return left(new DecryptionError())

    return right({
      decryptedBody: {
        version: '3.0',
        screen: this.screen,
        action: this.isPingRequest ? 'ping' : 'data_exchange',
        flow_token: 'fake-token',
        data: this.data,
      },
      aesKeyBuffer: Buffer.alloc(16),
      initialVectorBuffer: Buffer.alloc(16),
    })
  }
}
