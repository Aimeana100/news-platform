import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ApiErrorResponse {
  Success: boolean;
  Message?: string;
  Object?: unknown;
  Errors?: string[] | null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | null = ['An unexpected error occurred.'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as ApiErrorResponse;

        // If already in our format, use those values
        if (res.Success === false) {
          message = res.Message || 'Error occurred';
          errors = res.Errors ?? [message];
        } else {
          // Handle default NestJS format
          const msg = (res as any).message;
          if (typeof msg === 'string') {
            message = msg;
            errors = [msg];
          } else if (Array.isArray(msg)) {
            message = 'Validation failed';
            errors = msg;
          }
        }
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errors = [exceptionResponse];
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      message = 'An unexpected error occurred. Please try again later.';
      errors = [message];
    }

    response.status(status).json({
      Success: false,
      Message: message,
      Object: null,
      Errors: errors,
    });
  }
}
