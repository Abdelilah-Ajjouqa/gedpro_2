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
import { AuthorizationService } from '../authorization.service';

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
      const aliases: Record<string, string> = {
        'users:create': 'users:manage',
        'users:update': 'users:manage',
        'users:delete': 'users:manage',
      };
      const granted = new Set(
        AuthorizationService.capabilitiesFor(userEntity.role),
      );
      const allowed = requiredPermissions.every((permission) => {
        const canonical = aliases[permission] ?? permission;
        if (granted.has(canonical as never)) return true;
        return (
          canonical.startsWith('applications:') &&
          canonical !== 'applications:read' &&
          granted.has('applications:write')
        );
      });
      if (!allowed) return false;
    }
    return true;
  }
}
