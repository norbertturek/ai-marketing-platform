export type RunwareImageModelId =
  | 'runware:101@1'
  | 'runware:102@1'
  | 'runware:103@1'
  | 'runware:104@1'
  | 'runware:105@1';

export type ImageInputRequirement = 'seedImage' | 'maskImage' | 'guideImage';

export type RunwareImageModelCapability = {
  id: RunwareImageModelId;
  label: string;
  description: string;
  requiredInputs: ImageInputRequirement[];
  supportsNegativePrompt: boolean;
};

export type VideoDurationSpec =
  | { mode: 'enum'; values: number[] }
  | { mode: 'range'; min: number; max: number; step: number };

export type VideoResolution = {
  width: number;
  height: number;
  label: string;
};

export type VideoInputShape = 'frameImages' | 'inputs.frameImages';

export type RunwareVideoModelCapability = {
  id: string;
  label: string;
  description: string;
  duration: VideoDurationSpec;
  resolutions: VideoResolution[];
  inferDimensionsFromImage: boolean;
  supportsNegativePrompt: boolean;
  supportsCfgScale: boolean;
  inputShape: VideoInputShape;
  defaults: {
    duration: number;
    width?: number;
    height?: number;
    cfgScale?: number;
  };
};

const LOW_RES: VideoResolution[] = [
  { width: 1280, height: 720, label: '1280x720 (16:9)' },
  { width: 720, height: 720, label: '720x720 (1:1)' },
  { width: 720, height: 1280, label: '720x1280 (9:16)' },
];

const FULL_HD: VideoResolution[] = [
  { width: 1920, height: 1080, label: '1920x1080 (16:9)' },
  { width: 1080, height: 1080, label: '1080x1080 (1:1)' },
  { width: 1080, height: 1920, label: '1080x1920 (9:16)' },
];

const FULL_HD_PRO: VideoResolution[] = [
  { width: 1920, height: 1080, label: '1920x1080 (16:9)' },
  { width: 1440, height: 1440, label: '1440x1440 (1:1)' },
  { width: 1080, height: 1920, label: '1080x1920 (9:16)' },
];

export const RUNWARE_IMAGE_MODEL_CAPABILITIES: RunwareImageModelCapability[] = [
  {
    id: 'runware:101@1',
    label: 'FLUX.1 [dev]',
    description: 'General text-to-image FLUX model.',
    requiredInputs: [],
    supportsNegativePrompt: true,
  },
  {
    id: 'runware:102@1',
    label: 'FLUX Fill',
    description: 'Inpainting/outpainting. Requires seed + mask image.',
    requiredInputs: ['seedImage', 'maskImage'],
    supportsNegativePrompt: true,
  },
  {
    id: 'runware:103@1',
    label: 'FLUX Depth',
    description: 'Depth-guided generation. Requires seed image.',
    requiredInputs: ['seedImage'],
    supportsNegativePrompt: true,
  },
  {
    id: 'runware:104@1',
    label: 'FLUX Canny',
    description: 'Edge-guided generation. Requires seed image.',
    requiredInputs: ['seedImage'],
    supportsNegativePrompt: true,
  },
  {
    id: 'runware:105@1',
    label: 'FLUX Redux',
    description:
      'Variation/restyle via IP-Adapter. Requires guide image; uses FLUX base model.',
    requiredInputs: ['guideImage'],
    supportsNegativePrompt: false,
  },
];

export const DEFAULT_IMAGE_MODEL_ID: RunwareImageModelId = 'runware:101@1';

export const RUNWARE_VIDEO_MODEL_CAPABILITIES: RunwareVideoModelCapability[] = [
  {
    id: 'klingai:1@1',
    label: 'KlingAI 1.0 Standard',
    description: 'Budget model, image-to-video.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:1@2',
    label: 'KlingAI 1.0 Pro',
    description: 'Higher fidelity Kling 1.0.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:2@1',
    label: 'KlingAI 1.5 Standard',
    description: 'Balanced quality/cost image-to-video model.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: false,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:2@2',
    label: 'KlingAI 1.5 Pro',
    description: 'Upgraded quality over 1.5 Standard.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: false,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:3@1',
    label: 'KlingAI 1.6 Standard',
    description: 'Improved motion quality over 1.5.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:3@2',
    label: 'KlingAI 1.6 Pro',
    description: 'Higher quality 1.6 generation.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:5@1',
    label: 'KlingAI 2.1 Standard',
    description: 'Cost-effective 2.1 image-to-video.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: false,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:5@2',
    label: 'KlingAI 2.1 Pro',
    description: 'Full HD Kling 2.1 Pro.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: FULL_HD,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: false,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1920, height: 1080, cfgScale: 0.5 },
  },
  {
    id: 'klingai:5@3',
    label: 'KlingAI 2.1 Master',
    description: 'Highest quality Kling 2.1 with Full HD.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: FULL_HD,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1920, height: 1080, cfgScale: 0.5 },
  },
  {
    id: 'klingai:6@0',
    label: 'KlingAI 2.5 Turbo Standard',
    description: 'Faster 2.5 generation.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:6@1',
    label: 'KlingAI 2.5 Turbo Pro',
    description: 'Turbo Pro Kling 2.5.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: LOW_RES,
    inferDimensionsFromImage: false,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'frameImages',
    defaults: { duration: 5, width: 1280, height: 720, cfgScale: 0.5 },
  },
  {
    id: 'klingai:kling-video@2.6-pro',
    label: 'Kling VIDEO 2.6 Pro',
    description: 'Video+audio model, image-to-video infers dimensions.',
    duration: { mode: 'enum', values: [5, 10] },
    resolutions: FULL_HD,
    inferDimensionsFromImage: true,
    supportsNegativePrompt: true,
    supportsCfgScale: true,
    inputShape: 'inputs.frameImages',
    defaults: { duration: 5, cfgScale: 0.5 },
  },
  {
    id: 'klingai:kling-video@3-standard',
    label: 'Kling VIDEO 3.0 Standard',
    description: 'Balanced quality/speed with native audio support.',
    duration: { mode: 'range', min: 3, max: 15, step: 1 },
    resolutions: FULL_HD,
    inferDimensionsFromImage: true,
    supportsNegativePrompt: true,
    supportsCfgScale: false,
    inputShape: 'inputs.frameImages',
    defaults: { duration: 5 },
  },
  {
    id: 'klingai:kling-video@3-pro',
    label: 'Kling VIDEO 3.0 Pro',
    description: 'High-fidelity 3.0 model with native audio.',
    duration: { mode: 'range', min: 3, max: 15, step: 1 },
    resolutions: FULL_HD_PRO,
    inferDimensionsFromImage: true,
    supportsNegativePrompt: true,
    supportsCfgScale: false,
    inputShape: 'inputs.frameImages',
    defaults: { duration: 5 },
  },
];

export const DEFAULT_VIDEO_MODEL_ID = 'klingai:1@1';

export function getImageModelCapability(
  modelId: string,
): RunwareImageModelCapability | undefined {
  return RUNWARE_IMAGE_MODEL_CAPABILITIES.find((item) => item.id === modelId);
}

export function getVideoModelCapability(
  modelId: string,
): RunwareVideoModelCapability | undefined {
  return RUNWARE_VIDEO_MODEL_CAPABILITIES.find((item) => item.id === modelId);
}

export function listDurations(
  capability: RunwareVideoModelCapability,
): number[] {
  if (capability.duration.mode === 'enum') {
    return capability.duration.values;
  }
  const items: number[] = [];
  for (
    let value = capability.duration.min;
    value <= capability.duration.max;
    value += capability.duration.step
  ) {
    items.push(value);
  }
  return items;
}

export function isVideoDurationAllowed(
  capability: RunwareVideoModelCapability,
  duration: number,
): boolean {
  if (capability.duration.mode === 'enum') {
    return capability.duration.values.includes(duration);
  }
  return (
    duration >= capability.duration.min &&
    duration <= capability.duration.max &&
    (duration - capability.duration.min) % capability.duration.step === 0
  );
}

export function isVideoResolutionAllowed(
  capability: RunwareVideoModelCapability,
  width: number,
  height: number,
): boolean {
  return capability.resolutions.some(
    (resolution) => resolution.width === width && resolution.height === height,
  );
}
