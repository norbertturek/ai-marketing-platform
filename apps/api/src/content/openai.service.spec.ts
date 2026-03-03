import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIService } from './openai.service';

type OpenAIBody = {
  model: string;
  temperature: number;
  n: number;
  max_tokens: number;
  messages: Array<{ role: string; content: string }>;
};

const mockOpenAIResponse = (
  texts: string[],
  usage = { prompt_tokens: 50, completion_tokens: 100, total_tokens: 150 },
) => ({
  ok: true,
  status: 200,
  json: () =>
    Promise.resolve({
      choices: texts.map((t) => ({ message: { content: t } })),
      usage,
    }),
});

const mockOpenAIError = (status: number, message: string) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: { message } }),
});

describe('OpenAIService', () => {
  let service: OpenAIService;
  let fetchSpy: jest.SpyInstance;

  const parseFetchBody = (): OpenAIBody =>
    JSON.parse(fetchSpy.mock.calls[0][1].body as string) as OpenAIBody;

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = 'test-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenAIService],
    }).compile();

    service = module.get(OpenAIService);
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        mockOpenAIResponse(['Post variant 1']) as unknown as Response,
      );
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    fetchSpy.mockRestore();
  });

  it('throws when OPENAI_API_KEY is not set', () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => service.getApiKey()).toThrow(
      'OPENAI_API_KEY is not configured',
    );
  });

  it('sends model and temperature to OpenAI API', async () => {
    await service.generateSocialPost({
      prompt: 'Test',
      model: 'gpt-4o',
      temperature: 0.3,
    });

    const body = parseFetchBody();
    expect(body.model).toBe('gpt-4o');
    expect(body.temperature).toBe(0.3);
  });

  it('falls back to gpt-4o-mini for invalid model', async () => {
    await service.generateSocialPost({
      prompt: 'Test',
      model: 'invalid-model',
    });

    const body = parseFetchBody();
    expect(body.model).toBe('gpt-4o-mini');
  });

  it('uses default temperature 0.7 when not specified', async () => {
    await service.generateSocialPost({ prompt: 'Test' });

    const body = parseFetchBody();
    expect(body.temperature).toBe(0.7);
  });

  it('sets n parameter for multiple variants', async () => {
    fetchSpy.mockResolvedValue(
      mockOpenAIResponse(['V1', 'V2', 'V3']) as unknown as Response,
    );

    const result = await service.generateSocialPost({
      prompt: 'Test',
      numVariants: 3,
    });

    const body = parseFetchBody();
    expect(body.n).toBe(3);
    expect(result.texts).toEqual(['V1', 'V2', 'V3']);
  });

  it('does not include variant instruction in prompt text', async () => {
    await service.generateSocialPost({
      prompt: 'Promote new shoes',
      numVariants: 3,
    });

    const body = parseFetchBody();
    const userMessage = body.messages[1].content;
    expect(userMessage).toBe('Promote new shoes');
    expect(userMessage).not.toContain('Generate');
    expect(userMessage).not.toContain('variants');
  });

  it('computes max_tokens from maxLength', async () => {
    await service.generateSocialPost({
      prompt: 'Test',
      maxLength: 200,
    });

    const body = parseFetchBody();
    expect(body.max_tokens).toBe(300); // ceil(200 * 1.5)
  });

  it('caps max_tokens at 2000', async () => {
    await service.generateSocialPost({
      prompt: 'Test',
      maxLength: 500,
    });

    const body = parseFetchBody();
    expect(body.max_tokens).toBe(750); // ceil(500 * 1.5) = 750 < 2000
  });

  it('returns token usage from response', async () => {
    const result = await service.generateSocialPost({ prompt: 'Test' });

    expect(result.usage).toEqual({
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150,
    });
  });

  it('returns the resolved model in the result', async () => {
    const result = await service.generateSocialPost({
      prompt: 'Test',
      model: 'gpt-4-turbo',
    });

    expect(result.model).toBe('gpt-4-turbo');
  });

  it('throws on OpenAI API error', async () => {
    fetchSpy.mockResolvedValue(
      mockOpenAIError(429, 'Rate limit exceeded') as unknown as Response,
    );

    await expect(
      service.generateSocialPost({ prompt: 'Test' }),
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('throws when OpenAI returns empty choices', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ choices: [], usage: {} }),
    } as unknown as Response);

    await expect(
      service.generateSocialPost({ prompt: 'Test' }),
    ).rejects.toThrow('OpenAI returned no content');
  });
});
