import { NextRequest, NextResponse } from 'next/server';
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateObject } from 'ai';
import { z } from 'zod';
import client from "@/lib/chroma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, file_name, collection_name } = body;
    const selectedModel = openai("o3-mini");

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendUpdate = (type: string, data: any) => {
          const message = JSON.stringify({ type, data }) + '\n';
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        };

        try {
          // --------------------------------------------------------------
          // ---------------STEP 1: MOTIVATION + QUERIES-------------------
          // --------------------------------------------------------------
          
          sendUpdate('progress', { step: 1, message: 'Generating motivation and queries...' });

          const prompt1 = `
          ### Your Goal & Purpose
          You are an expert in creating knowledge graphs from certain file content. You are the first step in the knowledge graph creation process:
          you take in a topic given by the user (in this case: "${topic}") and generate specific queries that will be sent to a vector database containing
          chunks of file content. These queries will grab the most relevant chunks needed to create nodes.
          
          ### Your main task
          Your main task is to generate:
          1. The motivation behind creating the knowledge graph (focused on "${topic}").
          2. 3–5 concise, search-style semantic queries (not instructions) that would be directly sent to a vector database.  
             - Queries must explicitly reference or strongly relate to "${topic}".  
             - Queries should look like natural search questions or keyword-rich phrases (e.g., "core principles of Agentic Design Patterns"), 
               NOT imperative instructions like "extract" or "identify."
          
          ### Your Output Format
          Your output must be strictly a Zod-parsable object in the format:
          {
            "motivation": <string>,
            "queries": <array of 3–5 strings>
          }
          
          ### Extra Pointers to keep in mind
          1. Do not use vague placeholders like "file content" or "document" — always ground queries in "${topic}".
          2. Queries should maximize semantic coverage of the topic while remaining concise.
          3. The motivation should clearly show what the graph will focus on.
          `;

          const { object: object1 } = await generateObject({
            model: selectedModel,
            schema: z.object({
              motivation: z.string(),
              queries: z.array(z.string()),
            }),
            prompt: prompt1
          });

          const motivation = object1.motivation;
          const queries = object1.queries;

          sendUpdate('step_complete', { 
            step: 1, 
            data: { motivation, queries },
            message: 'Motivation and queries generated successfully!' 
          });

          // --------------------------------------------------------------
          // ---------------STEP 2: QUERYING VECTOR DB---------------------
          // --------------------------------------------------------------

          sendUpdate('progress', { step: 2, message: 'Querying vector database...' });

          const collection = await client.getOrCreateCollection({
            name: collection_name
          });

          const results = await collection.query({
            queryTexts: queries,
            where: { file_name: file_name },
            nResults: 3
          });

          sendUpdate('step_complete', { 
            step: 2, 
            data: { chunks_retrieved: results.documents.flat().length },
            message: 'Vector database queried successfully!' 
          });

          // --------------------------------------------------------------
          // ------------STEP 3: LLM ENTITIES EXTRACTION-------------------
          // --------------------------------------------------------------

          sendUpdate('progress', { step: 3, message: 'Extracting entities and relationships...' });

          let context = "";
          for (let i = 0; i < queries.length; i++) {
            context += `
Below are information chunks retrieved on the query: ${queries[i]}

            `;
            results.documents[i].map((doc, index) => {
              context += `
Content of chunk ${index + 1}:
${doc}

              `;
            });
          }

          const prompt2 = `
You are an expert knowledge mapper. Your task is to create a **concept graph** of a document based on a given topic.

Topic provided: ${topic}

### Input:
${context}

Each query represents an expansion of the user's topic, just to capture more surface area of knowledge to capture within the topic

### Instructions:
1. **Purpose**: Build a graph that captures the **key concepts, entities, and relationships** present in the document, focusing on information relevant to the topic. Use the queries only as **guidance/context**, not as separate graphs.

2. **Nodes**:
   - Include all major concepts, entities, organizations, or events that appear in the chunks.  
   - Assign each node a 'type' (e.g., Concept, Entity, Organization, Person, Event).  
   - Each node must have a unique 'id'.  

3. **Edges (relationships)**:
   - Show meaningful relationships between nodes, labeled with concise verbs or phrases (e.g., "causes", "affects", "is part of").  
   - Only include relationships supported by the document chunks.  

4. **Sections / Titles**:
   - Group nodes and edges into **sections** (e.g., Causes, Effects, Solutions) to make the graph readable and structured.  
   - Each section should represent a coherent cluster of related concepts from the document.  

5. **Deduplication**:
   - Merge synonyms or duplicates into single nodes.  
   - Avoid vague edges like "related to".

6. **Output**:
   - Output **ONLY valid JSON** in the format below:

### JSON Format:
{
  "sections": [
    {
      "title": "Section Name",
      "nodes": [
        {"id": "Node1", "type": "Concept"},
        {"id": "Node2", "type": "Entity"}
      ],
      "edges": [
        {"from": "Node1", "to": "Node2", "relation": "causes"}
      ]
    }
  ]
}

### Example:
Topic: Climate Change  
Queries: ["What are the causes of climate change?", "What are its effects?", "What solutions exist?"]  
Chunks: ["Climate change is caused by CO₂ emissions...", "It affects agriculture and sea levels...", "Renewable energy can mitigate effects..."]

Expected Output:
{
  "sections": [
    {
      "title": "Causes",
      "nodes": [
        {"id": "Climate Change", "type": "Concept"},
        {"id": "CO₂ Emissions", "type": "Entity"}
      ],
      "edges": [
        {"from": "CO₂ Emissions", "to": "Climate Change", "relation": "causes"}
      ]
    },
    {
      "title": "Effects",
      "nodes": [
        {"id": "Climate Change", "type": "Concept"},
        {"id": "Agriculture", "type": "Sector"},
        {"id": "Sea Level Rise", "type": "Phenomenon"}
      ],
      "edges": [
        {"from": "Climate Change", "to": "Agriculture", "relation": "affects"},
        {"from": "Climate Change", "to": "Sea Level Rise", "relation": "causes"}
      ]
    }
  ]
}

Now generate the JSON graph for the given topic, queries, and chunks.
          `;

          const { object: entities_extraction } = await generateObject({
            model: selectedModel,
            schema: z.object({
              sections: z.array(z.object({
                title: z.string(),
                nodes: z.array(z.object({
                  id: z.string(),
                  type: z.string()
                })),
                edges: z.array(z.object({
                  from: z.string(),
                  to: z.string(),
                  relation: z.string()
                }))
              }))
            }),
            prompt: prompt2
          });

          sendUpdate('step_complete', { 
            step: 3, 
            data: { 
              sections_count: entities_extraction.sections.length,
              total_nodes: entities_extraction.sections.reduce((acc, section) => acc + section.nodes.length, 0),
              total_edges: entities_extraction.sections.reduce((acc, section) => acc + section.edges.length, 0)
            },
            message: 'Entities and relationships extracted successfully!' 
          });

          // --------------------------------------------------------------
          // ------------STEP 4: LLM MERMAID GENERATION--------------------
          // --------------------------------------------------------------

          sendUpdate('progress', { step: 4, message: 'Generating Mermaid visualization...' });

          const prompt3 = `
You are an expert graph visualization generator. 

You are in the final stage of a knowledge graph pipeline: 
the concept graph of a document for a given topic has already been extracted as JSON (nodes, edges, and sections). 
Your task is to convert this JSON into a **Mermaid graph string** that can be directly rendered in a Mermaid viewer.

### Purpose:
The goal is to create a **clear, structured, readable concept map**:
- Show relationships between entities and concepts.
- Group related nodes under sections (subgraphs) based on the original JSON.
- Make it easy for a user to understand the document's main ideas and their connections.

### Instructions:
1. Use Mermaid 'graph TD' format.
2. Create one main root node if possible, representing the topic.
3. Group nodes into **subgraphs** based on their "section" field from the JSON.
   - Use 'subgraph SectionName' ... 'end'.
4. Each node should display its 'id':
   - By default, use square brackets: [NodeID].
   - Use rounded edges (NodeID) only for high-level concepts if desired.
5. For each edge:
   - Use 'NodeA -->|relation| NodeB'.
   - Keep relation labels concise (max 3 words).
6. Do **not** include any explanations, extra text, or code fencing.
7. Output **ONLY** the Mermaid graph string.

---

### Input JSON:
${JSON.stringify(entities_extraction)}

---

### Output (Mermaid string):
          `;

          const { text: mermaid_syntax } = await generateText({
            model: selectedModel,
            prompt: prompt3,
          });

          sendUpdate('step_complete', { 
            step: 4, 
            data: { mermaid_length: mermaid_syntax.length },
            message: 'Mermaid visualization generated successfully!' 
          });

          // --------------------------------------------------------------
          // ------------STEP 5: LLM Voiceover Generation------------------
          // --------------------------------------------------------------

          sendUpdate('progress', { step: 5, message: 'Generating narrative voiceover...' });

          const narrativePrompt = `
          You are a friendly guide walking someone through a knowledge graph. 
          Your job is to make the explanation casual, clear, and easy to follow — 
          like you’re pointing at the graph while talking.
          
          ### Context:
          - **Topic Focus**: ${topic}
          - **Original Motivation**: ${motivation}
          - **Document Source**: ${file_name}
          
          ### Your Mission:
          Turn the graph into a natural spoken walkthrough that feels like a tour. 
          Help the listener understand:
          1. The main themes around "${topic}"
          2. How nodes connect step by step
          3. Why the connections matter in practice
          
          ### Input Data:
          **Graph Structure:**
          ${JSON.stringify(entities_extraction, null, 2)}
          
          **Visual Representation:**
          ${mermaid_syntax}
          
          ### Style Instructions:
          - **Tone**: conversational, simple, like explaining to a friend
          - **Jargon**: avoid it; use everyday words instead
          - **Flow**: guide the listener through the graph as if their eyes are following it
          - **Transitions**: use phrases like "let’s start here", "now if we follow this branch", 
            "this connects back to…" to create a natural path
          - **Length**: 3–5 minutes of spoken audio when read out loud
          - **Feel**: engaging, like a walkthrough, not a written essay
          
          ### Structure to Follow:
          1. **Opening (1-2 sentences)**  
             - "Alright, let’s look at this graph…"  
             - State what the graph is about and point out the central hub.
          
          2. **Step-by-Step Traversal**  
             - Start at the central node.  
             - Move outward, following connections one at a time.  
             - Explain each concept simply, using analogies if needed.  
             - Keep sentences short and easy to listen to.
          
          3. **Cross-Links**  
             - Call out when one part of the graph loops back or supports another.  
             - Use “see how this ties back to…” style phrasing.
          
          4. **Wrap-Up (2-3 sentences)**  
             - Summarize the big picture in plain words.  
             - End with why the graph matters or what the listener should take away.
          
          ### Example Style:
          "Alright, so right in the middle we’ve got *Agentic Design Patterns*. That’s the big idea. 
          From here, two branches spread out — one toward agents and tools, the other toward the benefits. 
          Let’s follow the first branch…"
          
          Now, generate the complete casual walkthrough.
          `;          

          const { text: voiceover } = await generateText({
            model: selectedModel,
            prompt: narrativePrompt,
          });

          sendUpdate('step_complete', { 
            step: 5, 
            data: { voiceover_length: voiceover.length },
            message: 'Narrative voiceover generated successfully!' 
          });

          // Send final result
          sendUpdate('complete', {
            queries: object1.queries, 
            motivation: object1.motivation, 
            mermaid_syntax: mermaid_syntax, 
            entities: entities_extraction,
            voiceover: voiceover
          });

          controller.close();
        } catch (error: any) {
          console.error("Error in API:", error);
          sendUpdate('error', { message: "Failed to process: " + error.message });
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}