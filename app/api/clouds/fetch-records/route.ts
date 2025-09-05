import pc from '@/lib/pinecone';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();

    const name = body.name;
    const indexName = body.indexName;
    const indexHost = body.indexHost;
    const ids = body.ids

    const index = pc.index(indexName, indexHost).namespace(name);

    const response = await index.fetch(ids);

    // Convert the fetch response to match the expected format
    const vectors = Object.values(response.records || {});
    
    return NextResponse.json({ response: vectors });
    
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
    
  }
}