import { Logger } from '@/core/interfaces/logger'

// Empty on purpose — keeps test output clean.
export class FakerLogger extends Logger {
  log(message: string): void {}
  error(message: string): void {}
  warn(message: string): void {}
  verbose(message: string): void {}
  setContext(context: string): void {}
}
