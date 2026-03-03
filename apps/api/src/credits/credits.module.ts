import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsRepository } from './credits.repository';
import { CreditsService } from './credits.service';

@Module({
  controllers: [CreditsController],
  providers: [CreditsRepository, CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
