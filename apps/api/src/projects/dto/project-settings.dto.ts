import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const PLATFORMS = [
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'tiktok',
] as const;
const AI_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] as const;
const IMAGE_OUTPUT_FORMATS = ['JPG', 'PNG', 'WEBP'] as const;
const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:5'] as const;
const VIDEO_MOTION_INTENSITY = ['low', 'medium', 'high'] as const;
const VIDEO_CAMERA_MOVEMENTS = ['static', 'pan', 'zoom', 'dolly'] as const;
const VIDEO_FPS = ['24', '30', '60'] as const;

export class ProjectSettingsDto {
  @IsOptional()
  @IsIn(PLATFORMS)
  defaultPlatform?: (typeof PLATFORMS)[number];

  @IsOptional()
  @IsIn(AI_MODELS)
  defaultAiModel?: (typeof AI_MODELS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  defaultNumTextVariants?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(2000)
  defaultMaxLength?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2)
  defaultTemperature?: number;

  @IsOptional()
  @IsString()
  defaultImageModel?: string;

  @IsOptional()
  @IsIn(ASPECT_RATIOS)
  defaultAspectRatio?: (typeof ASPECT_RATIOS)[number];

  @IsOptional()
  @IsIn(IMAGE_OUTPUT_FORMATS)
  defaultImageOutputFormat?: (typeof IMAGE_OUTPUT_FORMATS)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  defaultNumImageVariants?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(15)
  defaultVideoDuration?: number;

  @IsOptional()
  @IsString()
  defaultVideoModel?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  defaultNumVideoVariants?: number;

  @IsOptional()
  @IsIn(VIDEO_MOTION_INTENSITY)
  defaultMotionIntensity?: (typeof VIDEO_MOTION_INTENSITY)[number];

  @IsOptional()
  @IsIn(VIDEO_CAMERA_MOVEMENTS)
  defaultCameraMovement?: (typeof VIDEO_CAMERA_MOVEMENTS)[number];

  @IsOptional()
  @IsIn(VIDEO_FPS)
  defaultFps?: (typeof VIDEO_FPS)[number];

  @IsOptional()
  @IsBoolean()
  defaultLoopVideo?: boolean;
}
