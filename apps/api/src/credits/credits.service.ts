import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { CreditUsage, Prisma } from '@prisma/client';
import { CreditsRepository } from './credits.repository';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(private readonly creditsRepository: CreditsRepository) {}

  async getBalance(userId: string): Promise<number> {
    return this.creditsRepository.getBalance(userId);
  }

  async deductAndLog(
    userId: string,
    cost: number,
    action: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<number> {
    const balance = await this.creditsRepository.getBalance(userId);
    if (balance < cost) {
      throw new ForbiddenException(
        `Insufficient credits: have ${balance}, need ${cost}`,
      );
    }

    const newBalance = await this.creditsRepository.deduct(userId, cost);

    await this.creditsRepository.logUsage({
      userId,
      action,
      creditsCost: cost,
      metadata,
    });

    this.logger.log('Credits deducted', {
      userId,
      action,
      cost,
      newBalance,
      metadata,
    });

    return newBalance;
  }

  async getUsageHistory(userId: string): Promise<CreditUsage[]> {
    return this.creditsRepository.getUsageHistory(userId);
  }
}
