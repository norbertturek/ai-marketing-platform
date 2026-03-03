import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreditsService } from '../credits/credits.service';
import { OpenAIService } from './openai.service';
import type { GenerateResult } from './openai.service';
import { GenerateTextDto } from './dto/generate-text.dto';

const TEXT_GENERATION_COST = 1;

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  private readonly logger = new Logger(ContentController.name);

  constructor(
    private readonly openai: OpenAIService,
    private readonly creditsService: CreditsService,
  ) {}

  @Post('generate-text')
  async generateText(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateTextDto,
  ): Promise<{
    texts: string[];
    usage: GenerateResult['usage'];
    model: string;
    remainingCredits: number;
  }> {
    const remainingCredits = await this.creditsService.deductAndLog(
      user.userId,
      TEXT_GENERATION_COST,
      'text_generation',
      { model: dto.model, numVariants: dto.numVariants },
    );

    const result = await this.openai.generateSocialPost({
      prompt: dto.prompt,
      platform: dto.platform,
      researchContext: dto.researchContext,
      numVariants: dto.numVariants ?? 1,
      maxLength: dto.maxLength ?? 280,
      model: dto.model,
      temperature: dto.temperature,
    });

    this.logger.log('Text generated', {
      userId: user.userId,
      model: result.model,
      usage: result.usage,
      remainingCredits,
    });

    return {
      texts: result.texts,
      usage: result.usage,
      model: result.model,
      remainingCredits,
    };
  }
}
