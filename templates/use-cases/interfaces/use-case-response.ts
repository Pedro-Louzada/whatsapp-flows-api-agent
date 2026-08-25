import { ScreenAllowed } from '../../navigation/decrypted-body'

// The shared success shape every use case returns inside Either's right side.
// Don't invent a one-off response type per use case — extend this instead.
export interface UseCaseResponse<T> {
  data?: T
  nextScreen?: ScreenAllowed
}
