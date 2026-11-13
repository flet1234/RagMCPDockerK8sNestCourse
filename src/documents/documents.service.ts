import { Injectable } from '@nestjs/common';
import {
  CreateDocumentDto,
  DocumentEntity,
} from './dto/create-document.dto.js';
import { randomUUID } from 'node:crypto';
import { RagService, SearchChunkResult } from './rag.service.js';

@Injectable()
export class DocumentsService {
  // In-memory storage for Phase 1 (we will upgrade this to Qdrant Vector DB in Phase 3)
  private documents: DocumentEntity[] = [];

  // Dependency Injection: NestJS injects RagService into DocumentsService!
  constructor(private readonly ragService: RagService) {}

  async create(dto: CreateDocumentDto): Promise<DocumentEntity> {
    const id = randomUUID();
    // Chunk, Embed via Ollama, and Store in Qdrant Vector DB!
    const chunksIndexed = await this.ragService.indexDocument(
      id,
      dto.title,
      dto.content,
    );

    const newDoc: DocumentEntity = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      chunksIndexed,
      createdAt: new Date().toISOString(),
    };
    this.documents.push(newDoc);
    return newDoc;
  }

  findAll(): DocumentEntity[] {
    return this.documents;
  }

  async search(query: string): Promise<SearchChunkResult[]> {
    if (!query) return [];
    return this.ragService.searchSimilarChunks(query, 3);
  }

  // Full RAG: Retrieve Top-3 chunks from Qdrant + Generate Answer with qwen2.5:3b
  async ask(question: string) {
    return this.ragService.askQuestion(question);
  }
}
