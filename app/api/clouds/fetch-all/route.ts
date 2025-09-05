import { NextRequest, NextResponse } from 'next/server';
import pc from '@/lib/pinecone';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();
    const indexName = body.indexName;
    const indexHost = body.indexHost;

    const index = pc.index(indexName, indexHost)
    const namespaceList = await index.listNamespaces();

    return NextResponse.json({ response: namespaceList });
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
    
  }
}