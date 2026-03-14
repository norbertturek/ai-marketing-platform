import { Test, TestingModule } from '@nestjs/testing';
import { R2Service } from './r2.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual<typeof import('@aws-sdk/client-s3')>(
    '@aws-sdk/client-s3',
  );
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

describe('R2Service', () => {
  let service: R2Service;
  const envBackup: NodeJS.ProcessEnv = { ...process.env };

  beforeEach(async () => {
    mockSend.mockReset();
    process.env.R2_ACCOUNT_ID = 'test-account-id';
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.R2_BUCKET_NAME = 'test-bucket';
    process.env.R2_PUBLIC_URL = 'https://pub-test.r2.dev';

    const module: TestingModule = await Test.createTestingModule({
      providers: [R2Service],
    }).compile();

    service = module.get(R2Service);
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  describe('mediaKey', () => {
    it('builds key with project, post, type, index and extension', () => {
      const key = service.mediaKey('proj-1', 'post-1', 'image', 0, 'webp');
      expect(key).toMatch(/^projects\/proj-1\/posts\/post-1\/image\/\d+-0\.webp$/);
    });

    it('strips leading dot from extension', () => {
      const key = service.mediaKey('p', 'q', 'video', 1, '.mp4');
      expect(key).toMatch(/\.mp4$/);
    });

    it('defaults image to webp when extension empty', () => {
      const key = service.mediaKey('p', 'q', 'image', 0, '');
      expect(key).toMatch(/\.webp$/);
    });

    it('defaults video to mp4 when extension empty', () => {
      const key = service.mediaKey('p', 'q', 'video', 0, '');
      expect(key).toMatch(/\.mp4$/);
    });
  });

  describe('extensionFromUrl', () => {
    it('extracts extension from path', () => {
      expect(
        service.extensionFromUrl('https://example.com/photo.webp'),
      ).toBe('webp');
      expect(
        service.extensionFromUrl('https://cdn.example.com/video.mp4?token=abc'),
      ).toBe('mp4');
    });

    it('returns empty string for invalid URL', () => {
      expect(service.extensionFromUrl('not-a-url')).toBe('');
    });
  });

  describe('upload', () => {
    it('returns public URL when upload succeeds and R2_PUBLIC_URL is set', async () => {
      mockSend.mockResolvedValue(undefined);

      const result = await service.upload(
        'projects/p1/posts/p2/image/1.webp',
        Buffer.from('fake'),
        'image/webp',
      );

      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'projects/p1/posts/p2/image/1.webp',
        ContentType: 'image/webp',
      });
      expect(result).toBe(
        'https://pub-test.r2.dev/projects/p1/posts/p2/image/1.webp',
      );
    });

    it('returns null when upload fails with NoSuchBucket', async () => {
      mockSend.mockRejectedValue(
        Object.assign(new Error('The specified bucket does not exist'), {
          name: 'NoSuchBucket',
        }),
      );

      const result = await service.upload('test/key', Buffer.from('x'), 'image/webp');

      expect(result).toBeNull();
    });

    it('returns null when upload fails with generic error', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      const result = await service.upload('test/key', Buffer.from('x'), 'image/webp');

      expect(result).toBeNull();
    });
  });

  describe('uploadFromUrl', () => {
    it('fetches URL and uploads to R2, returns R2 URL on success', async () => {
      mockSend.mockResolvedValue(undefined);
      const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      } as unknown as Response);

      const result = await service.uploadFromUrl(
        'https://runware.example/image.webp',
        'projects/p/posts/q/image/0.webp',
        'image/webp',
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://runware.example/image.webp',
        expect.objectContaining({ headers: { 'User-Agent': 'AiMarketingPlatform/1.0' } }),
      );
      expect(result).toBe(
        'https://pub-test.r2.dev/projects/p/posts/q/image/0.webp',
      );

      fetchSpy.mockRestore();
    });

    it('returns original URL when fetch fails', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response);

      const result = await service.uploadFromUrl(
        'https://broken.example/missing.webp',
        'key',
        'image/webp',
      );

      expect(result).toBe('https://broken.example/missing.webp');
    });

    it('returns original URL when upload fails after fetch', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
      } as unknown as Response);
      mockSend.mockRejectedValue(new Error('R2 error'));

      const result = await service.uploadFromUrl(
        'https://example.com/img.webp',
        'key',
        'image/webp',
      );

      expect(result).toBe('https://example.com/img.webp');
    });
  });

  describe('onModuleInit', () => {
    it('calls HeadBucket and does not throw when bucket exists', async () => {
      mockSend.mockResolvedValue(undefined);

      await expect(service.onModuleInit()).resolves.toBeUndefined();

      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input).toMatchObject({ Bucket: 'test-bucket' });
    });

    it('logs but does not throw when HeadBucket fails', async () => {
      mockSend.mockRejectedValue(
        Object.assign(new Error('Not Found'), { name: 'NotFound' }),
      );

      await expect(service.onModuleInit()).resolves.toBeUndefined();
    });
  });
});

describe('R2Service (not configured)', () => {
  let service: R2Service;
  const envBackup: NodeJS.ProcessEnv = { ...process.env };

  beforeEach(async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;

    const module = await Test.createTestingModule({
      providers: [R2Service],
    }).compile();

    service = module.get(R2Service);
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('upload returns null when R2 not configured', async () => {
    const result = await service.upload('key', Buffer.from('x'), 'image/webp');
    expect(result).toBeNull();
  });

  it('uploadFromUrl returns original URL when R2 not configured', async () => {
    const result = await service.uploadFromUrl(
      'https://example.com/img.webp',
      'key',
      'image/webp',
    );
    expect(result).toBe('https://example.com/img.webp');
  });
});
