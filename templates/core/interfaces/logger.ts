export abstract class Logger {
  abstract log(message: string): void
  abstract error(message: string): void
  abstract warn(message: string): void
  abstract verbose(message: string): void
  abstract setContext(context: string): void
}
