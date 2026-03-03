import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videoUrls?: string[];

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
