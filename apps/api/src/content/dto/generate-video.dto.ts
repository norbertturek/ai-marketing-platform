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
  imageData?: string; // base64 or data URL — uploadImage will be called

  @IsString()
  prompt!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(3)
  @Max(10)
  duration?: number = 5;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  numberResults?: number = 1;
}
