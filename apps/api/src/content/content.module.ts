import { Module } from '@nestjs/common';
import { CreditsModule } from '../credits/credits.module';
import { ContentController } from './content.controller';
import { OpenAIService } from './openai.service';
import { RunwareService } from './runware.service';

@Module({
  imports: [CreditsModule],
  controllers: [ContentController],
  providers: [RunwareService, OpenAIService],
  exports: [RunwareService, OpenAIService],
})
export class ContentModule {}
