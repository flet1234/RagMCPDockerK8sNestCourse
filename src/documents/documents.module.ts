import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { RagService } from './rag.service.js';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, RagService]
})
export class DocumentsModule {}
