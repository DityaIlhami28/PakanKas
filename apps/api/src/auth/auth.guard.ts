import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { getRequiredEnvironmentVariable } from '../config/env';

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export type AuthenticatedRequest = Omit<Request, 'user'> & {
  user: JwtPayload;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token tidak ditemukan! Silakan login.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: getRequiredEnvironmentVariable('ACCESS_TOKEN_SECRET'),
      });

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException(
        'Token tidak valid atau sudah kedaluwarsa!',
      );
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const headerToken = this.extractTokenFromHeader(request);
    if (headerToken) {
      return headerToken;
    }

    const cookies = request.cookies as Record<string, unknown> | undefined;
    const cookieToken = cookies?.access_token;

    return typeof cookieToken === 'string' ? cookieToken : undefined;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [type, token, ...extraParts] = authorization.split(' ');
    return type === 'Bearer' && token && extraParts.length === 0
      ? token
      : undefined;
  }
}
