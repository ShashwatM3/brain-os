import { NextRequest, NextResponse } from 'next/server';
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from 'zod/v4';
import client from "@/lib/chroma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { report_details, collection_name } = body;

    const encoder = new TextEncoder();
    const selectedModel = openai("gpt-4o-mini");

    const stream = new ReadableStream({
      async start(controller) {
        const send = (msg: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(msg) + "\n"));
        };
        
        // ----------------------------------------------------------------------
        // -----------------------Outline Agent----------------------------------
        // ----------------------------------------------------------------------
        send({ status: "update", message: "Generating an outline for your report" });
        const { object } = await generateObject({
          model: selectedModel,
          schema: z.object({
            Outline: z.array(
              z.object({
                section: z.string().min(1, "Section title cannot be empty"),
                description: z.string().min(1, "Section description cannot be empty"),
                subsections: z.array(
                  z.object({
                    title: z.string().min(1, "Subsection title cannot be empty"),
                    description: z.string().min(1, "Subsection description cannot be empty")
                  })
                )
              })
            ),
            RefinementAgentInstructions: z
              .array(z.string().min(1, "Checkpoint cannot be empty"))
              .min(1, "There should be at least one refinement checkpoint")
          }),
          prompt: `
You are the Outline Agent for BrainOS.  
Your task is to take in the user’s specifications for a report and produce a structured plan that includes:  

1. **Outline**: A detailed outline of the report, organized into sections and subsections.  
   - Each section must include a **1–2 line description** of what the section should contain.  
   - The outline should align with the given topic, purpose, length/depth, and (if provided) structure format.  

2. **Refinement Agent Instructions**: A checklist of specific, relevant criteria that the final report must satisfy.  
   - These act as checkpoints for the Reflection Agent to verify if the generated report meets requirements.  
   - Criteria should be practical and directly connected to the topic, purpose, and expected depth.  
   - Example checkpoints: “Cite at least 3 recent studies,” “Include a comparative analysis,” “Provide an executive summary under 200 words.”  

---

### Input
- **Report Topic**: ${report_details.report_topic}
- **Report Purpose**: ${report_details.report_purpose}
- **Length and Depth**: ${report_details.report_length}
- **Structure Format**: ${report_details.report_structure}

---

### Output Format (JSON)
{
  "Outline": [
    {
      "section": "Section Title",
      "description": "1–2 line description of what this section should cover",
      "subsections": [
        {
          "title": "Subsection Title",
          "description": "1–2 line description"
        }
      ]
    }
  ],
  "RefinementAgentInstructions": [
    "Checkpoint 1",
    "Checkpoint 2",
    "Checkpoint 3"
  ]
}

          `
        });

        send({ status: "done", result: object });
        
        // ----------------------------------------------------------------------
        // -----------------------Reflection Loop--------------------------------
        // ----------------------------------------------------------------------
        send({ status: "update", message: "Starting refinment loop" });
        const refinement_instructions = "";
        while (true) {
          const { text } = await generateText({
            model: selectedModel,
            prompt: `
### Prompt for Vector DB Query Generation Agent

Role: You are the Query Generation Agent in BrainOS. Your task is to generate a small set of concise search queries that will retrieve high-quality content from a vector database for a report. These queries should collectively cover the topic, purpose, and scope defined in the report outline, providing enough context for the report generation agent to produce a complete report.

Instructions:
1. Input:
   - A JSON object containing:
     - "Outline" — structured sections and subsections, each with a "description".
     - "RefinementAgentInstructions" — optional, to understand coverage and constraints.
2. Goal:
   - Generate a **list of 3–5 queries** in total.
   - Queries should be **6–8 words long**, concise, precise, and relevant to the overall topic.
   - Ensure that the set of queries covers all major concepts described in the outline and checkpoints.
   - Queries should be self-contained and understandable without additional context.
3. Rules:
   - Focus on relevance and completeness.
   - Avoid overly generic queries like "AI in education".
   - Use terminology from the outline's sections, descriptions, and refinement instructions.
   - Output should be a JSON array of strings.

Output Format (JSON):
[
  "Query 1 (6-8 words)",
  "Query 2 (6-8 words)",
  "Query 3 (6-8 words)",
  "Query 4 (6-8 words)",
  "Query 5 (6-8 words)"
]

Example Output (based on the sample outline):
[
  "Generative AI applications impact education outcomes",
  "Recent advances AI models educational settings",
  "AI personalized learning and content generation",
  "Risks bias equity academic integrity AI",
  "Responsible AI implementation recommendations schools"
]


Input provided:
${JSON.stringify(object)}
`
          });

          if (JSON.parse(text)) {
            const list = JSON.parse(text)

            const collection = await client.getOrCreateCollection({
              name: collection_name
            });
      
            const queryResults = await collection.query({
              queryTexts: list,
              nResults: list.length() * 4,
              include: ["documents", "metadatas"]
            });
      
            let result_context = "";
            const resultantDocs: any = []
            if (queryResults?.documents?.[0]?.length) {
              queryResults.documents[0].map((doc: any, index: any) => {
                result_context += `${doc}\n\n`;
                resultantDocs.push(queryResults.metadatas[0][index]);
              });
            }

            send({ status: "done", result: result_context });
          }
        }

        // Step 2: Graphical agent
        // send({ status: "update", message: "Sent to Graphical Agent" });
        // await new Promise((r) => setTimeout(r, 1000));

        // Step 3: Final response
        // send({ status: "done", result: "Here is the final AI-generated report ✅" });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch(error: any) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}