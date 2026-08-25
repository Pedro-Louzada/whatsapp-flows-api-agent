import { Either } from '@/core/either'
import { ScreenDataResponse } from '@/domain/application/navigation/screen-data'

// Lives in core (not domain/application) alongside Logger: injected everywhere,
// never customized per client, even though the shape it moves is Flow-specific.
export abstract class Encrypter {
  abstract encrypt(response: ScreenDataResponse, aesKeyBuffer: Buffer, initialVectorBuffer: Buffer): Either<never, string>
}
