import {
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (typeof user !== 'object' || user === null || !('userId' in user)) {
      throw new UnauthorizedException();
    }

    const userId = (user as { userId: unknown }).userId;
    const email =
      'email' in user ? (user as { email: unknown }).email : undefined;

    if (typeof userId !== 'string' || typeof email !== 'string') {
      throw new UnauthorizedException();
    }

    return { userId, email };
  },
);
