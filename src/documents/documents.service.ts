import { Injectable } from '@nestjs/common';
import {
  CreateDocumentDto,
  DocumentEntity,
} from './dto/create-document.dto.js';
import { randomUUID } from 'node:crypto';

@Injectable()
export class DocumentsService {
  // In-memory storage for Phase 1 (we will upgrade this to Qdrant Vector DB in Phase 3)
  private documents: DocumentEntity[] = [];

  create(dto: CreateDocumentDto): DocumentEntity {
    const newDoc: DocumentEntity = {
      id: randomUUID(),
      title: dto.title,
      content: dto.content,
      createdAt: new Date().toISOString(),
    };
    this.documents.push(newDoc);
    return newDoc;
  }

  findAll(): DocumentEntity[] {
    return this.documents;
  }

  search(query: string): DocumentEntity[] {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return this.documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery),
    );
  }
}
