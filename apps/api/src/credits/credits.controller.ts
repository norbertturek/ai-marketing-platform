import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreditsService } from './credits.service';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get()
  async getCredits(@CurrentUser() user: AuthenticatedUser) {
    const [balance, usage] = await Promise.all([
      this.creditsService.getBalance(user.userId),
      this.creditsService.getUsageHistory(user.userId),
    ]);
    return { balance, usage };
  }
}
