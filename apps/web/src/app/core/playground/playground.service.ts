import { Injectable } from '@angular/core';

export interface GenerateImageResult {
  imageUrl: string;
}

export interface GenerateVideoResult {
  videoUrl: string;
}

@Injectable({ providedIn: 'root' })
export class PlaygroundService {
  /**
   * Generate an image from a text prompt.
   * Replace implementation with real API (e.g. OpenAI Images, Stability) when ready.
   */
  async generateImage(prompt: string): Promise<GenerateImageResult> {
    if (!prompt?.trim()) {
      throw new Error('Image prompt is required');
    }
    // Placeholder: simulate delay and return a placeholder image.
    await this.delay(800);
    const encoded = encodeURIComponent(prompt.slice(0, 50));
    return {
      imageUrl: `https://placehold.co/512x512/1a1a2e/eee?text=${encoded}`,
    };
  }

  /**
   * Generate a video from an accepted image and a text prompt.
   * Replace implementation with real API (e.g. Runway, Pika) when ready.
   */
  async generateVideo(imageUrl: string, prompt: string): Promise<GenerateVideoResult> {
    if (!imageUrl?.trim()) {
      throw new Error('An accepted image is required');
    }
    if (!prompt?.trim()) {
      throw new Error('Video prompt is required');
    }
    await this.delay(1200);
    // Placeholder: no real video URL yet.
    return {
      videoUrl: '', // Frontend can show "Video generation not connected" when empty
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
