import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcToHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(body);
      return;
    }

    // RpcException sends { statusCode, message } as the error object
    // Non-RpcException gets sanitized by Redis transport to { status: 'error', message: 'Internal server error' }
    const err = (exception && typeof exception === 'object') ? exception as Record<string, unknown> : {};
    const innerErr = (err['error'] && typeof err['error'] === 'object')
      ? err['error'] as Record<string, unknown>
      : err;

    const statusCode =
      (typeof innerErr['statusCode'] === 'number' ? innerErr['statusCode'] : null) ??
      (typeof err['statusCode'] === 'number' ? err['statusCode'] : null) ??
      HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      (typeof innerErr['message'] === 'string' ? innerErr['message'] : null) ??
      (typeof err['message'] === 'string' ? err['message'] : null) ??
      'Internal server error';

    if (statusCode >= 500) {
      this.logger.error(exception);
    }

    response.status(statusCode).json({ statusCode, message });
  }
}
