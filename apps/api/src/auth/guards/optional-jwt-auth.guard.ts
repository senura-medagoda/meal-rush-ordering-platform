import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload, OptionalAuthRequest } from '../types';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<OptionalAuthRequest>();
    const token = req.cookies?.['access_token'];

    if (token) {
      try {
        req.user = await this.jwt.verifyAsync<JwtPayload>(token);
      } catch {
        // invalid or expired token: continue as a guest
      }
    }
    return true;
  }
}