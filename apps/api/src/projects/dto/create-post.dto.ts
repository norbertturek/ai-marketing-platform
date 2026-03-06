import { IsArray, IsOptional, IsString, Matches } from 'class-validator';

const MEDIA_URL_PATTERN = /^(data:.+|https?:\/\/.+)$/;

export class CreatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(MEDIA_URL_PATTERN, {
    each: true,
    message: 'Each URL must be a data URL or http(s) URL',
  })
  imageUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(MEDIA_URL_PATTERN, {
    each: true,
    message: 'Each URL must be a data URL or http(s) URL',
  })
  videoUrls?: string[];

  @IsOptional()
  @IsString()
  platform?: string;
}
