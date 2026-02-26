import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Backend is ready for frontend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
