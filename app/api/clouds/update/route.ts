// For UPDATING a CLOUD Info: Name, ID

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();
    const metric_1 = body.metric_1;
    return NextResponse.json({ response: "" });
    
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
    
  }
}