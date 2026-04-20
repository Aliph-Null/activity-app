import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Injects session festival edition id into every Handlebars layout render for sidebar subnav. */
@Injectable()
export class FestivalViewLocalsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data: unknown) => {
        if (data && typeof data === 'object' && !Array.isArray(data) && (data as any).layout) {
          return {
            ...(data as object),
            festivalNavEditionId: req.session?.festivalAdminEditionId ?? null,
          };
        }
        return data;
      }),
    );
  }
}
