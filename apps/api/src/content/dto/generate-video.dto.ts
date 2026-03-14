import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateVideoDto {
  @ValidateIf((o: GenerateVideoDto) => !o.imageData)
  @IsString()
  imageUUID?: string;

  @ValidateIf((o: GenerateVideoDto) => !o.imageUUID)
  @IsString()
  imageData?: string; // base64, data URL, or public image URL

  @IsString()
  prompt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(15)
  duration?: number = 5;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(128)
  @Max(2048)
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(128)
  @Max(2048)
  height?: number;

  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  cfgScale?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  numberResults?: number = 1;
}
