import { HttpStatus, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import axios, { AxiosRequestConfig } from 'axios'
import { firstValueFrom, map } from 'rxjs'

import { left, right } from '@/core/either'
import { Logger } from '@/core/interfaces/logger'
import { Gateway, GatewayResponse, GetMethodParams, PostMethodParams } from '@/domain/DOMAIN_NAME/application/gateways/gateway'
import { GatewayRequestError } from '@/domain/DOMAIN_NAME/application/gateways/errors/gateway-request-error'

// The ONE concrete Gateway implementation. Every per-system gateway
// (AddressGateway, DocumentGateway, ...) injects this instead of talking to
// axios/HttpService directly — HTTP error handling lives here, once.
@Injectable()
export class GatewayService implements Gateway<AxiosRequestConfig> {
  constructor(
    private readonly httpService: HttpService,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(this.constructor.name)
  }

  async get<TResponse>({ url, config }: GetMethodParams<AxiosRequestConfig>): Promise<GatewayResponse<TResponse>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, config).pipe(map((response) => response.data)),
      )

      return right(response)
    } catch (error) {
      return left(this.toGatewayRequestError('GET', url, config, error))
    }
  }

  async post<TResponse, TBody = unknown>({ url, data, config }: PostMethodParams<TBody, AxiosRequestConfig>): Promise<GatewayResponse<TResponse>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, config).pipe(map((response) => response.data)),
      )

      return right(response)
    } catch (error) {
      return left(this.toGatewayRequestError('POST', url, config, error))
    }
  }

  private toGatewayRequestError(method: string, url: string, config: unknown, error: unknown): GatewayRequestError {
    if (!axios.isAxiosError(error)) {
      const message = error instanceof Error && error.stack ? error.stack : String(error)
      this.logger.error(`${method} request unexpected failure:\n${JSON.stringify({ message }, null, 2)}`)
      return new GatewayRequestError(message, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    const status = error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR
    const message = error.response?.data?.[0]?.message || error.message || `${method} request failure`

    this.logger.error(
      `${method} request failure:\n${JSON.stringify({ status, message, request: { url, config } }, null, 2)}`,
    )

    return new GatewayRequestError(message, status)
  }
}
