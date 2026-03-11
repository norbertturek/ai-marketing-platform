export type ProjectSettings = {
  defaultPlatform?:
    | 'facebook'
    | 'instagram'
    | 'linkedin'
    | 'twitter'
    | 'tiktok';
  defaultAiModel?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';
  defaultNumTextVariants?: number;
  defaultMaxLength?: number;
  defaultTemperature?: number;
  defaultImageModel?: string;
  defaultAspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  defaultImageOutputFormat?: 'JPG' | 'PNG' | 'WEBP';
  defaultNumImageVariants?: number;
  defaultVideoModel?: string;
  defaultVideoDuration?: number;
  defaultNumVideoVariants?: number;
  defaultMotionIntensity?: 'low' | 'medium' | 'high';
  defaultCameraMovement?: 'static' | 'pan' | 'zoom' | 'dolly';
  defaultFps?: '24' | '30' | '60';
  defaultLoopVideo?: boolean;
};

export type ProjectResponse = {
  id: string;
  name: string;
  description: string;
  context: string | null;
  settings: ProjectSettings | null;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
};
