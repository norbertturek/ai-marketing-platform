import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateTextDto {
  @IsString()
  prompt!: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  researchContext?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  numVariants?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(500)
  maxLength?: number = 280;
}
