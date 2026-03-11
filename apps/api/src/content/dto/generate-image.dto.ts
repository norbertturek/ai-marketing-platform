import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { normalizeImageDimensions } from '../runware-dimensions';

const WIDTH_HEIGHT_MIN = 128;
const WIDTH_HEIGHT_MAX = 2048;

export { normalizeImageDimensions };

export class GenerateImageDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @IsOptional()
  @IsString()
  model?: string = 'runware:101@1';

  @IsOptional()
  @IsString()
  seedImage?: string;

  @IsOptional()
  @IsString()
  maskImage?: string;

  @IsOptional()
  @IsString()
  guideImage?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(WIDTH_HEIGHT_MIN)
  @Max(WIDTH_HEIGHT_MAX)
  width?: number = 1024;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(WIDTH_HEIGHT_MIN)
  @Max(WIDTH_HEIGHT_MAX)
  height?: number = 1024;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  steps?: number = 30;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  cfgScale?: number = 7.5;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  numberResults?: number = 1;

  @IsOptional()
  @IsString()
  @IsIn(['JPG', 'PNG', 'WEBP'])
  outputFormat?: 'JPG' | 'PNG' | 'WEBP' = 'WEBP';
}
