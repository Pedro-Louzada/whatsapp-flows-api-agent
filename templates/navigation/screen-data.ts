import { ScreenAllowed } from './decrypted-body'

export interface ScreenDataResponse {
  version?: string
  screen?: ScreenAllowed
  data?: unknown
}
