import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorator/auth.decorator';
import { Role } from '../../users/enums/role.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Access Denied: User missing role');
    }

    const userEntity = user as User;

    if (
      requiredRoles &&
      !requiredRoles.some((role) => userEntity.role === role)
    )
      return false;
    if (requiredPermissions) {
      const capabilities: Record<Role, string[]> = {
        [Role.ADMIN]: [
          'users:create',
          'users:read',
          'users:update',
          'users:delete',
          '*',
        ],
        [Role.RH]: ['users:read'],
        [Role.MANAGER]: [],
        [Role.CANDIDATE]: [],
      };
      const granted = capabilities[userEntity.role] ?? [];
      if (
        !requiredPermissions.every(
          (permission) => granted.includes('*') || granted.includes(permission),
        )
      )
        return false;
    }
    return true;
  }
}
