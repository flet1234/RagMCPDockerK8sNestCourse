import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import type {
  AskQuestionDto,
  CreateDocumentDto,
  DocumentEntity,
} from './dto/create-document.dto.js';
import { SearchChunkResult } from './rag.service.js';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<DocumentEntity> {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  findAll(): DocumentEntity[] {
    return this.documentsService.findAll();
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<SearchChunkResult[]> {
    return this.documentsService.search(query);
  }

  // POST /documents/ask -> Full RAG Question & Answering!
  @Post('ask')
  async ask(@Body() askDto: AskQuestionDto) {
    return this.documentsService.ask(askDto.question);
  }
}
