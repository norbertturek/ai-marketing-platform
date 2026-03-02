---
name: nestjs-backend
description: Build and review NestJS backend features with clear module boundaries, DTO validation, service-first business logic, and robust error handling. Use when working in apps/api or implementing API endpoints and services.
---

# NestJS Backend

## Use This Skill When

- The task touches `apps/api`.
- The user asks for endpoint, module, service, guard, interceptor, or data-layer work.
- A backend review is requested.

## Project Structure

```
apps/api/src/
├── auth/                    # Auth module (reference pattern)
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.service.spec.ts
│   ├── users.repository.ts
│   ├── auth.types.ts
│   ├── jwt-access.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── dto/
│       ├── signin.dto.ts
│       ├── register.dto.ts
│       └── refresh.dto.ts
├── prisma/                  # Global DB service
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts            # Root module
├── health.controller.ts     # Health check
└── main.ts                  # Bootstrap
prisma/
└── schema.prisma            # Database schema
```

## Implementation Workflow

1. **Define contract first:** request/response DTOs, status codes, error cases.
2. **Schema first:** if new data is needed, update `prisma/schema.prisma` and run `pnpm --filter api prisma:migrate`.
3. **Create module structure:** Module → Controller → Service → Repository → DTOs.
4. Keep controllers thin — delegate to service.
5. Map domain errors to typed NestJS exceptions in the service.
6. Add unit tests for service, e2e for endpoint contracts.
7. Run `pnpm --filter api prisma:generate` after schema changes.

## Module Pattern

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExampleController],
  providers: [ExampleService, ExampleRepository],
  exports: [ExampleService],
})
export class ExampleModule {}
```

**Rules:**
- Import `PrismaModule` for DB access
- One module per domain feature
- Export services that other modules need
- Register in `AppModule` imports

## Controller Pattern

```typescript
import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Post, Put, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('examples')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateExampleDto): Promise<ExampleResponse> {
    return this.exampleService.create(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<ExampleResponse> {
    return this.exampleService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExampleDto,
  ): Promise<ExampleResponse> {
    return this.exampleService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.exampleService.remove(id);
  }
}
```

**Rules:**
- Thin controller — no business logic, just delegates
- DTOs on `@Body()`, typed params on `@Param()`
- Explicit `@HttpCode()` for non-201 POST responses
- `@UseGuards(JwtAuthGuard)` for protected endpoints
- Return typed `Promise<ResponseType>`
- Constructor injection (NestJS convention)

## Service Pattern

```typescript
import {
  ConflictException, Injectable, InternalServerErrorException,
  NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExampleService {
  constructor(private readonly exampleRepository: ExampleRepository) {}

  async create(params: CreateExampleParams): Promise<ExampleResponse> {
    try {
      const item = await this.exampleRepository.create(params);
      return this.toResponse(item);
    } catch (error) {
      if (this.isPrismaUniqueViolation(error)) {
        throw new ConflictException('Item already exists');
      }
      throw new InternalServerErrorException('Failed to create item');
    }
  }

  async findOne(id: string): Promise<ExampleResponse> {
    const item = await this.exampleRepository.findById(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return this.toResponse(item);
  }

  private toResponse(item: PrismaExample): ExampleResponse {
    return {
      id: item.id,
      name: item.name,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private isPrismaUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
```

**Rules:**
- All business logic lives here
- No Prisma calls — delegate to repository
- Throw typed NestJS exceptions: `NotFoundException`, `ConflictException`, `UnauthorizedException`, `InternalServerErrorException`
- Private helper to map Prisma models to response types
- Config from `process.env` with sensible defaults

## Repository Pattern

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Example } from '@prisma/client';

@Injectable()
export class ExampleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Example | null> {
    return this.prisma.example.findUnique({ where: { id } });
  }

  findAll(): Promise<Example[]> {
    return this.prisma.example.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { name: string }): Promise<Example> {
    return this.prisma.example.create({ data });
  }

  update(id: string, data: { name?: string }): Promise<Example> {
    return this.prisma.example.update({ where: { id }, data });
  }

  delete(id: string): Promise<Example> {
    return this.prisma.example.delete({ where: { id } });
  }
}
```

**Rules:**
- Only place Prisma calls happen
- No business logic — just data access
- Return Prisma model types directly
- No error handling (bubbles up to service)

## DTO Pattern

```typescript
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

**Rules:**
- Use `class-validator` decorators
- Non-null assertion `!` on required fields
- `?` with `@IsOptional()` on optional fields
- One DTO per operation (Create, Update, etc.)
- File naming: `kebab-case.dto.ts` in `dto/` subfolder
- Global `ValidationPipe` handles validation automatically

## Type Definitions

```typescript
// Use `type` for response shapes and internal contracts
export type ExampleResponse = {
  id: string;
  name: string;
  createdAt: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
};
```

## Prisma Schema

```prisma
model Example {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Rules:**
- `cuid()` for IDs
- Always include `createdAt` and `updatedAt`
- After schema changes: `pnpm --filter api prisma:migrate` then `pnpm --filter api prisma:generate`

## Test Pattern (Jest)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

describe('ExampleService', () => {
  let service: ExampleService;
  let repository: jest.Mocked<ExampleRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
        {
          provide: ExampleRepository,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ExampleService);
    repository = module.get(ExampleRepository);
  });

  it('returns item when found', async () => {
    const item = {
      id: 'item_1',
      name: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.findById.mockResolvedValue(item);

    const result = await service.findOne('item_1');

    expect(result.id).toBe('item_1');
    expect(result.name).toBe('Test');
  });

  it('throws NotFoundException when item missing', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates item and returns response', async () => {
    const item = {
      id: 'item_1',
      name: 'New',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.create.mockResolvedValue(item);

    const result = await service.create({ name: 'New' });

    expect(result.name).toBe('New');
    expect(repository.create).toHaveBeenCalledWith({ name: 'New' });
  });
});
```

**Rules:**
- Jest (`jest.fn()`, not `vi.fn()`)
- `Test.createTestingModule()` setup
- Mock all repository methods
- Test happy path, not-found, conflict, and error cases
- Use `mockResolvedValue()` / `mockRejectedValue()`
- Use `rejects.toBeInstanceOf()` for exception assertions

## Quality Gates

- No untyped `any` in public paths.
- Timeouts/retries explicit for external I/O.
- Logs include context without leaking secrets.
- Module dependencies acyclic and intentional.
- Behavior changes have tests.
- DTOs validate all external input.
- Prisma calls confined to repository classes.
