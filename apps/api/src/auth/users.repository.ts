import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createWithPassword(data: {
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
      },
    });
  }

  updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  clearRefreshTokenHash(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  getStorageCounts(userId: string): Promise<{
    storageImageCount: number;
    storageVideoCount: number;
  }> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { storageImageCount: true, storageVideoCount: true },
    });
  }

  addStorageMedia(
    userId: string,
    imageDelta: number,
    videoDelta: number,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          storageImageCount: true,
          storageVideoCount: true,
        },
      });
      const newImageCount = Math.max(0, user.storageImageCount + imageDelta);
      const newVideoCount = Math.max(0, user.storageVideoCount + videoDelta);
      await tx.user.update({
        where: { id: userId },
        data: {
          storageImageCount: newImageCount,
          storageVideoCount: newVideoCount,
        },
      });
    });
  }
}
