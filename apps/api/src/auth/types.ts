import type { Request } from 'express';
import type { Role } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  role: Role;
}

export type AuthenticatedRequest = Request & { user: JwtPayload };
export type OptionalAuthRequest = Request & { user?: JwtPayload };