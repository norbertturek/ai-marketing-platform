import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
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
import { GenerateVideoStatusDto } from './dto/generate-video-status.dto';
import { normalizeImageDimensions } from './runware-dimensions';
import {
  DEFAULT_IMAGE_MODEL_ID,
  DEFAULT_VIDEO_MODEL_ID,
  RunwareImageModelCapability,
  RunwareVideoModelCapability,
  RUNWARE_IMAGE_MODEL_CAPABILITIES,
  RUNWARE_VIDEO_MODEL_CAPABILITIES,
  getImageModelCapability,
  getVideoModelCapability,
  isVideoDurationAllowed,
  isVideoResolutionAllowed,
  listDurations,
} from './runware-capabilities';

const TEXT_GENERATION_COST = 1;
const IMAGE_GENERATION_COST_PER_IMAGE = 5;
const VIDEO_GENERATION_COST_PER_VIDEO = 10;
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

  @Get('capabilities')
  getCapabilities(): {
    imageModels: RunwareImageModelCapability[];
    videoModels: Array<
      RunwareVideoModelCapability & {
        durationOptions: number[];
      }
    >;
    defaults: {
      imageModel: string;
      videoModel: string;
    };
  } {
    return {
      imageModels: RUNWARE_IMAGE_MODEL_CAPABILITIES,
      videoModels: RUNWARE_VIDEO_MODEL_CAPABILITIES.map((item) => ({
        ...item,
        durationOptions: listDurations(item),
      })),
      defaults: {
        imageModel: DEFAULT_IMAGE_MODEL_ID,
        videoModel: DEFAULT_VIDEO_MODEL_ID,
      },
    };
  }

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

    const model = (dto.model ?? DEFAULT_IMAGE_MODEL_ID).trim();
    this.validateImageModelInputs(model, dto);

    const { urls, imageUUIDs } = await this.runware.generateImages({
      prompt: dto.prompt,
      negativePrompt: dto.negativePrompt,
      model,
      seedImage: dto.seedImage,
      maskImage: dto.maskImage,
      guideImage: dto.guideImage,
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
        model,
        numberResults,
        width,
        height,
      },
    );

    this.logger.log('Image generated', {
      userId: user.userId,
      model,
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
    this.validateVideoSource(dto);
    const numberResults = dto.numberResults ?? 1;
    const totalCost = numberResults * VIDEO_GENERATION_COST_PER_VIDEO;
    const balance = await this.creditsService.getBalance(user.userId);
    if (balance < totalCost) {
      throw new ForbiddenException(
        `Insufficient credits: have ${balance}, need ${totalCost}`,
      );
    }

    let taskUUIDs: string[];
    try {
      taskUUIDs = await this.startVideoTasks(dto);
    } catch (error) {
      throw new BadGatewayException(this.externalErrorMessage(error));
    }
    const start = Date.now();

    let urls: string[] = [];
    while (Date.now() - start < VIDEO_POLL_MAX_WAIT_MS) {
      const results = await this.getVideoResultsOrThrow(taskUUIDs);
      const error = results.find((r) => r.status === 'error');
      if (error) {
        throw new InternalServerErrorException(
          error.error ?? 'Video generation failed',
        );
      }

      urls = results
        .map((r) => r.videoURL)
        .filter((videoURL): videoURL is string => Boolean(videoURL));
      if (urls.length === taskUUIDs.length) {
        break;
      }
      await new Promise((r) => setTimeout(r, VIDEO_POLL_INTERVAL_MS));
    }

    if (urls.length !== taskUUIDs.length) {
      throw new GatewayTimeoutException('Video generation timed out');
    }

    const remainingCredits = await this.creditsService.deductAndLog(
      user.userId,
      totalCost,
      'video_generation',
      {
        numberResults,
        duration: dto.duration,
        model: dto.model ?? DEFAULT_VIDEO_MODEL_ID,
      },
    );

    this.logger.log('Video generated', {
      userId: user.userId,
      count: urls.length,
      remainingCredits,
    });

    return { urls, remainingCredits };
  }

  @Post('generate-video/start')
  async startGenerateVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateVideoDto,
  ): Promise<{
    taskUUIDs: string[];
    remainingCredits: number;
  }> {
    this.validateVideoSource(dto);
    const numberResults = dto.numberResults ?? 1;
    const totalCost = numberResults * VIDEO_GENERATION_COST_PER_VIDEO;
    const balance = await this.creditsService.getBalance(user.userId);
    if (balance < totalCost) {
      throw new ForbiddenException(
        `Insufficient credits: have ${balance}, need ${totalCost}`,
      );
    }

    let taskUUIDs: string[];
    try {
      taskUUIDs = await this.startVideoTasks(dto);
    } catch (error) {
      throw new BadGatewayException(this.externalErrorMessage(error));
    }
    const remainingCredits = await this.creditsService.deductAndLog(
      user.userId,
      totalCost,
      'video_generation',
      {
        numberResults,
        duration: dto.duration,
        model: dto.model ?? DEFAULT_VIDEO_MODEL_ID,
        mode: 'async_start',
      },
    );

    this.logger.log('Video generation queued', {
      userId: user.userId,
      count: taskUUIDs.length,
      remainingCredits,
    });

    return { taskUUIDs, remainingCredits };
  }

  @Post('generate-video/status')
  async getGenerateVideoStatus(@Body() dto: GenerateVideoStatusDto): Promise<{
    items: Array<{
      taskUUID: string;
      status: 'processing' | 'success' | 'error';
      videoURL?: string;
      error?: string;
    }>;
    done: boolean;
    urls: string[];
  }> {
    const items = await this.getVideoResultsOrThrow(dto.taskUUIDs);
    const done = items.every((item) => item.status !== 'processing');
    const urls = items
      .map((item) => item.videoURL)
      .filter((videoURL): videoURL is string => Boolean(videoURL));

    return { items, done, urls };
  }

  private validateVideoSource(dto: GenerateVideoDto): void {
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
  }

  private async startVideoTasks(dto: GenerateVideoDto): Promise<string[]> {
    const inputImage = dto.imageUUID ?? dto.imageData;
    if (!inputImage) {
      throw new BadRequestException('Provide imageUUID or imageData');
    }

    const capability = this.resolveVideoModel(dto.model);
    const duration = this.resolveVideoDuration(dto.duration, capability);
    const dimensions = this.resolveVideoDimensions(dto, capability);
    const cfgScale = this.resolveVideoCfgScale(dto.cfgScale, capability);
    const negativePrompt =
      capability.supportsNegativePrompt && dto.negativePrompt?.trim()
        ? dto.negativePrompt.trim()
        : undefined;

    const numberResults = dto.numberResults ?? 1;
    const taskUUIDs: string[] = [];
    for (let i = 0; i < numberResults; i++) {
      const taskUUID = await this.runware.generateVideo({
        inputImage,
        prompt: dto.prompt,
        model: capability.id,
        duration,
        width: dimensions?.width,
        height: dimensions?.height,
        negativePrompt,
        cfgScale,
      });
      taskUUIDs.push(taskUUID);
    }
    return taskUUIDs;
  }

  private validateImageModelInputs(model: string, dto: GenerateImageDto): void {
    const capability = getImageModelCapability(model);
    if (!capability) {
      return;
    }

    const hasSeedImage = Boolean(dto.seedImage?.trim());
    const hasMaskImage = Boolean(dto.maskImage?.trim());
    const hasGuideImage = Boolean(dto.guideImage?.trim());

    if (capability.requiredInputs.includes('seedImage') && !hasSeedImage) {
      throw new BadRequestException(
        `${capability.label} requires 'seedImage'`,
      );
    }
    if (capability.requiredInputs.includes('maskImage') && !hasMaskImage) {
      throw new BadRequestException(
        `${capability.label} requires 'maskImage'`,
      );
    }
    if (capability.requiredInputs.includes('guideImage') && !hasGuideImage) {
      throw new BadRequestException(
        `${capability.label} requires 'guideImage'`,
      );
    }
  }

  private resolveVideoModel(model?: string): RunwareVideoModelCapability {
    const modelId = model?.trim() || DEFAULT_VIDEO_MODEL_ID;
    const capability = getVideoModelCapability(modelId);
    if (!capability) {
      throw new BadRequestException(
        `Unsupported video model '${modelId}'. Use /content/capabilities to list supported models.`,
      );
    }
    return capability;
  }

  private resolveVideoDuration(
    duration: number | undefined,
    capability: RunwareVideoModelCapability,
  ): number {
    const resolved = duration ?? capability.defaults.duration;
    if (!isVideoDurationAllowed(capability, resolved)) {
      throw new BadRequestException(
        `Invalid duration for model '${capability.id}'. Allowed: ${listDurations(capability).join(', ')}`,
      );
    }
    return resolved;
  }

  private resolveVideoDimensions(
    dto: GenerateVideoDto,
    capability: RunwareVideoModelCapability,
  ): { width: number; height: number } | undefined {
    if (capability.inferDimensionsFromImage) {
      return undefined;
    }

    const width = dto.width ?? capability.defaults.width;
    const height = dto.height ?? capability.defaults.height;
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new BadRequestException(
        `Model '${capability.id}' requires explicit width and height.`,
      );
    }

    if (!isVideoResolutionAllowed(capability, width, height)) {
      const allowed = capability.resolutions
        .map((resolution) => `${resolution.width}x${resolution.height}`)
        .join(', ');
      throw new BadRequestException(
        `Unsupported resolution for model '${capability.id}'. Allowed: ${allowed}`,
      );
    }

    return { width, height };
  }

  private resolveVideoCfgScale(
    cfgScale: number | undefined,
    capability: RunwareVideoModelCapability,
  ): number | undefined {
    if (!capability.supportsCfgScale) {
      return undefined;
    }
    return cfgScale ?? capability.defaults.cfgScale;
  }

  private async getVideoResultsOrThrow(taskUUIDs: string[]) {
    try {
      return await this.runware.getVideoResults(taskUUIDs);
    } catch (error) {
      throw new BadGatewayException(this.externalErrorMessage(error));
    }
  }

  private externalErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return 'Video provider request failed';
  }
}
