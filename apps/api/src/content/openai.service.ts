import { Injectable, Logger } from '@nestjs/common';

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];
const DEFAULT_MODEL: AllowedModel = 'gpt-4o-mini';

export type GenerateSocialPostParams = {
  prompt: string;
  platform?: string;
  researchContext?: string;
  numVariants?: number;
  maxLength?: number;
  model?: string;
  temperature?: number;
};

export type GenerateResult = {
  texts: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
};

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);

  getApiKey(): string {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    return key;
  }

  private resolveModel(model?: string): AllowedModel {
    if (model && ALLOWED_MODELS.includes(model as AllowedModel)) {
      return model as AllowedModel;
    }
    return DEFAULT_MODEL;
  }

  async generateSocialPost(
    params: GenerateSocialPostParams,
  ): Promise<GenerateResult> {
    const model = this.resolveModel(params.model);
    const temperature = params.temperature ?? 0.7;
    const maxLength = params.maxLength ?? 280;
    const numVariants = params.numVariants ?? 1;

    const systemPrompt = `You are a social media marketing copywriter. Generate engaging, concise social media posts.
Format: plain text, include relevant hashtags at the end.
${params.platform ? `Tailor the tone and format for ${params.platform}.` : ''}
${params.researchContext ? `Use this research context:\n${params.researchContext}` : ''}
Keep posts under ${maxLength} characters when possible.`;

    const maxTokens = Math.min(Math.ceil(maxLength * 1.5), 2000);

    const res = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        n: numVariants,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
      error?: { message?: string };
    };

    if (!res.ok) {
      this.logger.error('OpenAI API error', {
        status: res.status,
        err: json,
      });
      throw new Error(json.error?.message ?? `OpenAI API error: ${res.status}`);
    }

    const choices = json.choices ?? [];
    const texts = choices
      .map((c) => c.message?.content?.trim())
      .filter((t): t is string => Boolean(t));

    if (texts.length === 0) {
      throw new Error('OpenAI returned no content');
    }

    const usage = {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
    };

    this.logger.log('Text generation completed', {
      model,
      numVariants,
      temperature,
      usage,
    });

    return { texts, usage, model };
  }
}
