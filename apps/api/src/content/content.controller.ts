import {
  Body,
  Controller,
  ForbiddenException,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreditsService } from '../credits/credits.service';
import { OpenAIService } from './openai.service';
import type { GenerateResult } from './openai.service';
import { RunwareService } from './runware.service';
import { GenerateTextDto } from './dto/generate-text.dto';
import { GenerateImageDto } from './dto/generate-image.dto';
import { normalizeImageDimensions } from './runware-dimensions';

const TEXT_GENERATION_COST = 1;
const IMAGE_GENERATION_COST_PER_IMAGE = 5;

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  private readonly logger = new Logger(ContentController.name);

  constructor(
    private readonly openai: OpenAIService,
    private readonly creditsService: CreditsService,
    private readonly runware: RunwareService,
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
    const balance = await this.creditsService.getBalance(user.userId);
    if (balance < TEXT_GENERATION_COST) {
      throw new ForbiddenException(
        `Insufficient credits: have ${balance}, need ${TEXT_GENERATION_COST}`,
      );
    }

    const result = await this.openai.generateSocialPost({
      prompt: dto.prompt,
      platform: dto.platform,
      researchContext: dto.researchContext,
      numVariants: dto.numVariants ?? 1,
      maxLength: dto.maxLength ?? 280,
      model: dto.model,
      temperature: dto.temperature,
    });

    const remainingCredits = await this.creditsService.deductAndLog(
      user.userId,
      TEXT_GENERATION_COST,
      'text_generation',
      { model: dto.model, numVariants: dto.numVariants },
    );

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

  @Post('generate-image')
  async generateImage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateImageDto,
  ): Promise<{
    urls: string[];
    imageUUIDs: string[];
    remainingCredits: number;
  }> {
    const numberResults = dto.numberResults ?? 1;
    const totalCost = numberResults * IMAGE_GENERATION_COST_PER_IMAGE;
    const balance = await this.creditsService.getBalance(user.userId);
    if (balance < totalCost) {
      throw new ForbiddenException(
        `Insufficient credits: have ${balance}, need ${totalCost}`,
      );
    }

    const { width, height } = normalizeImageDimensions(
      dto.width ?? 1024,
      dto.height ?? 1024,
    );

    const { urls, imageUUIDs } = await this.runware.generateImages({
      prompt: dto.prompt,
      negativePrompt: dto.negativePrompt,
      model: dto.model,
      width,
      height,
      numVariants: numberResults,
      cfgScale: dto.cfgScale,
      steps: dto.steps,
      outputFormat: dto.outputFormat,
    });

    const remainingCredits = await this.creditsService.deductAndLog(
      user.userId,
      totalCost,
      'image_generation',
      {
        model: dto.model,
        numberResults,
        width,
        height,
      },
    );

    this.logger.log('Image generated', {
      userId: user.userId,
      model: dto.model,
      count: urls.length,
      remainingCredits,
    });

    return { urls, imageUUIDs, remainingCredits };
  }
}
