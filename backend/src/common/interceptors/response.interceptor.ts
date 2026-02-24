import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If controller already formatted (like pagination), don't double-wrap
        if (data?.__isPaginated) {
          return {
            Success: true,
            Message: data.message ?? 'Success',
            Object: data.data,
            PageNumber: data.pageNumber,
            PageSize: data.pageSize,
            TotalSize: data.totalSize,
            Errors: null,
          };
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
