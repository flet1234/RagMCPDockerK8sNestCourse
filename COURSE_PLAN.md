# Hands-On Course: NestJS + Docker + RAG (Ollama) + MCP + Kubernetes

## Project Context & User Setup
- **Target Project Folder**: `c:\Projects\RagMCPDockerK8sNestCourse` (already initialized with Git and connected to GitHub).
- **Experience Level**: Starting all 5 technologies from scratch (`NestJS`, `Docker`, `RAG`, `MCP`, `Kubernetes`).
- **Node / NPM**: Node `v24.20.0`, npm `10.9.0` installed.
- **Local LLM (Ollama)**: Installed locally with models:
  - `qwen2.5:3b` (for RAG chat/answer generation)
  - `qwen2.5-coder:3b`
  - *(To pull in Phase 3)*: `nomic-embed-text` (lightweight embedding model for vector search)
- **Docker & Kubernetes**: Not yet installed on Windows (`docker` and `kubectl` CLI not found). In Phase 2, guide the user to install **Docker Desktop for Windows** and enable its built-in **Kubernetes** cluster in Settings.

---

## What We Are Building
A **Containerized NestJS Knowledge Base Assistant** that:
1. Exposes a **NestJS REST API** to ingest documents and ask questions.
2. Uses **RAG (Retrieval-Augmented Generation)** with **Ollama** (`nomic-embed-text` + `qwen2.5:3b`) and a Vector Database (**Qdrant** or **PostgreSQL + pgvector**).
3. Exposes an **MCP (Model Context Protocol) Server** so AI clients/IDEs can call tools like `search_knowledge` and `add_document`.
4. Runs in **Docker & Docker Compose** for local multi-container development.
5. Deploys to **Kubernetes (K8s)** using Deployments, Services, ConfigMaps, and PersistentVolumeClaims.

```
[AI Agent / IDE / REST Client]
       │ (HTTP REST & MCP Protocol)
       ▼
┌───────────────────────────────────────────────┐
│ Kubernetes Cluster                            │
│  ┌─────────────────────────────────────────┐  │
│  │ NestJS Pod (Docker Container)           │  │
│  │  • DocumentsModule (REST Controller)    │  │
│  │  • RagService (Chunking + Ollama API)   │  │
│  │  • McpModule (MCP Tools & Resources)    │  │
│  └───────────────────┬─────────────────────┘  │
│                      │                        │
│                      ▼                        │
│  ┌─────────────────────────────────────────┐  │
│  │ Vector DB Pod (Qdrant in Docker)        │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

---

## Step-by-Step Curriculum

### Phase 1: NestJS Fundamentals (The Core Application)
**Goal:** Understand how NestJS structures backend applications using TypeScript decorators and Dependency Injection.
1. **Initialize NestJS** in the existing repo without overwriting Git:
   ```powershell
   npx @nestjs/cli new . --package-manager npm --skip-git
   ```
2. **Core Concepts to Explain & Build:**
   - **Modules (`@Module`)**: How `AppModule` and feature modules (`DocumentsModule`) organize code.
   - **Controllers (`@Controller`, `@Get`, `@Post`, `@Body`, `@Query`)**: Handling HTTP requests.
   - **Services & Dependency Injection (`@Injectable`)**: Separating business logic (`DocumentsService`) from HTTP routing.
   - **DTOs (Data Transfer Objects)**: Defining TypeScript interfaces/classes for request bodies (`CreateDocumentDto`).
3. **Deliverable for Phase 1:**
   - A working `DocumentsModule` with in-memory storage:
     - `POST /documents` -> saves `{ id, title, content }`
     - `GET /documents` -> lists all documents
     - `GET /documents/search?q=...` -> simple keyword search (which we will upgrade to Vector RAG in Phase 3).

---

### Phase 2: Docker & Docker Compose (Containerization)
**Goal:** Understand images vs. containers, how to package a Node/NestJS app, and how to run multi-container apps.
1. **Prerequisite Check:** Install **Docker Desktop for Windows** and verify `docker -v` and `docker compose version`.
2. **Core Concepts to Explain & Build:**
   - **What is a Container vs. a Virtual Machine?**
   - **`Dockerfile`**: Base images (`node:22-alpine`), `WORKDIR`, layer caching (`COPY package*.json`), `RUN npm ci`, `RUN npm run build`, `EXPOSE`, and `CMD`.
   - **`.dockerignore`**: Keeping `node_modules` and `.git` out of the Docker build context.
   - **`docker-compose.yml`**: Running our NestJS container alongside **Qdrant** (a lightweight, developer-friendly Vector Database: `qdrant/qdrant`) on a shared Docker network with persistent volumes.
3. **Deliverable for Phase 2:**
   - Running `docker compose up --build` starts both the NestJS API and the Qdrant vector database Dashboard (`http://localhost:6333/dashboard`).

---

### Phase 3: RAG (Retrieval-Augmented Generation) with Local Ollama
**Goal:** Understand how LLMs answer questions using your private data via embeddings and vector similarity search.
1. **Prerequisite:** Pull the embedding model in Ollama:
   ```powershell
   ollama pull nomic-embed-text
   ```
2. **Core Concepts to Explain & Build:**
   - **Why RAG?** (Context limits, hallucinations, private data).
   - **Step 1 — Chunking:** Splitting long documents into smaller overlapping chunks (e.g., 300-500 characters).
   - **Step 2 — Embeddings:** Calling Ollama's `/api/embeddings` (`nomic-embed-text`) to turn text into a 768-dimensional float vector.
   - **Step 3 — Vector Storage & Cosine Similarity:** Storing vectors + metadata in Qdrant and querying the top-$K$ closest chunks.
   - **Step 4 — Augmented Prompting:** Injecting retrieved chunks into a system prompt and calling Ollama's `/api/generate` or `/api/chat` with `qwen2.5:3b`.
3. **Deliverable for Phase 3:**
   - `POST /documents` now chunks text, generates embeddings via Ollama, and stores them in Qdrant.
   - `POST /documents/ask` takes a user question, embeds it, finds the top 3 matching chunks from Qdrant, and asks `qwen2.5:3b` to answer based strictly on those chunks.

---

### Phase 4: MCP (Model Context Protocol)
**Goal:** Turn the NestJS RAG application into an MCP Server so AI agents (like Antigravity or Claude) can use it as a native tool.
1. **Install MCP SDK & Validation:**
   ```powershell
   npm install @modelcontextprotocol/sdk zod
   ```
2. **Core Concepts to Explain & Build:**
   - **What is MCP?** (USB-C for AI: Hosts, Clients, Servers).
   - **MCP Primitives:**
     - **Tools**: Functions the AI can call (`add_knowledge`, `ask_knowledge_base`, `search_chunks`).
     - **Resources**: Read-only data URI endpoints (`docs://list`).
     - **Prompts**: Reusable prompt templates.
   - **Transports**: `stdio` (local process) vs. `SSE / Streamable HTTP` (exposed directly on a NestJS controller endpoint).
3. **Deliverable for Phase 4:**
   - An `McpModule` inside NestJS that exposes our RAG service as MCP Tools over HTTP/SSE (and/or stdio script), tested with the MCP Inspector (`npx @modelcontextprotocol/inspector`).

---

### Phase 5: Kubernetes (Container Orchestration)
**Goal:** Deploy, network, configure, and scale our containers in a real Kubernetes cluster.
1. **Enable Kubernetes:** Turn on Kubernetes inside Docker Desktop settings and verify `kubectl get nodes`.
2. **Core Concepts to Explain & Build (writing `k8s/` YAML manifests):**
   - **Pod**: The smallest deployable unit in K8s (wraps our Docker container).
   - **Deployment (`k8s/nestjs-deployment.yaml`, `k8s/qdrant-deployment.yaml`)**: Manages replica sets, self-healing, and rolling updates (`replicas: 2`).
   - **Service (`ClusterIP` vs `NodePort` / `LoadBalancer`)**: How the NestJS pods discover and talk to the Qdrant pod by DNS name (`http://qdrant-service:6333`), and how we expose NestJS to `localhost`.
   - **ConfigMap**: Passing environment variables (`QDRANT_URL`, `OLLAMA_URL=http://host.docker.internal:11434`) without hardcoding them in images.
   - **PersistentVolumeClaim (PVC)**: Keeping Qdrant vector data safe when Pods restart.
3. **Deliverable for Phase 5:**
   - Apply manifests with `kubectl apply -f k8s/`, scale the NestJS app with `kubectl scale`, inspect logs/pods, and query the RAG/MCP endpoints running inside Kubernetes.

---

## Instructions for the AI Tutor in the New Workspace
When the user opens `c:\Projects\RagMCPDockerK8sNestCourse` and shares this file:
1. Teach **one phase (and one step) at a time**.
2. Explain the **"Why"** before writing code, using clear diagrams and concise examples.
3. Start immediately with **Phase 1, Step 1**: scaffolding the NestJS application in `c:\Projects\RagMCPDockerK8sNestCourse` with `npx --yes @nestjs/cli new . --package-manager npm --skip-git` and walking the user through the generated files (`main.ts`, `app.module.ts`, `app.controller.ts`, `app.service.ts`).
