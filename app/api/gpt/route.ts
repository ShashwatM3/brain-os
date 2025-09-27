import { NextRequest, NextResponse } from 'next/server';
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inputText } = body;
  
    const selectedModel = openai("o3-mini");
  
    const { text } = await generateText({
      model: selectedModel,
      prompt: inputText,
    });
  
    return NextResponse.json({ response: text });
  } catch(error: any) {
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}