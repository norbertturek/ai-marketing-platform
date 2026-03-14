import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_IMAGE_MODEL_ID,
  DEFAULT_VIDEO_MODEL_ID,
  getImageModelCapability,
  getVideoModelCapability,
} from './runware-capabilities';

const RUNWARE_API = 'https://api.runware.ai/v1';

@Injectable()
export class RunwareService {
  private readonly logger = new Logger(RunwareService.name);

  getApiKey(): string {
    const key = process.env.RUNWARE_API_KEY;
    if (!key) {
      throw new Error('RUNWARE_API_KEY is not configured');
    }
    return key;
  }

  private async request(tasks: unknown[]): Promise<{
    data?: Array<{
      imageURL?: string;
      imageUUID?: string;
      taskUUID?: string;
      taskType?: string;
      status?: string;
      videoURL?: string;
      message?: string;
    }>;
    errors?: Array<{ taskUUID?: string; message?: string; code?: string }>;
  }> {
    const res = await fetch(RUNWARE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify(tasks),
    });
    const json = (await res.json()) as {
      data?: Array<Record<string, unknown>>;
      errors?: Array<{ taskUUID?: string; message?: string; code?: string }>;
    };
    if (!res.ok) {
      this.logger.error('Runware API error', { status: res.status, json });
      throw new Error(
        (json as { errors?: Array<{ message?: string }> }).errors?.[0]
          ?.message ?? `Runware API error: ${res.status}`,
      );
    }
    if (
      Array.isArray((json as { errors?: unknown[] }).errors) &&
      (json as { errors: unknown[] }).errors.length
    ) {
      const err = (
        json as { errors: Array<{ message?: string; code?: string }> }
      ).errors[0];
      throw new Error(err.message ?? `Runware task failed: ${err.code}`);
    }
    return json;
  }

  async generateImages(params: {
    prompt: string;
    negativePrompt?: string;
    model?: string;
    seedImage?: string;
    maskImage?: string;
    guideImage?: string;
    width?: number;
    height?: number;
    numVariants?: number;
    cfgScale?: number;
    steps?: number;
    outputFormat?: 'JPG' | 'PNG' | 'WEBP';
  }): Promise<{ urls: string[]; imageUUIDs: string[] }> {
    const tasks = params.numVariants ?? 1;
    const taskUUIDs = Array.from({ length: tasks }, () => crypto.randomUUID());
    const format = (params.outputFormat ?? 'WEBP').toLowerCase();
    const model = params.model ?? DEFAULT_IMAGE_MODEL_ID;
    const capability = getImageModelCapability(model);
    const runwareTasks = taskUUIDs.map((taskUUID) =>
      this.buildImageInferenceTask({
        taskUUID,
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        model,
        capabilityId: capability?.id,
        width: params.width ?? 1024,
        height: params.height ?? 1024,
        steps: params.steps ?? 30,
        cfgScale: params.cfgScale ?? 7.5,
        outputFormat: format,
        seedImage: params.seedImage,
        maskImage: params.maskImage,
        guideImage: params.guideImage,
      }),
    );
    const res = await this.request(runwareTasks);
    const urls: string[] = [];
    const imageUUIDs: string[] = [];
    for (const item of res.data ?? []) {
      if (item.imageURL) urls.push(item.imageURL);
      if (item.imageUUID) imageUUIDs.push(item.imageUUID);
    }
    return { urls, imageUUIDs };
  }

  async uploadImage(imageData: string): Promise<string> {
    let base64 = imageData;
    if (base64.startsWith('data:')) {
      const comma = base64.indexOf(',');
      base64 = comma >= 0 ? base64.slice(comma + 1) : base64;
    }
    const taskUUID = crypto.randomUUID();
    const res = await this.request([
      {
        taskType: 'imageUpload',
        taskUUID,
        image: `data:image/png;base64,${base64}`,
      },
    ]);
    const item = res.data?.[0];
    const uuid = item?.imageUUID;
    if (!uuid) {
      throw new Error('Runware image upload failed: no imageUUID returned');
    }
    return uuid;
  }

  async generateVideo(params: {
    inputImage: string;
    prompt: string;
    model?: string;
    duration?: number;
    width?: number;
    height?: number;
    negativePrompt?: string;
    cfgScale?: number;
  }): Promise<string> {
    const capability =
      getVideoModelCapability(params.model ?? DEFAULT_VIDEO_MODEL_ID) ??
      getVideoModelCapability(DEFAULT_VIDEO_MODEL_ID);
    if (!capability) {
      throw new Error('No supported default video model configured');
    }

    const taskUUID = crypto.randomUUID();
    const frameBlock =
      capability.inputShape === 'inputs.frameImages'
        ? {
            inputs: {
              frameImages: [{ image: params.inputImage, frame: 'first' }],
            },
          }
        : {
            frameImages: [{ inputImage: params.inputImage, frame: 'first' }],
          };
    const width = params.width ?? 1080;
    const height = params.height ?? 1080;

    await this.request([
      {
        taskType: 'videoInference',
        taskUUID,
        positivePrompt: params.prompt,
        model: capability.id,
        duration: params.duration ?? capability.defaults.duration,
        deliveryMethod: 'async',
        ...(typeof params.width === 'number' ? { width: params.width } : {}),
        ...(typeof params.height === 'number' ? { height: params.height } : {}),
        ...(params.negativePrompt?.trim()
          ? { negativePrompt: params.negativePrompt.trim() }
          : {}),
        ...(typeof params.cfgScale === 'number'
          ? { CFGScale: params.cfgScale }
          : {}),
        ...frameBlock,
        numberResults: 1,
        width,
        height,
      },
    ]);
    return taskUUID;
  }

  private buildImageInferenceTask(params: {
    taskUUID: string;
    prompt: string;
    negativePrompt?: string;
    model: string;
    capabilityId?: string;
    width: number;
    height: number;
    steps: number;
    cfgScale: number;
    outputFormat: string;
    seedImage?: string;
    maskImage?: string;
    guideImage?: string;
  }): Record<string, unknown> {
    const negPrompt =
      params.negativePrompt && params.negativePrompt.length >= 2
        ? params.negativePrompt
        : undefined;

    if (params.capabilityId === 'runware:102@1') {
      return {
        taskType: 'imageInference',
        taskUUID: params.taskUUID,
        positivePrompt: params.prompt,
        ...(negPrompt ? { negativePrompt: negPrompt } : {}),
        model: 'runware:102@1',
        seedImage: params.seedImage,
        maskImage: params.maskImage,
        width: params.width,
        height: params.height,
        steps: params.steps,
        CFGScale: params.cfgScale,
        numberResults: 1,
        outputType: 'URL',
        outputFormat: params.outputFormat,
      };
    }

    if (
      params.capabilityId === 'runware:103@1' ||
      params.capabilityId === 'runware:104@1'
    ) {
      return {
        taskType: 'imageInference',
        taskUUID: params.taskUUID,
        positivePrompt: params.prompt,
        ...(negPrompt ? { negativePrompt: negPrompt } : {}),
        model: params.capabilityId,
        seedImage: params.seedImage,
        width: params.width,
        height: params.height,
        steps: params.steps,
        CFGScale: params.cfgScale,
        numberResults: 1,
        outputType: 'URL',
        outputFormat: params.outputFormat,
      };
    }

    if (params.capabilityId === 'runware:105@1') {
      return {
        taskType: 'imageInference',
        taskUUID: params.taskUUID,
        positivePrompt: params.prompt || '__BLANK__',
        model: 'runware:101@1',
        width: params.width,
        height: params.height,
        steps: params.steps,
        CFGScale: params.cfgScale,
        ipAdapters: [{ guideImage: params.guideImage, model: 'runware:105@1' }],
        numberResults: 1,
        outputType: 'URL',
        outputFormat: params.outputFormat,
      };
    }

    return {
      taskType: 'imageInference',
      taskUUID: params.taskUUID,
      positivePrompt: params.prompt,
      ...(negPrompt ? { negativePrompt: negPrompt } : {}),
      width: params.width,
      height: params.height,
      model: params.model,
      steps: params.steps,
      CFGScale: params.cfgScale,
      numberResults: 1,
      outputType: 'URL',
      outputFormat: params.outputFormat,
    };
  }

  async getVideoResult(taskUUID: string): Promise<{
    status: 'processing' | 'success' | 'error';
    videoURL?: string;
    error?: string;
  }> {
    const [result] = await this.getVideoResults([taskUUID]);
    return result ?? { status: 'processing' };
  }

  async getVideoResults(taskUUIDs: string[]): Promise<
    Array<{
      taskUUID: string;
      status: 'processing' | 'success' | 'error';
      videoURL?: string;
      error?: string;
    }>
  > {
    if (taskUUIDs.length === 0) {
      return [];
    }

    const res = await this.request(
      taskUUIDs.map((taskUUID) => ({ taskType: 'getResponse', taskUUID })),
    );
    const errors = res.errors ?? [];
    const data = res.data ?? [];

    return taskUUIDs.map((taskUUID) => {
      const err = errors.find((e) => e.taskUUID === taskUUID);
      if (err) {
        return {
          taskUUID,
          status: 'error' as const,
          error: err.message ?? 'Video generation failed',
        };
      }

      const item = data.find(
        (d) => d.taskUUID === taskUUID && d.taskType === 'videoInference',
      );
      const status = (item?.status ?? 'processing') as
        | 'processing'
        | 'success'
        | 'error';

      if (status === 'success') {
        return {
          taskUUID,
          status: 'success' as const,
          videoURL: item?.videoURL,
        };
      }
      if (status === 'error') {
        return {
          taskUUID,
          status: 'error' as const,
          error: item?.message ?? 'Video generation failed',
        };
      }

      return { taskUUID, status: 'processing' as const };
    });
  }
}
