import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY;

if (!apiKey || apiKey.trim().length === 0) {
  // Fail fast with a clear error if the API key is missing
  throw new Error('Pinecone API key is missing. Set PINECONE_API_KEY in your environment.');
}

const pc = new Pinecone({
  apiKey
});

// const index = pc.index('quickstart');
export default pc