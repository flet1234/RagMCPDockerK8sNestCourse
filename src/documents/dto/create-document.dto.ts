export class CreateDocumentDto {
  title!: string;
  content!: string;
}

export class AskQuestionDto {
  question!: string;
}

export interface DocumentEntity {
  id: string;
  title: string;
  content: string;
  chunksIndexed?: number;
  createdAt: string;
}
