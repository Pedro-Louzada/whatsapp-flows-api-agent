import { Either } from '@/core/either'

export interface GetMethodParams<TConfig> {
  url: string
  config?: TConfig
}

export interface PostMethodParams<TBody, TConfig> {
  url: string
  data?: TBody
  config?: TConfig
}

export type GatewayResponse<TResponse> = Either<Error, TResponse>

// Generic type at class level: one HTTP client config shape for every method.
export abstract class Gateway<TConfig = unknown> {
  abstract get<TResponse>(params: GetMethodParams<TConfig>): Promise<GatewayResponse<TResponse>>
  abstract post<TResponse, TBody = unknown>(params: PostMethodParams<TBody, TConfig>): Promise<GatewayResponse<TResponse>>
}
