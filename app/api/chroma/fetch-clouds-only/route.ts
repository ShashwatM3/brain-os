// For getting cloud names

import client, { getChromaClient } from '@/lib/chroma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Ensure client initializes with env; helpful error if missing
    getChromaClient();
    
    const collection = await client.getOrCreateCollection({
      name: 'myCollection',
      metadata: { 'description': `Collection for user: ${"myCollection"}` }
    });

    const allDocuments = await collection.get({
      limit: 300, // Limit the number of results
      offset: 0, // Start from the first result
    });

    return NextResponse.json({ response: allDocuments });
  } catch(error: any) {
    console.error("/api/chroma/fetch-clouds-only error:", error);
    return NextResponse.json(
      { error: "Failed to check: " + error.message }, 
      { status: 500 }
    );
  }
}