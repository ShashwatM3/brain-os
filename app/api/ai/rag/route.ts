// For AI Response specifically for RAG use cases

import { NextRequest, NextResponse } from 'next/server';
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inputText } = body;

    let selectedModel = openai("gpt-4o-mini")

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