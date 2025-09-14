import { CloudClient } from "chromadb";
import embeddingFunction from "./embedding";  // 👈 import here

let cachedClient: CloudClient | null = null;

export function getChromaClient(): CloudClient {
  if (cachedClient) return cachedClient;

  const tenant = process.env.CHROMA_TENANT;
  const database = process.env.CHROMA_DATABASE;
  const apiKey = process.env.CHROMA_API_KEY;

  if (!apiKey) throw new Error("CHROMA_API_KEY is missing. Set it in environment variables.");
  if (!tenant) throw new Error("CHROMA_TENANT is missing. Set it in environment variables.");
  if (!database) throw new Error("CHROMA_DATABASE is missing. Set it in environment variables.");

  cachedClient = new CloudClient({ tenant, database, apiKey });
  return cachedClient;
}

// Wrap getOrCreateCollection so embeddingFunction is always included
async function getOrCreateCollectionWithEmbedding(args: any) {
  const client = getChromaClient() as any;
  return client.getOrCreateCollection({
    ...args,
    embeddingFunction, // ✅ always injected
  });
}

export default {
  ...getChromaClient(),
  getOrCreateCollection: getOrCreateCollectionWithEmbedding,
} as unknown as CloudClient;