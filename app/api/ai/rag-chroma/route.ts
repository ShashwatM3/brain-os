import { NextRequest, NextResponse } from 'next/server';
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import client from "@/lib/chroma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inputText, collectionName } = body;

    const selectedModel = openai("gpt-4o-mini");
    const prompt = `
You are the first step in a Retrieval-Augmented Generation (RAG) system.

Your job:

If the question can be answered directly without retrieval, then provide the final answer immediately.

If the question requires external knowledge (facts, dates, definitions, or topic-specific details), then DO NOT answer it. Instead, reformulate the question into a clean, concise search query for a vector database.

Always respond in JSON with this structure:

{ 
  "action": "answer" or "search", 
  "content": "your answer here OR the reformulated search query" 
}

Few-shot Examples

User: "What is 2 + 2?"
Response:

{ "action": "answer", "content": "The answer is 4." }


User: "Summarize the main theme of Shakespeare's Hamlet."
Response:

{ "action": "search", "content": "main theme of Shakespeare Hamlet" }


User: "Who is the current president of the United States?"
Response:

{ "action": "search", "content": "current president of the United States 2025" }


Additional rules:
4. For any greetings, make sure to describe that you are an assistant who will help them for any questions by retrieving context and then providing back grounded information.
5. Strictly make sure your response is ONLY a parsable JSON.

Now, process the following:

User's question: ${inputText}
    `;

    const { text } = await generateText({
      model: selectedModel,
      prompt,
    });

    let finalOut;
    try {
      finalOut = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON returned from model." }, { status: 500 });
    }

    // Direct answer
    if (finalOut.action === "answer") {
      return NextResponse.json({ response: finalOut.content });
    }

    // Search branch using ChromaDB
    try {
      const collection = await client.getOrCreateCollection({
        name: collectionName
      });

      const queryResults = await collection.query({
        queryTexts: [finalOut.content],
        nResults: 6,
        include: ["documents", "metadatas", "distances"]
      });

      let result_context = "";
      const resultantDocs: any = []
      if (queryResults?.documents?.[0]?.length) {
        queryResults.documents[0].map((doc: any, index: any) => {
          result_context += `${doc}\n\n`;
          resultantDocs.push(queryResults.metadatas[0][index]);
        });
      }

      // If no context was retrieved, still return something
      if (!result_context) {
        return NextResponse.json({
          response: "No relevant context was found in the vector database. Please refine your query.",
        });
      }

      const prompt2 = `
You are an assistant tasked with answering user questions as accurately and clearly as possible.

Rules:

1. Use ONLY the provided context to answer the user's question.
2. Answer directly and concisely; do NOT describe or summarize the context itself.
3. Only if the context is insufficient
   Then answer using your knowledge.
4. Keep answers factual, structured, and focused on directly responding to the question.

Few-shot Examples

User's question: "When was Hamlet written?"
Context: "Hamlet was likely written around 1601."
Response: "Hamlet was likely written around 1601."

User's question: "What is 2 + 2?"
Context: "" (empty or irrelevant)
Response: "The provided context does not fully answer the question, so I am using my own pre-trained knowledge. The answer is 4."

User's question: "What is quantum entanglement?"
Context: "Quantum entanglement is a phenomenon where particles remain connected so that the state of one instantly influences the state of another."
Response: "Quantum entanglement is a phenomenon where particles remain connected so that the state of one instantly influences the state of another."

Now, answer the following:

User's question: ${inputText}
Relevant context: ${result_context}
Your response:
      `;    

      const { text: finalAnswer } = await generateText({
        model: selectedModel,
        prompt: prompt2,
      });

      return NextResponse.json({
        response: finalAnswer || "Could not generate an answer.",
        documents: resultantDocs
      });

    } catch (chromaError: any) {
      console.error("ChromaDB error:", chromaError);
      return NextResponse.json(
        { error: "Failed to query ChromaDB: " + chromaError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to process: " + error.message },
      { status: 500 }
    );
  }
}