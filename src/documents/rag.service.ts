import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { randomUUID } from 'node:crypto';

export interface SearchChunkResult {
  score: number;
  title: string;
  chunkText: string;
  docId: string;
}

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private qdrant: QdrantClient;
  private readonly collectionName = 'documents';

  // Read URLs from environment variables (Docker/K8s) or fallback to localhost for local dev
  private readonly qdrantUrl =
    process.env.QDRANT_URL ?? 'http://localhost:6333';
  private readonly ollamaUrl =
    process.env.OLLAMA_URL ?? 'http://localhost:11434';

  constructor() {
    this.qdrant = new QdrantClient({ url: this.qdrantUrl });
  }

  // Runs automatically when NestJS starts up
  async onModuleInit() {
    try {
      const collections = await this.qdrant.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        await this.qdrant.createCollection(this.collectionName, {
          vectors: {
            size: 768, // nomic-embed-text outputs 768 dimensions
            distance: 'Cosine', // Compare vectors using Cosine Similarity
          },
        });
        this.logger.log(`Created Qdrant collection "${this.collectionName}"`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not connect to Qdrant at ${this.qdrantUrl} on startup: ${error}`,
      );
    }
  }

  // Step 1: Split long text into smaller overlapping chunks
  chunkText(text: string, chunkSize = 400, overlap = 50): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = start + chunkSize;
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }

    return chunks;
  }

  // Step 2: Turn text into a 768-number vector using Ollama (nomic-embed-text)
  async getEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { embedding: number[] };
    return data.embedding;
  }

  // Step 3: Chunk a document, embed each chunk, and save in Qdrant
  async indexDocument(
    docId: string,
    title: string,
    content: string,
  ): Promise<number> {
    const chunks = this.chunkText(content);

    const points = await Promise.all(
      chunks.map(async (chunkText, index) => {
        const vector = await this.getEmbedding(`${title}\n${chunkText}`);
        return {
          id: randomUUID(),
          vector,
          payload: {
            docId,
            title,
            chunkIndex: index,
            chunkText,
          },
        };
      }),
    );

    await this.qdrant.upsert(this.collectionName, {
      wait: true,
      points,
    });

    return chunks.length;
  }

  // Step 4: Embed a query and find the Top-K most similar chunks in Qdrant
  async searchSimilarChunks(
    query: string,
    limit = 3,
  ): Promise<SearchChunkResult[]> {
    const queryVector = await this.getEmbedding(query);

    const response = await this.qdrant.query(this.collectionName, {
      query: queryVector,
      limit,
      with_payload: true,
    });

    return response.points.map((hit) => ({
      score: hit.score,
      title: (hit.payload?.title as string) ?? '',
      chunkText: (hit.payload?.chunkText as string) ?? '',
      docId: (hit.payload?.docId as string) ?? '',
    }));
  }

  // Step 5: Retrieve Top-3 chunks + Ask qwen2.5:3b to answer based ONLY on those chunks
  async askQuestion(question: string) {
    // 1. Retrieve relevant chunks from Qdrant
    const sources = await this.searchSimilarChunks(question, 3);

    const contextText = sources
      .map((s, i) => `[Source ${i + 1}: ${s.title}]\n${s.chunkText}`)
      .join('\n\n');

    // 2. Build the Augmented Prompt
    const prompt = `You are a helpful Knowledge Base Assistant.
Answer the user's question using ONLY the provided context below.
If the answer is not in the context, say "I don't know based on the provided documents."

Context:
${contextText}

User Question: ${question}
Answer:`;

    // 3. Call Ollama (qwen2.5:3b) to generate the final answer
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama generation failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { response: string };

    return {
      question,
      answer: data.response.trim(),
      sources,
    };
  }
}
