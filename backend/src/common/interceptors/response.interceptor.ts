import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface ApiResponseFormat {
  Success?: boolean;
  Message?: string;
  Object?: unknown;
  Errors?: unknown;
}

const isApiResponse = (data: unknown): data is ApiResponseFormat => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.Success === 'boolean' &&
    ('Message' in obj || 'Object' in obj || 'Errors' in obj)
  );
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Don't double-wrap if already in ApiResponse format or paginated
        if (data?.__isPaginated || isApiResponse(data)) {
          return data;
        }

        return {
          Success: true,
          Message: data?.message ?? 'Success',
          Object: data?.data ?? data ?? null,
          Errors: null,
        };
      }),
    );
  }
}
