import type { Role } from '../constants/roles';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  orgId: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterDto {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
