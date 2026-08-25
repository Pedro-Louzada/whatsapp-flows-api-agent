export class DecryptionError extends Error {
  constructor() {
    super('Failed to decrypt the request. Please verify your private key.')
    this.name = 'DecryptionError'
  }
}
