import { Module } from '@nestjs/common';
import { AppController, HealthController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [PrismaModule, AuthModule, ProjectsModule, ContentModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
