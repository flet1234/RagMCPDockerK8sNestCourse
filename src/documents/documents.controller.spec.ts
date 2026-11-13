import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';

describe('DocumentsController', () => {
  let controller: DocumentsController;

  // Fake service with Vitest spy functions (vi.fn)
  const mockDocumentsService = {
    create: vi.fn((dto) => ({ id: 'mock-123', ...dto, createdAt: new Date().toISOString() })),
    findAll: vi.fn(() => []),
    search: vi.fn(() => []),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        // Tell NestJS: "When DocumentsController asks for DocumentsService, give it our mock!"
        {
          provide: DocumentsService,
          useValue: mockDocumentsService,
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('should call documentsService.create with the DTO', async () => {
    const dto = { title: 'Test', content: 'Hello' };
    const result = controller.create(dto);

    // Verify controller passed the exact DTO to the service
    expect(mockDocumentsService.create).toHaveBeenCalledWith(dto);
    expect((await result).id).toBe('mock-123');
  });
});
