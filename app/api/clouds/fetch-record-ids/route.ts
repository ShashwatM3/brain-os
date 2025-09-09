import pc from '@/lib/pinecone';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
  
    const body = await req.json();
    const name = body.name;
    const indexName = body.indexName;
    const indexHost = body.indexHost;

    const index = pc.index(indexName, indexHost).namespace(`${name}`);

    const allVectors: any = [];
    let paginationToken = undefined;
  
    while (true) {
      const results = await index.listPaginated({ paginationToken });
      results.vectors?.forEach((vector) => {
        allVectors.push(vector.id);
      });
      // allVectors = allVectors.concat(results.vectors);
  
      if (!results.pagination?.next) break; // if there is no "next" token, we've reached the end
  
      paginationToken = results.pagination.next;
    }

    return NextResponse.json({ response: allVectors });
    
  } catch(error: any) {
  
    console.error("Error in API:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
    
  }
}