import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { permission_key } from '../decorator/auth.decorator';
import { User } from '../../users/entities/user.entity';
@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(permission_key, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.role || !user.role.permissions) {
            throw new ForbiddenException('Access Denied: User missing role or permissions');
        }

        const userEntity = user as User;

        return requiredPermissions.every((permission) =>
            userEntity.role.permissions.some((p) => p.name === permission)
        );
    }
}