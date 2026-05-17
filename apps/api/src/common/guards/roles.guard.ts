import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLE_HIERARCHY } from '@pdca/shared';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Acesso negado');

    const userLevel = ROLE_HIERARCHY[user.role as Role] ?? 0;
    const hasRole = requiredRoles.some((role) => userLevel >= ROLE_HIERARCHY[role]);

    if (!hasRole) throw new ForbiddenException('Permissão insuficiente para esta operação');
    return true;
  }
}
