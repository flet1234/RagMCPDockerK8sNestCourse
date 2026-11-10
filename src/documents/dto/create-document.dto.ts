export class CreateDocumentDto {
  title!: string;
  content!: string;
}

export interface DocumentEntity {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}
