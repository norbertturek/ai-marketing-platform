import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OpenAIService } from './openai.service';
import { GenerateTextDto } from './dto/generate-text.dto';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly openai: OpenAIService) {}

  @Post('generate-text')
  async generateText(
    @CurrentUser() _user: AuthenticatedUser,
    @Body() dto: GenerateTextDto,
  ): Promise<{ texts: string[] }> {
    const texts = await this.openai.generateSocialPost({
      prompt: dto.prompt,
      platform: dto.platform,
      researchContext: dto.researchContext,
      numVariants: dto.numVariants ?? 1,
      maxLength: dto.maxLength ?? 280,
    });
    return { texts };
  }
}
