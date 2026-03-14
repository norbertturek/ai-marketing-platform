import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type TransactionClient = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

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

  /**
   * Lock user row (FOR UPDATE) and return storage counts. Must be called inside an active transaction.
   */
  async getStorageCountsForUpdate(
    userId: string,
    tx: TransactionClient,
  ): Promise<{ storageImageCount: number; storageVideoCount: number }> {
    const rows = await tx.$queryRaw<
      { storageImageCount: number; storageVideoCount: number }[]
    >`SELECT "storageImageCount", "storageVideoCount" FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const row = rows[0];
    if (!row) {
      throw new Error(`User not found: ${userId}`);
    }
    return row;
  }

  /**
   * Update user storage counts. When tx is provided, runs inside that transaction; otherwise starts its own.
   */
  addStorageMedia(
    userId: string,
    imageDelta: number,
    videoDelta: number,
    tx?: TransactionClient,
  ): Promise<void> {
    const run = (client: TransactionClient) =>
      (async () => {
        const user = await client.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            storageImageCount: true,
            storageVideoCount: true,
          },
        });
        const newImageCount = Math.max(0, user.storageImageCount + imageDelta);
        const newVideoCount = Math.max(0, user.storageVideoCount + videoDelta);
        await client.user.update({
          where: { id: userId },
          data: {
            storageImageCount: newImageCount,
            storageVideoCount: newVideoCount,
          },
        });
      })();

    if (tx) {
      return run(tx);
    }
    return this.prisma.$transaction((prismaTx) =>
      run(prismaTx as TransactionClient),
    );
  }
}
