import { Module } from '@nestjs/common'
import { Encrypter } from '@/core/interfaces/encrypter'
import { Decrypter } from '@/core/interfaces/decrypter'
import { MetaEncrypter } from './meta-encrypter'
import { MetaDecrypter } from './meta-decrypter'

@Module({
  providers: [
    { provide: Encrypter, useClass: MetaEncrypter },
    { provide: Decrypter, useClass: MetaDecrypter },
  ],
  exports: [Encrypter, Decrypter],
})
export class CryptographyModule {}
