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

    const err = exception as Record<string, unknown>;
    const statusCode =
      (typeof err?.statusCode === 'number' ? err.statusCode : null) ??
      (typeof err?.status === 'number' ? err.status : null) ??
      HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      (typeof err?.message === 'string' ? err.message : null) ?? 'Internal server error';

    if (statusCode >= 500) {
      this.logger.error(exception);
    }

    response.status(statusCode).json({ statusCode, message });
  }
}
