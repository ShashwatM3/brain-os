import { OpenAIEmbeddingFunction } from "@chroma-core/openai";

const embeddingFunction = new OpenAIEmbeddingFunction({
  modelName: "text-embedding-3-small",
  apiKey: process.env.OPENAI_API_KEY!,   // 👈 use your env var
  organizationId: process.env.OPENAI_ORG_ID, // optional
});

export default embeddingFunction