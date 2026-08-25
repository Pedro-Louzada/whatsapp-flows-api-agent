import { Either } from '@/core/either'
import { EncryptedBodyRequest } from '@/domain/application/navigation/encrypted-body'
import { DecryptedBody } from '@/domain/application/navigation/decrypted-body'
import { DecryptionError } from '@/domain/application/errors/decryption-error'

export interface DecrypterResponse {
  decryptedBody: DecryptedBody
  aesKeyBuffer: Buffer<ArrayBufferLike>
  initialVectorBuffer: Buffer<ArrayBuffer>
}

// Lives in core (not domain/application) alongside Logger: injected everywhere,
// never customized per client, even though the shape it moves is Flow-specific.
export abstract class Decrypter {
  abstract decrypt(bodyRequest: EncryptedBodyRequest, privatePem: string): Either<DecryptionError, DecrypterResponse>
}
