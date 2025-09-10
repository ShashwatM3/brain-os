// This route is for querying chroma db

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();

    const metadata = body.metadata;
    const conversation = body.conversation;
    
    return NextResponse.json({ response: "" });
    
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
    
  }
}