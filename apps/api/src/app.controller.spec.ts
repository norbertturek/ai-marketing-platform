import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('hello', () => {
    it('should return frontend-ready health payload', () => {
      expect(appController.getHello()).toEqual(
        expect.objectContaining({
          message: 'Backend is ready for frontend',
          status: 'ok',
          timestamp: expect.any(String),
        }),
      );
    });
  });
});
