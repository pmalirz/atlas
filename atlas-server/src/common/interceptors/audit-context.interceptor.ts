import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
    constructor(private readonly cls: ClsService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user && user.id) {
            this.cls.set('userId', user.id);
        } else {
            this.cls.set('userId', 'anonymous');
        }

        return next.handle();
    }
}
