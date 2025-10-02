# 🧠 BrainOS

A Next.js-powered knowledge management system that lets you create "clouds" to store, organize, and intelligently interact with your documents, notes, and media.

## Overview

BrainOS is your second brain—a platform for storing knowledge and extracting insights through AI-powered tools. Upload PDFs, create notes, and use advanced features like RAG chat, automated report generation, and concept graph visualization to understand your content better.

## Features

### 📁 Cloud-Based Organization
- **Create Multiple Clouds**: Organize knowledge into separate, topic-specific collections
- **Mixed Media Support**: Store PDFs, documents, and rich-text notes in one place
- **Real-time Sync**: ChromaDB-powered vector storage for fast semantic search

### 🤖 Intelligence Layer
- **General Chat**: Ask questions across your entire cloud with RAG (Retrieval-Augmented Generation)
- **Report Generation**: Automatically generate structured reports with iterative refinement
- **Concept Graphs**: Visualize knowledge as interactive Mermaid diagrams with AI-generated narratives
- **Voice Narration**: Listen to AI-generated voiceovers explaining your concept graphs

### 🔐 Authentication
- Google OAuth integration via Firebase
- Secure user-specific collections and data isolation

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Vector Database**: ChromaDB (cloud-hosted)
- **Authentication**: Firebase Auth
- **AI/LLM**: OpenAI (GPT-4o, o3-mini) via Vercel AI SDK
- **Text-to-Speech**: ElevenLabs
- **State Management**: Zustand
- **Visualization**: Mermaid.js

## Getting Started

### Prerequisites

- Node.js 20+
- npm/yarn/pnpm/bun
- OpenAI API key
- ChromaDB cloud instance (tenant, database, API key)
- Firebase project (for Google Auth)
- ElevenLabs API key (for voice features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd brain-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file:
   ```env
   # OpenAI
   OPENAI_API_KEY=your_openai_key

   # ChromaDB
   CHROMA_API_KEY=your_chroma_key
   CHROMA_TENANT=your_tenant
   CHROMA_DATABASE=your_database
   CHROMA_SERVER_CORS_ALLOW_ORIGINS='["*"]' # adjust as needed

   # ElevenLabs
   ELEVENLABS_API_KEY=your_elevenlabs_key

   # Firebase (from Firebase Console)
   # Add these to lib/firebase.js or use env vars
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Authentication
3. Enable Firestore Database
4. Copy your config into `lib/firebase.js`

## Project Structure

```
app/
├── api/              # API routes
│   ├── ai/          # AI endpoints (RAG, reports, graphs)
│   ├── chroma/      # ChromaDB operations
│   └── tts/         # Text-to-speech
├── Dashboard/       # Main dashboard and cloud management
│   └── Cloud/       # Individual cloud view & tools
├── Authentication/  # Login page
└── store.ts         # Zustand global state

components/
├── ui/              # shadcn/ui components
└── magicui/         # Custom UI effects

lib/
├── chroma.ts        # ChromaDB client
├── firebase.js      # Firebase config
├── elevenlabs.ts    # ElevenLabs client
└── embedding.ts     # OpenAI embedding function
```

## Key Workflows

### Creating a Cloud
1. Navigate to Dashboard
2. Click "Create Cloud"
3. Enter name and description
4. Upload documents or create notes

### Using Intelligence Tools
1. Open a cloud
2. Launch tools from the Intelligence Layer:
   - **General Chat**: Context-aware Q&A
   - **Create Reports**: Generate structured reports with custom instructions
   - **Concept Graph**: Visualize knowledge connections with interactive diagrams

### Document Processing
- PDFs are automatically chunked using LangChain's `RecursiveCharacterTextSplitter`
- Chunks are embedded with OpenAI's `text-embedding-3-small`
- Stored in ChromaDB with metadata (filename, category, type, cloud)

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/ai/rag-chroma` | RAG chat with ChromaDB |
| `/api/ai/report-brief` | Streaming report generation |
| `/api/ai/concept-graph` | Entity extraction & Mermaid generation |
| `/api/chroma/add` | Add documents to collection |
| `/api/chroma/create` | Creating a collection |
| `/api/chroma/delete` | Deleting certain information from collection |
| `/api/chroma/fetch-clouds-only` | For getting cloud names |
| `/api/chroma/fetch-cloud-data` | For fetching data from cloud |
| `/api/helpers/chunking` | Chunking of information (For RAG) Via LangChain |
| `/api/tts` | Text-to-speech conversion |

## Troubleshooting

- **ChromaDB errors**: Verify `CHROMA_API_KEY`, `CHROMA_TENANT`, and `CHROMA_DATABASE` are set
- **Empty search results**: Check that documents were successfully chunked and uploaded
- **Auth issues**: Ensure Firebase config matches your project settings
- **TTS not working**: Verify `ELEVENLABS_API_KEY` is valid

---
