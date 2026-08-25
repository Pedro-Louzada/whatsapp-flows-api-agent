import { Either, right } from '@/core/either'
import { Encrypter } from '@/core/interfaces/encrypter'
import { ScreenDataResponse } from '@/domain/DOMAIN_NAME/application/navigation/screen-data'

export class FakeEncrypter implements Encrypter {
  encrypt(response: ScreenDataResponse, aesKeyBuffer: Buffer, initialVectorBuffer: Buffer): Either<never, string> {
    return right('')
  }
}
