import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreditsRepository } from './credits.repository';
import { CreditsService } from './credits.service';

describe('CreditsService', () => {
  let service: CreditsService;
  let repository: jest.Mocked<CreditsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        {
          provide: CreditsRepository,
          useValue: {
            getBalance: jest.fn(),
            deduct: jest.fn(),
            logUsage: jest.fn(),
            getUsageHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CreditsService);
    repository = module.get(CreditsRepository);
  });

  describe('getBalance', () => {
    it('returns balance from repository', async () => {
      repository.getBalance.mockResolvedValue(50);

      const result = await service.getBalance('user_1');

      expect(result).toBe(50);
      expect(repository.getBalance).toHaveBeenCalledWith('user_1');
    });
  });

  describe('deductAndLog', () => {
    it('deducts credits and logs usage when balance is sufficient', async () => {
      repository.getBalance.mockResolvedValue(100);
      repository.deduct.mockResolvedValue(99);
      repository.logUsage.mockResolvedValue({
        id: 'cu_1',
        userId: 'user_1',
        action: 'text_generation',
        creditsCost: 1,
        metadata: null,
        createdAt: new Date(),
      });

      const result = await service.deductAndLog(
        'user_1',
        1,
        'text_generation',
        { model: 'gpt-4o-mini' },
      );

      expect(result).toBe(99);
      expect(repository.getBalance).toHaveBeenCalledWith('user_1');
      expect(repository.deduct).toHaveBeenCalledWith('user_1', 1);
      expect(repository.logUsage).toHaveBeenCalledWith({
        userId: 'user_1',
        action: 'text_generation',
        creditsCost: 1,
        metadata: { model: 'gpt-4o-mini' },
      });
    });

    it('throws ForbiddenException when balance is insufficient', async () => {
      repository.getBalance.mockResolvedValue(0);

      await expect(
        service.deductAndLog('user_1', 1, 'text_generation'),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(repository.deduct).not.toHaveBeenCalled();
      expect(repository.logUsage).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when balance equals cost minus one', async () => {
      repository.getBalance.mockResolvedValue(4);

      await expect(
        service.deductAndLog('user_1', 5, 'image_generation'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('succeeds when balance exactly equals cost', async () => {
      repository.getBalance.mockResolvedValue(1);
      repository.deduct.mockResolvedValue(0);
      repository.logUsage.mockResolvedValue({
        id: 'cu_2',
        userId: 'user_1',
        action: 'text_generation',
        creditsCost: 1,
        metadata: null,
        createdAt: new Date(),
      });

      const result = await service.deductAndLog(
        'user_1',
        1,
        'text_generation',
      );

      expect(result).toBe(0);
      expect(repository.deduct).toHaveBeenCalledWith('user_1', 1);
    });
  });

  describe('getUsageHistory', () => {
    it('returns usage history from repository', async () => {
      const mockUsage = [
        {
          id: 'cu_1',
          userId: 'user_1',
          action: 'text_generation',
          creditsCost: 1,
          metadata: null,
          createdAt: new Date(),
        },
      ];
      repository.getUsageHistory.mockResolvedValue(mockUsage);

      const result = await service.getUsageHistory('user_1');

      expect(result).toEqual(mockUsage);
      expect(repository.getUsageHistory).toHaveBeenCalledWith('user_1');
    });
  });
});
