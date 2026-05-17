export type Role = 'ADMIN' | 'MANAGER' | 'FACILITATOR' | 'MEMBER' | 'VIEWER';

export const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 5,
  MANAGER: 4,
  FACILITATOR: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  FACILITATOR: 'Facilitador',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador',
};

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
