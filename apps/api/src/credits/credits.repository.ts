import { Injectable } from '@nestjs/common';
import { CreditUsage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreditsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { credits: true },
    });
    return user.credits;
  }

  async deduct(userId: string, amount: number): Promise<number> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
      select: { credits: true },
    });
    return user.credits;
  }

  async logUsage(data: {
    userId: string;
    action: string;
    creditsCost: number;
    metadata?: Prisma.InputJsonValue;
  }): Promise<CreditUsage> {
    return this.prisma.creditUsage.create({ data });
  }

  async getUsageHistory(
    userId: string,
    limit = 20,
  ): Promise<CreditUsage[]> {
    return this.prisma.creditUsage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
