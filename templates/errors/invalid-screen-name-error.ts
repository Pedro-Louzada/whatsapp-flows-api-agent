export class InvalidScreenNameError extends Error {
  constructor(screen: string) {
    super(`"${screen}" is not a valid screen name`)
    this.name = 'InvalidScreenNameError'
  }
}
