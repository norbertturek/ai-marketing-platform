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
  @IsString()
  @IsIn(['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'])
  model?: string = 'gpt-4o-mini';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.7;

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
