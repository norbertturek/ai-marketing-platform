import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { OpenAIService } from './openai.service';
import { RunwareService } from './runware.service';

@Module({
  controllers: [ContentController],
  providers: [RunwareService, OpenAIService],
  exports: [RunwareService, OpenAIService],
})
export class ContentModule {}
