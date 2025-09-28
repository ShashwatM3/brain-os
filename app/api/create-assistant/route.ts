// app/api/create-assistant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { VapiClient } from "@vapi-ai/server-sdk";

const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY!
}); 

export async function POST(req: NextRequest) {
  try {
    const { name, firstMessage, voiceID, systemPrompt } = await req.json();

    if (!name || !firstMessage || !systemPrompt || !voiceID) {
      return NextResponse.json(
        { error: 'Missing required fields: name, firstMessage, systemPrompt' },
        { status: 400 }
      );
    }

    const assistant = await vapi.assistants.create({
      name,
      firstMessage,
      model: {
        provider: "openai",
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ],
        "tools": [
          {
            "type": "endCall"
          }
        ]
      },
      voice: {
        provider: "11labs",
        voiceId: voiceID
      }
    });

    return NextResponse.json({ assistant });
  } catch (error: any) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
