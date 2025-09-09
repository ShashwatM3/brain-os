import { Pinecone } from '@pinecone-database/pinecone';

let cachedClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    // Throw only when actually trying to use the client
    throw new Error('Pinecone API key is missing. Set PINECONE_API_KEY in your environment.');
  }
  cachedClient = new Pinecone({ apiKey });
  return cachedClient;
}

// Lazy proxy so existing imports like `pc.index(...)` keep working
const pc = new Proxy({} as Pinecone, {
  get(_target, prop) {
    const client = getPineconeClient() as any;
    return client[prop as keyof Pinecone];
  },
});

export default pc;
export { getPineconeClient };