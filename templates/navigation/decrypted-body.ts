// Single source of truth for every screen this Flow can be in.
// Adding a screen = add it here, add a case in the orchestrator, create its use case.
export type ScreenAllowed =
  | 'SCREEN_ONE'
  | 'SCREEN_TWO'
  | 'SCREEN_THREE'
  // ...one entry per screen in the Flow's navigation map

export interface DecryptedBody {
  version: string
  screen: ScreenAllowed
  action: string
  flow_token: string
  data: any
}
