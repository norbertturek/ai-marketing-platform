import { Injectable, Logger } from '@nestjs/common';

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

export interface GenerateSocialPostParams {
  prompt: string;
  platform?: string;
  researchContext?: string;
  numVariants?: number;
  maxLength?: number;
}

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

  async generateSocialPost(
    params: GenerateSocialPostParams,
  ): Promise<string[]> {
    const systemPrompt = `You are a social media marketing copywriter. Generate engaging, concise social media posts.
Format: plain text, include relevant hashtags at the end.
${params.platform ? `Tailor the tone and format for ${params.platform}.` : ''}
${params.researchContext ? `Use this research context:\n${params.researchContext}` : ''}
Keep posts under ${params.maxLength ?? 280} characters when possible for Twitter compatibility.`;
    const userPrompt =
      params.prompt +
      (params.numVariants && params.numVariants > 1
        ? `\n\nGenerate ${params.numVariants} distinct variants.`
        : '');

    const res = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        n: params.numVariants ?? 1,
        max_tokens: 500,
      }),
    });

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      this.logger.error('OpenAI API error', { status: res.status, err: json });
      throw new Error(json.error?.message ?? `OpenAI API error: ${res.status}`);
    }

    const choices = json.choices ?? [];
    const texts = choices
      .map((c) => c.message?.content?.trim())
      .filter((t): t is string => Boolean(t));

    if (texts.length === 0) {
      throw new Error('OpenAI returned no content');
    }
    return texts;
  }
}
