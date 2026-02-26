import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersRepository } from './users.repository';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            createWithPassword: jest.fn(),
            updateRefreshTokenHash: jest.fn(),
            clearRefreshTokenHash: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  it('registers a new user and returns tokens', async () => {
    const createdUser = {
      id: 'user_1',
      email: 'test@example.com',
      passwordHash: 'hash',
      refreshTokenHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies User;

    usersRepository.createWithPassword.mockResolvedValue(createdUser);
    usersRepository.updateRefreshTokenHash.mockResolvedValue(createdUser);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const response = await service.register({
      email: createdUser.email,
      password: 'StrongPass123',
    });

    expect(response.user.email).toBe(createdUser.email);
    expect(response.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('throws conflict when user already exists', async () => {
    usersRepository.createWithPassword.mockRejectedValue({
      code: 'P2002',
      clientVersion: '6.19.2',
      name: 'PrismaClientKnownRequestError',
    });

    await expect(
      service.register({ email: 'taken@example.com', password: 'StrongPass123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws unauthorized when credentials are invalid', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.signIn({ email: 'missing@example.com', password: 'StrongPass123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes tokens for a valid refresh token', async () => {
    const passwordHash = await bcrypt.hash('StrongPass123', 1);
    const refreshTokenHash = await bcrypt.hash('refresh-token', 1);
    const user = {
      id: 'user_1',
      email: 'refresh@example.com',
      passwordHash,
      refreshTokenHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies User;

    jwtService.verifyAsync.mockResolvedValue({
      sub: user.id,
      email: user.email,
    });
    usersRepository.findById.mockResolvedValue(user);
    usersRepository.updateRefreshTokenHash.mockResolvedValue(user);
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const response = await service.refresh('refresh-token');

    expect(response.tokens).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });
});
