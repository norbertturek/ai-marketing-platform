export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';

export type PlatformSize = {
  name: string;
  width: number;
  height: number;
};

export const PLATFORM_SIZES: Record<Platform, PlatformSize[]> = {
  facebook: [
    { name: 'Post (square)', width: 1200, height: 1200 },
    { name: 'Post (horizontal)', width: 1200, height: 630 },
    { name: 'Story', width: 1080, height: 1920 },
    { name: 'Cover', width: 820, height: 312 },
  ],
  instagram: [
    { name: 'Post (square)', width: 1080, height: 1080 },
    { name: 'Post (vertical)', width: 1080, height: 1350 },
    { name: 'Story/Reels', width: 1080, height: 1920 },
    { name: 'Carousel', width: 1080, height: 1080 },
  ],
  linkedin: [
    { name: 'Post (horizontal)', width: 1200, height: 627 },
    { name: 'Post (square)', width: 1200, height: 1200 },
    { name: 'Cover', width: 1584, height: 396 },
  ],
  twitter: [
    { name: 'Post', width: 1200, height: 675 },
    { name: 'Header', width: 1500, height: 500 },
  ],
  tiktok: [
    { name: 'Video (vertical)', width: 1080, height: 1920 },
    { name: 'Video (square)', width: 1080, height: 1080 },
  ],
};

export const COST_ESTIMATES = {
  textGeneration: 1,
  imageGeneration: 5,
  videoGeneration: 50,
};

/** Runware-compatible dimensions (multiples of 64, 128–2048) per aspect ratio */
export const ASPECT_RATIO_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
  '4:5': { width: 1024, height: 1280 },
};

/** Preset Runware image models (AIR identifiers) */
export const RUNWARE_IMAGE_MODELS: { id: string; label: string }[] = [
  { id: 'runware:101@1', label: 'FLUX.1 [dev]' },
  { id: 'runware:102@1', label: 'FLUX Fill' },
  { id: 'runware:105@1', label: 'FLUX Redux' },
  { id: 'runware:103@1', label: 'FLUX Depth' },
  { id: 'runware:104@1', label: 'FLUX Canny' },
];
