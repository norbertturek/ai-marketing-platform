import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  GatewayTimeoutException,
  InternalServerErrorException,
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
import { GenerateVideoDto } from './dto/generate-video.dto';
import { normalizeImageDimensions } from './runware-dimensions';

const TEXT_GENERATION_COST = 1;
const IMAGE_GENERATION_COST_PER_IMAGE = 5;
const VIDEO_GENERATION_COST_PER_VIDEO = 50;
const VIDEO_POLL_INTERVAL_MS = 3000;
const VIDEO_POLL_MAX_WAIT_MS = 180_000;

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

  @Post('generate-video')
  async generateVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateVideoDto,
  ): Promise<{
    urls: string[];
    remainingCredits: number;
  }> {
    const hasUuid = dto.imageUUID && dto.imageUUID.trim().length > 0;
    const hasData = dto.imageData && dto.imageData.trim().length > 0;
    if (!hasUuid && !hasData) {
      throw new BadRequestException('Provide imageUUID or imageData');
    }
    if (hasUuid && hasData) {
      throw new BadRequestException(
        'Provide either imageUUID or imageData, not both',
      );
    }

    const numberResults = dto.numberResults ?? 1;
    const totalCost = numberResults * VIDEO_GENERATION_COST_PER_VIDEO;
    const balance = await this.creditsService.getBalance(user.userId);
    if (balance < totalCost) {
      throw new ForbiddenException(
        `Insufficient credits: have ${balance}, need ${totalCost}`,
      );
    }

    let imageUUID = dto.imageUUID;
    if (dto.imageData) {
      imageUUID = await this.runware.uploadImage(dto.imageData);
    }

    const taskUUIDs: string[] = [];
    for (let i = 0; i < numberResults; i++) {
      const taskUUID = await this.runware.generateVideo({
        imageUUID: imageUUID!,
        prompt: dto.prompt,
        duration: dto.duration ?? 5,
      });
      taskUUIDs.push(taskUUID);
    }

    const urls: string[] = [];
    const start = Date.now();

    for (const taskUUID of taskUUIDs) {
      let found = false;
      while (Date.now() - start < VIDEO_POLL_MAX_WAIT_MS) {
        const result = await this.runware.getVideoResult(taskUUID);
        if (result.status === 'success' && result.videoURL) {
          urls.push(result.videoURL);
          found = true;
          break;
        }
        if (result.status === 'error') {
          throw new InternalServerErrorException(
            result.error ?? 'Video generation failed',
          );
        }
        await new Promise((r) => setTimeout(r, VIDEO_POLL_INTERVAL_MS));
      }
      if (!found) {
        throw new GatewayTimeoutException('Video generation timed out');
      }
    }

    const remainingCredits = await this.creditsService.deductAndLog(
      user.userId,
      totalCost,
      'video_generation',
      { numberResults, duration: dto.duration },
    );

    this.logger.log('Video generated', {
      userId: user.userId,
      count: urls.length,
      remainingCredits,
    });

    return { urls, remainingCredits };
  }
}
