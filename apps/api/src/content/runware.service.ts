import { Injectable, Logger } from '@nestjs/common';

const RUNWARE_API = 'https://api.runware.ai/v1';
const DEFAULT_IMAGE_MODEL = 'runware:101@1';
const DEFAULT_VIDEO_MODEL = 'klingai:5@3';

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
    width?: number;
    height?: number;
    numVariants?: number;
    cfgScale?: number;
    steps?: number;
  }): Promise<{ urls: string[]; imageUUIDs: string[] }> {
    const tasks = params.numVariants ?? 1;
    const taskUUIDs = Array.from({ length: tasks }, () => crypto.randomUUID());
    const runwareTasks = taskUUIDs.map((taskUUID) => ({
      taskType: 'imageInference',
      taskUUID,
      positivePrompt: params.prompt,
      negativePrompt: params.negativePrompt ?? '',
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      model: DEFAULT_IMAGE_MODEL,
      steps: params.steps ?? 30,
      CFGScale: params.cfgScale ?? 7.5,
      numberResults: 1,
      outputType: 'URL',
      outputFormat: 'webp',
    }));
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
    imageUUID: string;
    prompt: string;
    duration?: number;
  }): Promise<string> {
    const taskUUID = crypto.randomUUID();
    await this.request([
      {
        taskType: 'videoInference',
        taskUUID,
        positivePrompt: params.prompt,
        model: DEFAULT_VIDEO_MODEL,
        duration: params.duration ?? 5,
        deliveryMethod: 'async',
        frameImages: [{ inputImage: params.imageUUID, frame: 'first' }],
        numberResults: 1,
      },
    ]);
    return taskUUID;
  }

  async getVideoResult(taskUUID: string): Promise<{
    status: 'processing' | 'success' | 'error';
    videoURL?: string;
    error?: string;
  }> {
    const res = await this.request([{ taskType: 'getResponse', taskUUID }]);
    const errors = res.errors ?? [];
    const err = errors.find((e) => e.taskUUID === taskUUID);
    if (err) {
      return {
        status: 'error',
        error: err.message ?? 'Video generation failed',
      };
    }
    const data = res.data ?? [];
    const item = data.find(
      (d) => d.taskUUID === taskUUID && d.taskType === 'videoInference',
    );
    const status = (item?.status ?? 'processing') as
      | 'processing'
      | 'success'
      | 'error';
    if (status === 'success') {
      return { status: 'success', videoURL: item?.videoURL };
    }
    if (status === 'error') {
      return {
        status: 'error',
        error: item?.message ?? 'Video generation failed',
      };
    }
    return { status: 'processing' };
  }
}
