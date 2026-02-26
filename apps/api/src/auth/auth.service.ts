import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthResponse, AuthTokens, JwtPayload } from './auth.types';
import { UsersRepository } from './users.repository';

@Injectable()
export class AuthService {
  private readonly accessTokenSecret =
    process.env.JWT_ACCESS_SECRET ?? 'dev-jwt-access-secret';
  private readonly refreshTokenSecret =
    process.env.JWT_REFRESH_SECRET ?? 'dev-jwt-refresh-secret';
  private readonly accessTokenTtlSeconds = Number.parseInt(
    process.env.JWT_ACCESS_TTL_SECONDS ?? '900',
    10,
  );
  private readonly refreshTokenTtlSeconds = Number.parseInt(
    process.env.JWT_REFRESH_TTL_SECONDS ?? '604800',
    10,
  );
  private readonly bcryptRounds = Number.parseInt(
    process.env.BCRYPT_ROUNDS ?? '12',
    10,
  );

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(params: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(params.password, this.bcryptRounds);

    try {
      const user = await this.usersRepository.createWithPassword({
        email: params.email,
        passwordHash,
      });
      const tokens = await this.issueTokens(user.id, user.email);
      await this.storeRefreshTokenHash(user.id, tokens.refreshToken);
      return {
        user: {
          id: user.id,
          email: user.email,
        },
        tokens,
      };
    } catch (error) {
      if (this.isPrismaUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async signIn(params: { email: string; password: string }): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(params.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(params.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersRepository.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshTokenHash(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      tokens,
    };
  }

  async signOut(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersRepository.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      return;
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      return;
    }

    await this.usersRepository.clearRefreshTokenHash(user.id);
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenTtlSeconds,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshTokenSecret,
        expiresIn: this.refreshTokenTtlSeconds,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async storeRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.bcryptRounds);
    await this.usersRepository.updateRefreshTokenHash(userId, refreshTokenHash);
  }

  private isPrismaUniqueViolation(error: unknown): boolean {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return true;
    }

    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
