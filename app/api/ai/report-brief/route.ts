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

        send({ status: "update", message: "Got outline + instructions" });
        
        // ----------------------------------------------------------------------
        // -----------------------Reflection Loop--------------------------------
        // ----------------------------------------------------------------------
        send({ status: "update", message: "Starting refinment loop" });

        let iteration = 1;
        let refinement_instructions = ""
        let final_report = ""
        let sources: any = []

        while (true) {
          // Generating the list of queries for Vector DB
          const { object: list } = await generateObject({
            model: selectedModel,
            schema: z.object({
              queries: z.array(z.string().min(6).max(80)).min(3).max(5)
            }),
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

            Refinement instructions provided by previous revisions of report generations:
            ${refinement_instructions}
            `,
          });
          
          // Retrieving doc info
          const collection = await client.getOrCreateCollection({
            name: collection_name
          });
    
          const queryResults = await collection.query({
            queryTexts: list.queries,
            nResults: list.queries.length * 4,
            include: ["documents", "metadatas"]
          });
    
          let result_context = "";
          if (queryResults?.documents?.[0]?.length) {
            queryResults.documents[0].map((doc: any, index: any) => {
              result_context += `
              Source: ${queryResults.metadatas[0][index].file_name || "Not given"}
              Content:
              ${doc}\n\n
              `;
              sources.push(queryResults.metadatas[0][index].file_name)
            });
          }

          // Generating the markdown report
          const { text: markdownReport } = await generateText({
            model: selectedModel,
            prompt: `
Role: You are the Report Generation Agent in BrainOS.  
Your job is to write a complete, polished report in **Markdown format** that is firmly grounded in the retrieved documents.  

You will use three inputs:  
1. **RetrievedContext** — a structured collection of document chunks from the vector database.  
2. **ReportDetails** — user-provided details (topic, purpose, length/depth, structure).  
3. **OutlineObject** — a structured outline generated by the Outline Agent.  

---

### Grounding Rules
1. **Grounded content**:  
   - Base all content on the provided RetrievedContext.  
   - Do not invent facts or examples not in the context.  
   - Do **not** include any citations or source markers.

2. **No hallucination**:  
   - Do not introduce facts, examples, or terms that are not present in RetrievedContext.  
   - If a subsection has no relevant info in RetrievedContext, explicitly write:  
     > *No relevant information was found in the provided documents for this section.*  

3. **Respect structure**:  
   - Follow the OutlineObject exactly. Every section and subsection must appear as a Markdown heading.  
   - Content under each heading must align with the description provided in the outline.

4. **Style & length**:  
   - Match the requested style, tone, and depth from ReportDetails.  
   - Ensure clarity, conciseness, and professional polish.

---

### Output Format
- Valid **Markdown** only.  
- Each section and subsection should contain grounded content with citations.  
- If a section has no coverage in RetrievedContext, state this transparently.  

---

## Inputs

### RetrievedContext
${result_context}

### ReportDetails
- **Report Topic**: ${report_details.report_topic}  
- **Report Purpose**: ${report_details.report_purpose}  
- **Length and Depth**: ${report_details.report_length}  
- **Structure Format**: ${report_details.report_structure}  

### OutlineObject
${JSON.stringify(object.Outline)}
            `,
          });

          send({ status: "update", message: `Report Version ${iteration} generated`});

          // The refinement object schema
          const RefinementAgentSchema = z.object({
            done: z.enum(["YES", "NO"]), // no required_error here
            refinements: z.string(),
          }).superRefine((obj, ctx) => {
            if (obj.done === "YES" && obj.refinements.trim() !== "") {
              ctx.addIssue({
                code: "custom",
                path: ["refinements"],
                message: "refinements must be empty when done is YES",
              });
            }
            if (obj.done === "NO" && obj.refinements.trim() === "") {
              ctx.addIssue({
                code: "custom",
                path: ["refinements"],
                message: "refinements must be non-empty when done is NO",
              });
            }
          });

          // Generating Reflection
          const { object: refinement_agent_output } = await generateObject({
            model: selectedModel,
            schema: RefinementAgentSchema,
            prompt: `
Role: You are the Refinement Agent in BrainOS. Your task is to evaluate a generated report against the provided outline, report details, and refinement instructions. You must decide whether the report is complete or requires further refinements.

Inputs:
1. GeneratedReport — the full report produced by the Report Generation Agent.
2. OutlineObject — the structured outline of the report (sections, subsections, and descriptions).
3. ReportDetails — user-provided details including topic, purpose, length/depth, and structure format.
4. RefinementAgentInstructions — a list of checkpoints that the report must satisfy.

Instructions:
1. Review the GeneratedReport carefully.
2. Check whether:
   - All sections and subsections from the OutlineObject are present and aligned with their descriptions.
   - The style, tone, and length match the ReportDetails.
   - Each checkpoint in the RefinementAgentInstructions is fully satisfied.
3. If **all requirements are met**, set:
   - done = "YES"
   - refinements = "" (empty string)
4. If **any requirements are not met**, set:
   - done = "NO"
   - refinements = a clear, actionable set of improvement instructions for the next report generation iteration.
     - Instructions should be specific (e.g., “Executive Summary exceeds 200 words, shorten it,” “Add at least two recent sources,” “Clarify risks of bias in AI-generated content”).
5. Compare the GeneratedReport against the content in RetrievedContext.
For each section and subsection:
  - If any important fact or example from RetrievedContext is missing, add it to refinements.
  - Ensure each fact in the report is supported by a chunk in RetrievedContext.
6. Output must be a JSON object with exactly two fields.

Output Format (JSON):
{
  "done": "YES" or "NO",
  "refinements": "String containing detailed refinement instructions or empty if done is YES"
}

---

## Example Output (if refinements required)

{
  "done": "NO",
  "refinements": "The Executive Summary is too long (250 words). Reduce to under 200 words. Add at least two recent studies (post-2022) in the 'Key Research Findings' section. Ensure that the 'Equity and Access' subsection discusses digital divide examples."
}

### Example Output (if complete)

{
  "done": "YES",
  "refinements": ""
}

---

## Provided inputs

### GeneratedReport
${markdownReport}

### OutlineObject
${JSON.stringify(object.Outline)}

### ReportDetails
- **Report Topic**: ${report_details.report_topic}
- **Report Purpose**: ${report_details.report_purpose}
- **Length and Depth**: ${report_details.report_length}
- **Structure Format**: ${report_details.report_structure}

### RefinementAgentInstructions
${JSON.stringify(object.RefinementAgentInstructions)}
            `
          })

          send({ status: "update", message: `Feedback generated`});

          final_report = markdownReport

          if (iteration >= 3) {
            final_report = markdownReport; // Use the current report even if not perfect
            break;
          } else if (refinement_agent_output.done == "NO") {
            iteration = iteration + 1;
            refinement_instructions = refinement_agent_output.refinements;
          } else {
            final_report = markdownReport;
            break;
          }
        }

        send({ 
          status: "done", 
          result: final_report, 
          message: "All done!", 
          sources: sources 
        });

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