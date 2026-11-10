import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DocumentsService } from './documents.service.js';
import type {
  CreateDocumentDto,
  DocumentEntity,
} from './dto/create-document.dto.js';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto): DocumentEntity {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  findAll(): DocumentEntity[] {
    return this.documentsService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string): DocumentEntity[] {
    return this.documentsService.search(query);
  }
}
