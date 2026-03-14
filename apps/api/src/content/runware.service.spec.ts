import { Test, TestingModule } from '@nestjs/testing';
import { RunwareService } from './runware.service';

const mockRunwareSuccess = (urls: string[], imageUUIDs: string[]) => ({
  ok: true,
  status: 200,
  json: () =>
    Promise.resolve({
      data: urls.map((url, i) => ({ imageURL: url, imageUUID: imageUUIDs[i] })),
    }),
});

const mockRunwareError = (message: string) => ({
  ok: false,
  status: 400,
  json: () => Promise.resolve({ errors: [{ message }] }),
});

describe('RunwareService', () => {
  let service: RunwareService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    process.env.RUNWARE_API_KEY = 'test-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [RunwareService],
    }).compile();

    service = module.get(RunwareService);
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        mockRunwareSuccess(
          ['https://example.com/1.webp'],
          ['uuid-1'],
        ) as unknown as Response,
      );
  });

  afterEach(() => {
    delete process.env.RUNWARE_API_KEY;
    fetchSpy.mockRestore();
  });

  it('throws when RUNWARE_API_KEY is not set', () => {
    delete process.env.RUNWARE_API_KEY;
    expect(() => service.getApiKey()).toThrow(
      'RUNWARE_API_KEY is not configured',
    );
  });

  it('sends imageInference task with default model and webp', async () => {
    await service.generateImages({
      prompt: 'a cat',
      numVariants: 1,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({
      taskType: 'imageInference',
      positivePrompt: 'a cat',
      model: 'runware:101@1',
      width: 1024,
      height: 1024,
      steps: 30,
      CFGScale: 7.5,
      numberResults: 1,
      outputType: 'URL',
      outputFormat: 'webp',
    });
  });

  it('sends custom model and outputFormat', async () => {
    await service.generateImages({
      prompt: 'a dog',
      model: 'civitai:123@456',
      outputFormat: 'PNG',
      numVariants: 2,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(body).toHaveLength(2);
    expect(body[0].model).toBe('civitai:123@456');
    expect(body[0].outputFormat).toBe('png');
  });

  it('returns urls and imageUUIDs from response', async () => {
    const urls = ['https://a.com/1.webp', 'https://a.com/2.webp'];
    const uuids = ['uuid-1', 'uuid-2'];
    fetchSpy.mockResolvedValueOnce(
      mockRunwareSuccess(urls, uuids) as unknown as Response,
    );

    const result = await service.generateImages({
      prompt: 'test',
      numVariants: 2,
    });

    expect(result.urls).toEqual(urls);
    expect(result.imageUUIDs).toEqual(uuids);
  });

  it('throws on API error', async () => {
    fetchSpy.mockResolvedValueOnce(
      mockRunwareError('Invalid model') as unknown as Response,
    );

    await expect(service.generateImages({ prompt: 'x' })).rejects.toThrow(
      'Invalid model',
    );
  });

  it('builds FLUX Fill payload with seed and mask images', async () => {
    await service.generateImages({
      prompt: 'replace the background',
      model: 'runware:102@1',
      seedImage: 'seed-uuid',
      maskImage: 'mask-uuid',
      numVariants: 1,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(body[0]).toMatchObject({
      taskType: 'imageInference',
      model: 'runware:102@1',
      seedImage: 'seed-uuid',
      maskImage: 'mask-uuid',
    });
  });

  it('builds FLUX Redux payload with ipAdapters', async () => {
    await service.generateImages({
      prompt: '',
      model: 'runware:105@1',
      guideImage: 'guide-uuid',
      numVariants: 1,
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string);
    expect(body[0]).toMatchObject({
      taskType: 'imageInference',
      model: 'runware:101@1',
      positivePrompt: '__BLANK__',
      ipAdapters: [{ guideImage: 'guide-uuid', model: 'runware:105@1' }],
    });
  });
});
