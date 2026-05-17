import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditAction } from '@pdca/database';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto, ip?: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('E-mail já cadastrado');

    const slug = dto.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    const existingOrg = await this.prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) throw new ConflictException('Organização com este nome já existe');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        slug,
        users: {
          create: {
            email: dto.email,
            name: dto.name,
            passwordHash,
            role: 'ADMIN',
            emailVerified: true,
          },
        },
      },
      include: { users: true },
    });

    const user = org.users[0];
    await this.createAuditLog(user.id, null, AuditAction.CREATE, 'users', user.id, ip);

    const token = this.generateAccessToken(user, org.id);
    const { refreshToken } = await this.generateRefreshToken(user.id);

    return {
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        organizationId: org.id,
        organizationName: org.name,
        organizationSlug: org.slug,
      },
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user || !user.isActive)
      throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.createAuditLog(user.id, null, AuditAction.LOGIN, 'users', user.id, ip, { userAgent });

    const token = this.generateAccessToken(user, user.organizationId);
    const { refreshToken } = await this.generateRefreshToken(user.id);

    return {
      accessToken: token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationSlug: user.organization.slug,
      },
    };
  }

  async refresh(refreshToken: string) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { organization: true } } },
    });

    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    const user = token.user;
    const accessToken = this.generateAccessToken(user, user.organizationId);
    const { refreshToken: newRefreshToken } = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationSlug: user.organization.slug,
      },
    };
  }

  async logout(refreshToken: string, userId: string, ip?: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId },
      data: { revokedAt: new Date() },
    });
    await this.createAuditLog(userId, null, AuditAction.LOGOUT, 'users', userId, ip);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { organization: true },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      organizationSlug: user.organization.slug,
    };
  }

  private generateAccessToken(user: { id: string; email: string; role: string }, orgId: string) {
    const payload = { sub: user.id, email: user.email, role: user.role, orgId };
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
    });
  }

  private async generateRefreshToken(userId: string) {
    const token = require('crypto').randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return { refreshToken: token };
  }

  private async createAuditLog(
    userId: string | null,
    projectId: string | null,
    action: AuditAction,
    resource: string,
    resourceId: string,
    ip?: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        projectId,
        action,
        resource,
        resourceId,
        metadata: { ip, ...metadata },
      },
    });
  }
}
